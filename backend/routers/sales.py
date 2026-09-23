from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime

import models
import schemas
from database import get_db
from auth import get_current_user, add_audit_log

router = APIRouter(prefix="/sales", tags=["sales"])


def _to_out(s: models.Sale) -> schemas.SaleOut:
    out = schemas.SaleOut.model_validate(s)
    out.car_name = s.car.name if s.car else ""
    out.customer_name = s.customer.name if s.customer else ""
    out.salesperson_name = s.salesperson.name if s.salesperson else ""
    return out


@router.get("", response_model=list[schemas.SaleOut])
def list_sales(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    sales = db.query(models.Sale).order_by(models.Sale.id.desc()).all()
    return [_to_out(s) for s in sales]


@router.post("", response_model=schemas.SaleOut)
def create_sale(
    payload: schemas.SaleCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    car = db.query(models.Car).filter(models.Car.id == payload.car_id, models.Car.is_deleted == False).first()
    if not car:
        raise HTTPException(status_code=404, detail="Car not found")
    if car.status == "sold":
        raise HTTPException(status_code=400, detail="This car is already sold")

    customer = db.query(models.Customer).filter(
        models.Customer.id == payload.customer_id, models.Customer.is_deleted == False
    ).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    profit = payload.sale_price - car.purchase_price

    sale = models.Sale(
        car_id=car.id,
        customer_id=customer.id,
        sale_price=payload.sale_price,
        purchase_price=car.purchase_price,
        profit=profit,
        payment_type=payload.payment_type,
        status="completed",
        notes=payload.notes,
        salesperson_id=current_user.id,
        branch=payload.branch,
    )
    db.add(sale)

    car.status = "sold"

    current_user.cars_sold = (current_user.cars_sold or 0) + 1
    current_user.revenue_generated = (current_user.revenue_generated or 0.0) + payload.sale_price

    db.flush()

    if payload.payment_type == "installment" and payload.installment_data:
        data = payload.installment_data
        down_payment = float(data.get("down_payment", 0) or 0)
        monthly_amount = float(data.get("monthly_amount", 0) or 0)
        next_due_date = data.get("next_due_date")
        next_due = None
        if next_due_date:
            try:
                next_due = datetime.fromisoformat(next_due_date)
            except ValueError:
                next_due = None

        installment = models.Installment(
            sale_id=sale.id,
            customer_id=customer.id,
            total_amount=payload.sale_price,
            paid_amount=down_payment,
            next_due_date=next_due,
            next_installment_amount=monthly_amount,
            status="current",
        )
        db.add(installment)
        db.flush()

        if down_payment > 0:
            db.add(
                models.InstallmentPayment(
                    installment_id=installment.id,
                    amount=down_payment,
                    recorded_by=current_user.id,
                )
            )
            db.add(
                models.Transaction(
                    type="cashIn",
                    amount=down_payment,
                    party=customer.name,
                    category="Down Payment",
                    notes=f"Down payment for {car.name}",
                    customer_id=customer.id,
                    car_id=car.id,
                    created_by=current_user.id,
                    branch=payload.branch,
                )
            )
    elif payload.payment_type != "installment":
        db.add(
            models.Transaction(
                type="cashIn",
                amount=payload.sale_price,
                party=customer.name,
                category="Car Sale",
                notes=f"Sale of {car.name} ({payload.payment_type})",
                customer_id=customer.id,
                car_id=car.id,
                created_by=current_user.id,
                branch=payload.branch,
            )
        )

    add_audit_log(
        db, current_user.id, "create", "sales",
        f"Sold {car.name} to {customer.name} for {payload.sale_price}",
    )
    db.commit()
    db.refresh(sale)
    return _to_out(sale)


@router.get("/{sale_id}", response_model=schemas.SaleOut)
def get_sale(sale_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    sale = db.query(models.Sale).filter(models.Sale.id == sale_id).first()
    if not sale:
        raise HTTPException(status_code=404, detail="Sale not found")
    return _to_out(sale)
