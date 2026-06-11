"""Audit logging service.

Every state-changing admin action and every moderation content view should call
``AuditService.record(...)``. The admin's name and role are denormalized onto
the row so the log remains meaningful even if the account is later changed.
"""
from typing import Optional

from sqlalchemy.orm import Session

from app.models.audit_log import AuditLog
from app.models.user import User
from app.repositories.audit_repo import AuditRepository


class AuditService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = AuditRepository(db)

    def record(
        self,
        *,
        admin: User,
        action: str,
        resource_type: Optional[str] = None,
        resource_id: Optional[str] = None,
        reason: Optional[str] = None,
        meta: Optional[dict] = None,
        result: str = "success",
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        commit: bool = True,
    ) -> AuditLog:
        log = AuditLog(
            admin_id=admin.id,
            admin_name=admin.username,
            admin_role=admin.role.value,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            reason=reason,
            meta=meta,
            result=result,
            ip_address=ip_address,
            user_agent=user_agent,
        )
        self.repo.add(log)
        if commit:
            self.db.commit()
        return log
