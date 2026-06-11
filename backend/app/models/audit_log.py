"""Append-only audit log of admin actions.

Every state-changing admin action and every moderation content view writes one
row here. Records are never edited or deleted through the application — the
service layer only ever inserts (see app.services.audit_service).
"""
from datetime import datetime
from typing import Optional

from sqlalchemy import JSON, DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import GUID, Base, gen_uuid, utcnow


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id: Mapped[str] = mapped_column(GUID, primary_key=True, default=gen_uuid)

    # Who acted. admin_name/admin_role are denormalized so the log stays
    # readable even if the user is later renamed or deleted.
    admin_id: Mapped[Optional[str]] = mapped_column(
        GUID, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )
    admin_name: Mapped[str] = mapped_column(String(255), nullable=False)
    admin_role: Mapped[str] = mapped_column(String(32), nullable=False)

    # What happened. action is a machine code like "user.suspend".
    action: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    resource_type: Mapped[Optional[str]] = mapped_column(String(32), nullable=True, index=True)
    resource_id: Mapped[Optional[str]] = mapped_column(String(64), nullable=True, index=True)

    reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    # Optional structured before/after snapshot for high-value changes.
    meta: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)

    result: Mapped[str] = mapped_column(String(16), default="success", nullable=False)
    ip_address: Mapped[Optional[str]] = mapped_column(String(64), nullable=True, index=True)
    user_agent: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)

    # Audit rows are immutable; only a creation timestamp (no updated_at).
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, nullable=False, index=True
    )

    admin = relationship("User", foreign_keys=[admin_id])
