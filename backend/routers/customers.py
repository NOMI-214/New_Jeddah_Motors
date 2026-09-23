from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional

import models
import schemas
from database import get_db
from auth import get_current_user, add_audit_log

router = APIRouter(prefix="/customers", tags=["customers"])


def _to_out(db: Session, c: models.Customer) -> schemas.CustomerOut:
    cars_purchased = db.query(models.Sale).filter(models.Sale.customer_id == c.id).count()
    outstanding = 0.0
    for inst in c.installments:
        outstanding += max(inst.total_amount - inst.paid_amount, 0.0)
    out = schemas.CustomerOut.model_validate(c)
    out.cars_purchased = cars_purchased
    out.outstanding_amount = outstanding
    return out


@router.get("", response_model=list[schemas.CustomerOut])
def list_customers(
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    q = db.query(models.Customer).filter(models.Customer.is_deleted == False)
    if search:
        like = f"%{search}%"
        q = q.filter(
            (models.Customer.name.ilike(like))
            | (models.Customer.phone.ilike(like))
            | (models.Customer.cnic.ilike(like))
        )
    customers = q.order_by(models.Customer.id.desc()).all()
    return [_to_out(db, c) for c in customers]


@router.get("/{customer_id}", response_model=schemas.CustomerOut)
def get_customer(customer_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    c = db.query(models.Customer).filter(models.Customer.id == customer_id, models.Customer.is_deleted == False).first()
    if not c:
        raise HTTPException(status_code=404, detail="Customer not found")
    return _to_out(db, c)


@router.post("", response_model=schemas.CustomerOut)
def create_customer(
    payload: schemas.CustomerCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    customer = models.Customer(**payload.model_dump(), created_by=current_user.id)
    db.add(customer)
    db.flush()
    add_audit_log(db, current_user.id, "create", "customers", f"Added customer {customer.name}")
    db.commit()
    db.refresh(customer)
    return _to_out(db, customer)


@router.put("/{customer_id}", response_model=schemas.CustomerOut)
def update_customer(
    customer_id: int,
    payload: schemas.CustomerUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    c = db.query(models.Customer).filter(models.Customer.id == customer_id, models.Customer.is_deleted == False).first()
    if not c:
        raise HTTPException(status_code=404, detail="Customer not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(c, field, value)
    add_audit_log(db, current_user.id, "update", "customers", f"Updated customer {c.name}")
    db.commit()
    db.refresh(c)
    return _to_out(db, c)


@router.delete("/{customer_id}")
def delete_customer(
    customer_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    c = db.query(models.Customer).filter(models.Customer.id == customer_id, models.Customer.is_deleted == False).first()
    if not c:
        raise HTTPException(status_code=404, detail="Customer not found")
    c.is_deleted = True
    add_audit_log(db, current_user.id, "delete", "customers", f"Deleted customer {c.name}", "delete")
    db.commit()
    return {"message": "Customer deleted"}
