"""Admin audit-log viewing (read-only; append-only at the data layer)."""
import math
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.middleware.admin_middleware import require_admin
from app.models.user import User
from app.repositories.audit_repo import AuditRepository
from app.schemas.admin import AuditLogResponse, Paginated

router = APIRouter(prefix="/audit-logs", tags=["admin:audit"])


@router.get("", response_model=Paginated[AuditLogResponse])
def list_audit_logs(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    admin_id: Optional[str] = None,
    action: Optional[str] = None,
    resource_type: Optional[str] = None,
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    offset = (page - 1) * page_size
    rows, total = AuditRepository(db).list(
        offset=offset, limit=page_size,
        admin_id=admin_id, action=action, resource_type=resource_type,
    )
    return Paginated(
        items=[AuditLogResponse.model_validate(r) for r in rows],
        total=total,
        page=page,
        page_size=page_size,
        pages=max(1, math.ceil(total / page_size)),
    )
