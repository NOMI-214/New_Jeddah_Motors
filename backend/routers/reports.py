import calendar
from collections import defaultdict
from datetime import datetime
from typing import Literal, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

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
    net_position = net_balance + outstanding_amount + accounts_receivable - accounts_payable

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
        net_position=net_position,
        accounts_receivable=accounts_receivable,
        accounts_payable=accounts_payable,
        overdue_accounts=overdue_accounts,
    )


@router.get("/dashboard-trends", response_model=schemas.DashboardTrend)
def dashboard_trends(
    period: Literal["month", "year"] = "year",
    year: int = datetime.utcnow().year,
    month: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if year < 2000 or year > 2200:
        raise HTTPException(status_code=400, detail="Year must be between 2000 and 2200")
    if period == "month" and (month is None or month < 1 or month > 12):
        raise HTTPException(status_code=400, detail="Select a month from 1 to 12")

    if period == "month":
        start = datetime(year, month, 1)
        end = datetime(year + (month == 12), 1 if month == 12 else month + 1, 1)
        bucket_count = calendar.monthrange(year, month)[1]
        labels = [str(day).zfill(2) for day in range(1, bucket_count + 1)]
        previous_start = datetime(year - (month == 1), 12 if month == 1 else month - 1, 1)
    else:
        start = datetime(year, 1, 1)
        end = datetime(year + 1, 1, 1)
        bucket_count = 12
        labels = [calendar.month_abbr[index] for index in range(1, 13)]
        previous_start = datetime(year - 1, 1, 1)

    bucket_keys = ("revenue", "profit", "expenses", "cash_in", "cash_out")
    buckets = [defaultdict(float, {key: 0.0 for key in bucket_keys}) for _ in range(bucket_count)]
    sales = db.query(models.Sale.date, models.Sale.sale_price, models.Sale.profit).filter(
        models.Sale.date >= start, models.Sale.date < end
    ).all()
    transactions = db.query(models.Transaction.date, models.Transaction.type, models.Transaction.amount).filter(
        models.Transaction.date >= start, models.Transaction.date < end
    ).all()
    expenses = db.query(models.Expense.date, models.Expense.amount).filter(
        models.Expense.date >= start,
        models.Expense.date < end,
        models.Expense.is_deleted == False,
    ).all()

    def bucket_index(value: datetime) -> int:
        return value.day - 1 if period == "month" else value.month - 1

    for sale_date, sale_price, profit in sales:
        bucket = buckets[bucket_index(sale_date)]
        bucket["revenue"] += sale_price or 0.0
        bucket["profit"] += profit or 0.0

    for txn_date, txn_type, amount in transactions:
        key = "cash_in" if txn_type == "cashIn" else "cash_out"
        buckets[bucket_index(txn_date)][key] += amount or 0.0

    for expense_date, amount in expenses:
        buckets[bucket_index(expense_date)]["expenses"] += amount or 0.0

    series = [
        schemas.DashboardTrendPoint(label=labels[index], **bucket)
        for index, bucket in enumerate(buckets)
    ]
    totals = {
        key: sum(point.model_dump()[key] for point in series)
        for key in ("revenue", "profit", "expenses", "cash_in", "cash_out")
    }
    totals["net_cash_change"] = totals["cash_in"] - totals["cash_out"] - totals["expenses"]
    previous_end = start
    previous_revenue = db.query(func.coalesce(func.sum(models.Sale.sale_price), 0.0)).filter(
        models.Sale.date >= previous_start, models.Sale.date < previous_end
    ).scalar() or 0.0
    totals["previous_revenue"] = previous_revenue
    totals["revenue_growth_percent"] = (
        ((totals["revenue"] - previous_revenue) / previous_revenue) * 100
        if previous_revenue
        else None
    )

    return schemas.DashboardTrend(
        period=period,
        year=year,
        month=month if period == "month" else None,
        start_date=start,
        end_date=end,
        totals=totals,
        series=series,
    )
