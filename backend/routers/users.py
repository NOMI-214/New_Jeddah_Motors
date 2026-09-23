from datetime import date
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

import models
import schemas
from database import get_db
from auth import get_current_user, require_roles, hash_password, add_audit_log

router = APIRouter(prefix="/users", tags=["users"])


@router.get("", response_model=list[schemas.UserOut])
def list_users(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_roles("owner", "manager")),
):
    return db.query(models.User).filter(models.User.is_deleted == False).order_by(models.User.id.desc()).all()


@router.post("", response_model=schemas.UserOut)
def create_user(
    payload: schemas.UserCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_roles("owner", "manager")),
):
    existing = db.query(models.User).filter(models.User.email == payload.email.lower().strip()).first()
    if existing:
        raise HTTPException(status_code=400, detail="A user with this email already exists")

    user = models.User(
        name=payload.name,
        email=payload.email.lower().strip(),
        phone=payload.phone,
        hashed_password=hash_password(payload.password),
        role=payload.role,
        branch=payload.branch,
        address=payload.address,
        join_date=str(date.today()),
    )
    db.add(user)
    db.flush()
    add_audit_log(db, current_user.id, "create", "users", f"Created user {user.name} ({user.role})")
    db.commit()
    db.refresh(user)
    return user


@router.put("/{user_id}", response_model=schemas.UserOut)
def update_user(
    user_id: int,
    payload: schemas.UserUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_roles("owner", "manager")),
):
    user = db.query(models.User).filter(models.User.id == user_id, models.User.is_deleted == False).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    data = payload.model_dump(exclude_unset=True)
    if "password" in data:
        pwd = data.pop("password")
        if pwd:
            user.hashed_password = hash_password(pwd)
    for field, value in data.items():
        setattr(user, field, value)

    add_audit_log(db, current_user.id, "update", "users", f"Updated user {user.name}")
    db.commit()
    db.refresh(user)
    return user


@router.patch("/{user_id}/status", response_model=schemas.UserOut)
def set_user_status(
    user_id: int,
    payload: schemas.UserStatusUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_roles("owner", "manager")),
):
    user = db.query(models.User).filter(models.User.id == user_id, models.User.is_deleted == False).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.status = payload.status
    add_audit_log(db, current_user.id, "update", "users", f"Set {user.name} status to {payload.status}")
    db.commit()
    db.refresh(user)
    return user


@router.post("/{user_id}/reset-password")
def reset_password(
    user_id: int,
    payload: schemas.ResetPasswordRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_roles("owner", "manager")),
):
    user = db.query(models.User).filter(models.User.id == user_id, models.User.is_deleted == False).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.hashed_password = hash_password(payload.new_password)
    add_audit_log(db, current_user.id, "update", "users", f"Reset password for {user.name}")
    db.commit()
    return {"message": "Password reset successfully"}


@router.delete("/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_roles("owner")),
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="You cannot delete your own account")
    user.is_deleted = True
    add_audit_log(db, current_user.id, "delete", "users", f"Deleted user {user.name}", "delete")
    db.commit()
    return {"message": "User deleted"}
