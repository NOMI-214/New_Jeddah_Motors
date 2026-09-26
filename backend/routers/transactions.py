from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional

import models
import schemas
from database import get_db
from auth import get_current_user, add_audit_log

router = APIRouter(prefix="/transactions", tags=["transactions"])


def _to_out(t: models.Transaction) -> schemas.TransactionOut:
    out = schemas.TransactionOut.model_validate(t)
    out.creator_name = t.creator.name if t.creator else ""
    return out


@router.get("", response_model=list[schemas.TransactionOut])
def list_transactions(
    type: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    q = db.query(models.Transaction)
    if type:
        q = q.filter(models.Transaction.type == type)
    txns = q.order_by(models.Transaction.id.desc()).all()
    return [_to_out(t) for t in txns]


@router.post("", response_model=schemas.TransactionOut)
def create_transaction(
    payload: schemas.TransactionCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if payload.type not in ("cashIn", "cashOut"):
        raise HTTPException(status_code=400, detail="type must be cashIn or cashOut")
    txn = models.Transaction(**payload.model_dump(), created_by=current_user.id)
    db.add(txn)
    db.flush()
    add_audit_log(db, current_user.id, "create", "transactions", f"{payload.type} of {payload.amount} recorded")
    db.commit()
    db.refresh(txn)
    return _to_out(txn)


@router.delete("/{txn_id}")
def delete_transaction(
    txn_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    txn = db.query(models.Transaction).filter(models.Transaction.id == txn_id).first()
    if not txn:
        raise HTTPException(status_code=404, detail="Transaction not found")
    if txn.category == "Customer Account Payment":
        raise HTTPException(
            status_code=400,
            detail="This entry is linked to a customer account payment and cannot be deleted from the cash ledger.",
        )
    db.delete(txn)
    add_audit_log(db, current_user.id, "delete", "transactions", f"Deleted transaction #{txn_id}", "delete")
    db.commit()
    return {"message": "Transaction deleted"}
