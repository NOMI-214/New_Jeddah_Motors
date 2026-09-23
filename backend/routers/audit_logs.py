from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

import models
import schemas
from database import get_db
from auth import require_roles

router = APIRouter(prefix="/audit-logs", tags=["audit-logs"])


@router.get("", response_model=list[schemas.AuditLogOut])
def list_audit_logs(
    limit: int = 200,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_roles("owner", "manager")),
):
    logs = db.query(models.AuditLog).order_by(models.AuditLog.id.desc()).limit(limit).all()
    result = []
    for log in logs:
        out = schemas.AuditLogOut.model_validate(log)
        out.user_name = log.user.name if log.user else "System"
        result.append(out)
    return result
