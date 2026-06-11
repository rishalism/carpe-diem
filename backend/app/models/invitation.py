"""Invitation model — email-based invite into a space."""
from datetime import datetime
from typing import Optional

from sqlalchemy import DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import GUID, Base, TimestampMixin, gen_uuid
from app.models.enums import InvitationStatus, MemberRole, enum_column


class Invitation(Base, TimestampMixin):
    __tablename__ = "invitations"

    id: Mapped[str] = mapped_column(GUID, primary_key=True, default=gen_uuid)
    space_id: Mapped[str] = mapped_column(
        GUID, ForeignKey("spaces.id", ondelete="CASCADE"), nullable=False, index=True
    )
    inviter_id: Mapped[str] = mapped_column(
        GUID, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    email: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    token: Mapped[str] = mapped_column(String(128), unique=True, index=True, nullable=False)
    role: Mapped[MemberRole] = mapped_column(
        enum_column(MemberRole), default=MemberRole.member, nullable=False
    )
    status: Mapped[InvitationStatus] = mapped_column(
        enum_column(InvitationStatus), default=InvitationStatus.pending, nullable=False
    )
    expires_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    space = relationship("Space", back_populates="invitations")
    inviter = relationship("User")
