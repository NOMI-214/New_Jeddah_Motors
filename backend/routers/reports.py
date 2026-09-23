from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime

import models
import schemas
from database import get_db
from auth import get_current_user

router = APIRouter(prefix="/reports", tags=["reports"])


@router.get("/dashboard", response_model=schemas.DashboardStats)
def dashboard(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    total_cars = db.query(models.Car).filter(models.Car.is_deleted == False).count()
    available_cars = db.query(models.Car).filter(models.Car.is_deleted == False, models.Car.status == "available").count()
    reserved_cars = db.query(models.Car).filter(models.Car.is_deleted == False, models.Car.status == "reserved").count()
    sold_cars = db.query(models.Car).filter(models.Car.is_deleted == False, models.Car.status == "sold").count()

    total_customers = db.query(models.Customer).filter(models.Customer.is_deleted == False).count()

    total_sales = db.query(models.Sale).count()
    total_revenue = db.query(func.coalesce(func.sum(models.Sale.sale_price), 0.0)).scalar() or 0.0
    total_profit = db.query(func.coalesce(func.sum(models.Sale.profit), 0.0)).scalar() or 0.0

    total_expenses = (
        db.query(func.coalesce(func.sum(models.Expense.amount), 0.0))
        .filter(models.Expense.is_deleted == False)
        .scalar()
        or 0.0
    )

    cash_in = (
        db.query(func.coalesce(func.sum(models.Transaction.amount), 0.0))
        .filter(models.Transaction.type == "cashIn")
        .scalar()
        or 0.0
    )
    cash_out = (
        db.query(func.coalesce(func.sum(models.Transaction.amount), 0.0))
        .filter(models.Transaction.type == "cashOut")
        .scalar()
        or 0.0
    )

    pending_installments = db.query(models.Installment).filter(models.Installment.status != "completed").count()

    installments = db.query(models.Installment).filter(models.Installment.status != "completed").all()
    outstanding_amount = sum(max(i.total_amount - i.paid_amount, 0.0) for i in installments)

    net_balance = cash_in - cash_out - total_expenses

    accounts = db.query(models.CustomerAccount).filter(models.CustomerAccount.is_deleted == False).all()
    accounts_receivable = sum(max(account.amount - account.paid_amount, 0.0) for account in accounts if account.direction == "receivable")
    accounts_payable = sum(max(account.amount - account.paid_amount, 0.0) for account in accounts if account.direction == "payable")
    overdue_accounts = sum(
        1 for account in accounts
        if account.amount > account.paid_amount
        and account.due_date is not None
        and account.due_date < datetime.utcnow()
    )

    return schemas.DashboardStats(
        total_cars=total_cars,
        available_cars=available_cars,
        reserved_cars=reserved_cars,
        sold_cars=sold_cars,
        total_customers=total_customers,
        total_sales=total_sales,
        total_revenue=total_revenue,
        total_profit=total_profit,
        total_expenses=total_expenses,
        cash_in=cash_in,
        cash_out=cash_out,
        pending_installments=pending_installments,
        outstanding_amount=outstanding_amount,
        net_balance=net_balance,
        accounts_receivable=accounts_receivable,
        accounts_payable=accounts_payable,
        overdue_accounts=overdue_accounts,
    )
