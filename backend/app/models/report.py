"""Content report / moderation case.

A report is the ONLY thing that makes a journal entry or comment's content
viewable in the admin portal, and only while the case is open. See the privacy
rules in docs/admin-portal-prd.md (§5) and the moderation service.
"""
from typing import Optional

from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import GUID, Base, TimestampMixin, gen_uuid
from app.models.enums import (
    ReportContentType,
    ReportSeverity,
    ReportStatus,
    enum_column,
)


class Report(Base, TimestampMixin):
    __tablename__ = "reports"

    id: Mapped[str] = mapped_column(GUID, primary_key=True, default=gen_uuid)

    content_type: Mapped[ReportContentType] = mapped_column(
        enum_column(ReportContentType), nullable=False, index=True
    )
    # Soft reference to the reported entry/comment id (no FK cascade so the
    # report survives for the audit trail even if content is removed).
    content_id: Mapped[str] = mapped_column(GUID, nullable=False, index=True)

    # Author of the reported content.
    reported_user_id: Mapped[Optional[str]] = mapped_column(
        GUID, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )
    # Who filed it. NULL = automated/system flag.
    reporter_id: Mapped[Optional[str]] = mapped_column(
        GUID, ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )

    reason: Mapped[str] = mapped_column(String(64), nullable=False)
    details: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    status: Mapped[ReportStatus] = mapped_column(
        enum_column(ReportStatus), default=ReportStatus.open, nullable=False, index=True
    )
    severity: Mapped[ReportSeverity] = mapped_column(
        enum_column(ReportSeverity), default=ReportSeverity.medium, nullable=False, index=True
    )

    assigned_admin_id: Mapped[Optional[str]] = mapped_column(
        GUID, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )
    resolution_note: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    reported_user = relationship("User", foreign_keys=[reported_user_id])
    reporter = relationship("User", foreign_keys=[reporter_id])
    assigned_admin = relationship("User", foreign_keys=[assigned_admin_id])
