from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

import models
import schemas
from auth import add_audit_log, get_current_user, require_roles
from database import get_db

router = APIRouter(prefix="/customer-accounts", tags=["customer-accounts"])
MANAGE_ROLES = require_roles("owner", "manager")
VALID_DIRECTIONS = {"receivable", "payable"}


def _status(account: models.CustomerAccount) -> str:
    remaining = max(account.amount - account.paid_amount, 0.0)
    if remaining <= 0:
        return "paid"
    if account.due_date and account.due_date < datetime.utcnow():
        return "overdue"
    if account.paid_amount > 0:
        return "partially_paid"
    return "unpaid"


def _to_out(account: models.CustomerAccount, db: Session) -> schemas.CustomerAccountOut:
    result = schemas.CustomerAccountOut.model_validate(account)
    result.customer_name = account.customer.name if account.customer else ""
    result.remaining_amount = max(account.amount - account.paid_amount, 0.0)
    result.status = _status(account)
    creator = db.query(models.User).filter(models.User.id == account.created_by).first() if account.created_by else None
    result.created_by_name = creator.name if creator else ""
    result.payments = []
    for payment in sorted(account.payments, key=lambda item: (item.payment_date, item.id)):
        payment_out = schemas.CustomerAccountPaymentOut.model_validate(payment)
        recorder = db.query(models.User).filter(models.User.id == payment.recorded_by).first() if payment.recorded_by else None
        payment_out.recorded_by_name = recorder.name if recorder else ""
        result.payments.append(payment_out)
    return result


def _get_account(account_id: int, db: Session) -> models.CustomerAccount:
    account = (
        db.query(models.CustomerAccount)
        .filter(models.CustomerAccount.id == account_id, models.CustomerAccount.is_deleted == False)
        .first()
    )
    if not account:
        raise HTTPException(status_code=404, detail="Customer account not found")
    return account


def _validate_payload(payload, db: Session):
    if payload.direction not in VALID_DIRECTIONS:
        raise HTTPException(status_code=400, detail="Direction must be receivable or payable")
    if payload.amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be greater than zero")
    customer = (
        db.query(models.Customer)
        .filter(models.Customer.id == payload.customer_id, models.Customer.is_deleted == False)
        .first()
    )
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer


@router.get("", response_model=list[schemas.CustomerAccountOut])
def list_accounts(
    customer_id: Optional[int] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    query = db.query(models.CustomerAccount).filter(models.CustomerAccount.is_deleted == False)
    if customer_id:
        query = query.filter(models.CustomerAccount.customer_id == customer_id)
    accounts = query.order_by(models.CustomerAccount.id.desc()).all()
    results = [_to_out(account, db) for account in accounts]
    if status:
        results = [account for account in results if account.status == status]
    return results


@router.get("/customer/{customer_id}", response_model=list[schemas.CustomerAccountOut])
def list_customer_accounts(
    customer_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    customer = (
        db.query(models.Customer)
        .filter(models.Customer.id == customer_id, models.Customer.is_deleted == False)
        .first()
    )
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return [_to_out(account, db) for account in customer.accounts if not account.is_deleted]


@router.post("", response_model=schemas.CustomerAccountOut)
def create_account(
    payload: schemas.CustomerAccountCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(MANAGE_ROLES),
):
    _validate_payload(payload, db)
    account = models.CustomerAccount(**payload.model_dump(), created_by=current_user.id)
    db.add(account)
    db.flush()
    add_audit_log(
        db,
        current_user.id,
        "create",
        "customer_accounts",
        f"Created {account.direction} account #{account.id} for {account.customer.name}: "
        f"{account.amount:.2f}; due {account.due_date or 'not set'}; {account.description}",
    )
    db.commit()
    db.refresh(account)
    return _to_out(account, db)


@router.put("/{account_id}", response_model=schemas.CustomerAccountOut)
def update_account(
    account_id: int,
    payload: schemas.CustomerAccountUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(MANAGE_ROLES),
):
    account = _get_account(account_id, db)
    changes = payload.model_dump(exclude_unset=True)
    if "direction" in changes and changes["direction"] not in VALID_DIRECTIONS:
        raise HTTPException(status_code=400, detail="Direction must be receivable or payable")
    if "amount" in changes and (changes["amount"] is None or changes["amount"] <= 0):
        raise HTTPException(status_code=400, detail="Amount must be greater than zero")
    if changes.get("amount", account.amount) < account.paid_amount:
        raise HTTPException(status_code=400, detail="Amount cannot be less than payments already recorded")
    for field, value in changes.items():
        setattr(account, field, value)
    add_audit_log(
        db,
        current_user.id,
        "update",
        "customer_accounts",
        f"Updated account #{account.id} for {account.customer.name}: "
        f"{', '.join(f'{key}={value}' for key, value in changes.items())}",
    )
    db.commit()
    db.refresh(account)
    return _to_out(account, db)


@router.post("/{account_id}/payments", response_model=schemas.CustomerAccountOut)
def record_payment(
    account_id: int,
    payload: schemas.CustomerAccountPaymentCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(MANAGE_ROLES),
):
    account = _get_account(account_id, db)
    if payload.amount <= 0:
        raise HTTPException(status_code=400, detail="Payment must be greater than zero")
    remaining = max(account.amount - account.paid_amount, 0.0)
    if payload.amount > remaining:
        raise HTTPException(status_code=400, detail=f"Payment cannot exceed remaining balance of {remaining:g}")
    payment = models.CustomerAccountPayment(
        account_id=account.id,
        amount=payload.amount,
        payment_method=payload.payment_method,
        payment_date=payload.payment_date or datetime.utcnow(),
        notes=payload.notes,
        recorded_by=current_user.id,
    )
    account.paid_amount += payload.amount
    db.add(payment)
    db.flush()

    transaction_type = "cashIn" if account.direction == "receivable" else "cashOut"
    direction_label = "received from" if transaction_type == "cashIn" else "paid to"
    db.add(
        models.Transaction(
            type=transaction_type,
            amount=payload.amount,
            party=account.customer.name,
            category="Customer Account Payment",
            notes=(
                f"Account #{account.id} payment #{payment.id}; {direction_label} customer; "
                f"method: {payload.payment_method}; {payload.notes}".strip()
            ),
            date=payment.payment_date,
            customer_id=account.customer_id,
            created_by=current_user.id,
            branch=account.branch,
        )
    )
    add_audit_log(
        db,
        current_user.id,
        "create",
        "customer_accounts",
        f"Recorded payment #{payment.id} of {payload.amount:.2f} for account #{account.id} "
        f"({transaction_type}, {payload.payment_method})",
    )
    db.commit()
    db.refresh(account)
    return _to_out(account, db)


@router.delete("/{account_id}")
def delete_account(
    account_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(MANAGE_ROLES),
):
    account = _get_account(account_id, db)
    account.is_deleted = True
    add_audit_log(
        db,
        current_user.id,
        "delete",
        "customer_accounts",
        f"Archived account #{account.id} for {account.customer.name}; "
        f"original {account.amount:.2f}, paid {account.paid_amount:.2f}, "
        f"remaining {max(account.amount - account.paid_amount, 0.0):.2f}",
        "delete",
    )
    db.commit()
    return {"message": "Customer account deleted"}
