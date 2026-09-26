import random
import traceback
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

import models
import schemas
from database import get_db, settings
from emailer import send_otp_email
from auth import (
    verify_password,
    hash_password,
    create_token,
    get_current_user,
    add_audit_log,
)

router = APIRouter(prefix="/auth", tags=["auth"])


def _generate_otp() -> str:
    return f"{random.randint(0, 999999):06d}"


def _owner_exists_for_branch(db: Session, branch: str) -> bool:
    return (
        db.query(models.User)
        .filter(
            models.User.role == "owner",
            models.User.branch == branch,
            models.User.is_deleted == False,
        )
        .first()
        is not None
    )


@router.get("/setup-status", response_model=schemas.SetupStatus)
def setup_status(db: Session = Depends(get_db)):
    """Tells the frontend whether the very first admin account still needs
    to be created. Once one exists, public signup is locked."""
    return {"needs_setup": db.query(models.User).filter(models.User.is_deleted == False).first() is None}


@router.post("/signup/request-otp")
def signup_request_otp(payload: schemas.SignupRequest, db: Session = Depends(get_db)):
    email = payload.email.lower().strip()
    if "@" not in email or "." not in email.split("@")[-1]:
        raise HTTPException(status_code=400, detail="Please enter a valid email address")
    if len(payload.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
    branch = payload.branch.strip()
    if not branch:
        raise HTTPException(status_code=400, detail="Please select a branch")
    if _owner_exists_for_branch(db, branch):
        raise HTTPException(status_code=403, detail="This branch already has an owner. Please log in instead.")

    # Clear any previous pending OTPs for this email
    db.query(models.EmailOTP).filter(
        models.EmailOTP.email == email, models.EmailOTP.purpose == "signup"
    ).delete()

    otp = _generate_otp()
    record = models.EmailOTP(
        email=email,
        otp_code=otp,
        purpose="signup",
        pending_name=payload.name,
        pending_phone=payload.phone,
        pending_branch=branch,
        pending_password_hash=hash_password(payload.password),
        expires_at=datetime.utcnow() + timedelta(minutes=settings.otp_expire_minutes),
    )
    db.add(record)
    db.commit()

    try:
        send_otp_email(email, otp, name=payload.name)
    except Exception as exc:
        print(f"OTP email delivery failed for {email}: {exc}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Could not send verification email. Check SMTP settings and try again.")

    return {"message": f"A verification code was sent to {email}", "expires_in_minutes": settings.otp_expire_minutes}


@router.post("/signup/resend-otp")
def signup_resend_otp(payload: schemas.ResendOTP, db: Session = Depends(get_db)):
    email = payload.email.lower().strip()
    record = (
        db.query(models.EmailOTP)
        .filter(models.EmailOTP.email == email, models.EmailOTP.purpose == "signup", models.EmailOTP.is_used == False)
        .order_by(models.EmailOTP.id.desc())
        .first()
    )
    if not record:
        raise HTTPException(status_code=404, detail="No pending signup found for this email. Please start again.")

    otp = _generate_otp()
    record.otp_code = otp
    record.attempts = 0
    record.expires_at = datetime.utcnow() + timedelta(minutes=settings.otp_expire_minutes)
    db.commit()

    try:
        send_otp_email(email, otp, name=record.pending_name)
    except Exception:
        raise HTTPException(status_code=500, detail="Could not resend verification email.")

    return {"message": f"A new code was sent to {email}"}


@router.post("/signup/verify-otp", response_model=schemas.TokenResponse)
def signup_verify_otp(payload: schemas.OTPVerify, db: Session = Depends(get_db)):
    email = payload.email.lower().strip()
    record = (
        db.query(models.EmailOTP)
        .filter(models.EmailOTP.email == email, models.EmailOTP.purpose == "signup", models.EmailOTP.is_used == False)
        .order_by(models.EmailOTP.id.desc())
        .first()
    )
    if not record:
        raise HTTPException(status_code=404, detail="No pending signup found for this email. Please start again.")

    if record.expires_at < datetime.utcnow():
        raise HTTPException(status_code=400, detail="This code has expired. Please request a new one.")

    if record.attempts >= 5:
        raise HTTPException(status_code=429, detail="Too many incorrect attempts. Please request a new code.")

    if record.otp_code != payload.otp.strip():
        record.attempts += 1
        db.commit()
        raise HTTPException(status_code=400, detail="Incorrect code. Please try again.")

    # Double-check no one else completed setup in the meantime (race condition)
    from datetime import date as _date

    if _owner_exists_for_branch(db, record.pending_branch):
        raise HTTPException(status_code=403, detail="This branch already has an owner. Please log in instead.")

    user = models.User(
        name=record.pending_name,
        email=email,
        phone=record.pending_phone,
        branch=record.pending_branch or "Main Branch",
        hashed_password=record.pending_password_hash,
        role="owner",
        status="active",
        join_date=str(_date.today()),
    )
    db.add(user)
    record.is_used = True
    db.flush()

    add_audit_log(db, user.id, "create", "auth", f"Admin account created for {user.name} via email verification", "auth")
    db.commit()
    db.refresh(user)

    token = create_token(user.id)
    return {"access_token": token, "user": user}


@router.post("/login", response_model=schemas.TokenResponse)
def login(payload: schemas.LoginRequest, db: Session = Depends(get_db)):
    user = (
        db.query(models.User)
        .filter(models.User.email == payload.email.lower().strip(), models.User.is_deleted == False)
        .first()
    )
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if user.status != "active":
        raise HTTPException(status_code=403, detail="This account has been deactivated")

    token = create_token(user.id)
    add_audit_log(db, user.id, "login", "auth", f"{user.name} logged in", "auth")
    db.commit()
    return {"access_token": token, "user": user}


@router.get("/me", response_model=schemas.UserOut)
def me(current_user: models.User = Depends(get_current_user)):
    return current_user


@router.post("/change-password")
def change_password(
    payload: schemas.ChangePasswordRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if not verify_password(payload.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    if payload.new_password != payload.confirm_password:
        raise HTTPException(status_code=400, detail="New passwords do not match")
    if len(payload.new_password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")

    current_user.hashed_password = hash_password(payload.new_password)
    add_audit_log(db, current_user.id, "update", "auth", "Changed password", "update")
    db.commit()
    return {"message": "Password updated successfully"}
