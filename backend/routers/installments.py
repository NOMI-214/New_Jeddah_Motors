from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime

import models
import schemas
from database import get_db
from auth import get_current_user, add_audit_log

router = APIRouter(prefix="/installments", tags=["installments"])


def _to_out(i: models.Installment) -> schemas.InstallmentOut:
    out = schemas.InstallmentOut.model_validate(i)
    out.remaining_amount = max(i.total_amount - i.paid_amount, 0.0)
    out.customer_name = i.customer.name if i.customer else ""
    out.car_name = i.sale.car.name if i.sale and i.sale.car else ""
    return out


@router.get("", response_model=list[schemas.InstallmentOut])
def list_installments(
    status: str | None = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    q = db.query(models.Installment)
    if status:
        q = q.filter(models.Installment.status == status)
    installments = q.order_by(models.Installment.id.desc()).all()

    # Auto-flag overdue plans
    today = datetime.utcnow()
    changed = False
    for i in installments:
        if i.status == "current" and i.next_due_date and i.next_due_date < today and i.paid_amount < i.total_amount:
            i.status = "overdue"
            changed = True
    if changed:
        db.commit()

    return [_to_out(i) for i in installments]


@router.get("/{installment_id}", response_model=schemas.InstallmentOut)
def get_installment(installment_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    i = db.query(models.Installment).filter(models.Installment.id == installment_id).first()
    if not i:
        raise HTTPException(status_code=404, detail="Installment plan not found")
    return _to_out(i)


@router.post("/{installment_id}/payments", response_model=schemas.InstallmentOut)
def add_payment(
    installment_id: int,
    payload: schemas.InstallmentPaymentCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    installment = db.query(models.Installment).filter(models.Installment.id == installment_id).first()
    if not installment:
        raise HTTPException(status_code=404, detail="Installment plan not found")
    if payload.amount <= 0:
        raise HTTPException(status_code=400, detail="Payment amount must be positive")

    payment = models.InstallmentPayment(
        installment_id=installment.id,
        amount=payload.amount,
        payment_date=payload.payment_date or datetime.utcnow(),
        recorded_by=current_user.id,
    )
    db.add(payment)

    installment.paid_amount = (installment.paid_amount or 0.0) + payload.amount

    if payload.next_due_date:
        installment.next_due_date = payload.next_due_date
    if payload.next_installment_amount is not None:
        installment.next_installment_amount = payload.next_installment_amount

    if installment.paid_amount >= installment.total_amount:
        installment.status = "completed"
        installment.next_due_date = None
    else:
        installment.status = "current"

    car = installment.sale.car if installment.sale else None
    db.add(
        models.Transaction(
            type="cashIn",
            amount=payload.amount,
            party=installment.customer.name if installment.customer else "",
            category="Installment Payment",
            notes=f"Installment payment for {car.name if car else 'sale #' + str(installment.sale_id)}",
            customer_id=installment.customer_id,
            car_id=car.id if car else None,
            created_by=current_user.id,
        )
    )

    add_audit_log(
        db, current_user.id, "create", "installments",
        f"Recorded installment payment of {payload.amount} for plan #{installment.id}",
    )
    db.commit()
    db.refresh(installment)
    return _to_out(installment)


@router.put("/{installment_id}", response_model=schemas.InstallmentOut)
def update_installment(
    installment_id: int,
    payload: schemas.InstallmentUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    installment = db.query(models.Installment).filter(models.Installment.id == installment_id).first()
    if not installment:
        raise HTTPException(status_code=404, detail="Installment plan not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(installment, field, value)
    add_audit_log(db, current_user.id, "update", "installments", f"Updated installment plan #{installment.id}")
    db.commit()
    db.refresh(installment)
    return _to_out(installment)
