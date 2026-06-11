"""SpaceMember model — links a user to a space with a role."""
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import GUID, Base, gen_uuid, utcnow
from app.models.enums import MemberRole, enum_column


class SpaceMember(Base):
    __tablename__ = "space_members"
    __table_args__ = (
        UniqueConstraint("space_id", "user_id", name="uq_space_member"),
    )

    id: Mapped[str] = mapped_column(GUID, primary_key=True, default=gen_uuid)
    space_id: Mapped[str] = mapped_column(
        GUID, ForeignKey("spaces.id", ondelete="CASCADE"), nullable=False, index=True
    )
    user_id: Mapped[str] = mapped_column(
        GUID, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    role: Mapped[MemberRole] = mapped_column(
        enum_column(MemberRole), default=MemberRole.member, nullable=False
    )
    joined_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, nullable=False
    )

    space = relationship("Space", back_populates="members")
    user = relationship("User", back_populates="memberships")
