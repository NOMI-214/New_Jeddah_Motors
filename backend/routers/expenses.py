from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

import models
import schemas
from database import get_db
from auth import get_current_user, add_audit_log

router = APIRouter(prefix="/expenses", tags=["expenses"])


def _to_out(e: models.Expense) -> schemas.ExpenseOut:
    out = schemas.ExpenseOut.model_validate(e)
    out.creator_name = e.creator.name if e.creator else ""
    return out


@router.get("", response_model=list[schemas.ExpenseOut])
def list_expenses(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    expenses = (
        db.query(models.Expense)
        .filter(models.Expense.is_deleted == False)
        .order_by(models.Expense.id.desc())
        .all()
    )
    return [_to_out(e) for e in expenses]


@router.post("", response_model=schemas.ExpenseOut)
def create_expense(
    payload: schemas.ExpenseCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    expense = models.Expense(**payload.model_dump(), created_by=current_user.id)
    db.add(expense)
    db.flush()
    add_audit_log(db, current_user.id, "create", "expenses", f"Recorded {payload.category} expense of {payload.amount}")
    db.commit()
    db.refresh(expense)
    return _to_out(expense)


@router.delete("/{expense_id}")
def delete_expense(
    expense_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    expense = db.query(models.Expense).filter(models.Expense.id == expense_id, models.Expense.is_deleted == False).first()
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    expense.is_deleted = True
    add_audit_log(db, current_user.id, "delete", "expenses", f"Deleted expense #{expense_id}", "delete")
    db.commit()
    return {"message": "Expense deleted"}
