"""Space model — a permission-based journal area."""
from typing import Optional

from sqlalchemy import Boolean, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import GUID, Base, TimestampMixin, gen_uuid
from app.models.enums import SpaceType, enum_column


class Space(Base, TimestampMixin):
    __tablename__ = "spaces"

    id: Mapped[str] = mapped_column(GUID, primary_key=True, default=gen_uuid)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    type: Mapped[SpaceType] = mapped_column(
        enum_column(SpaceType), default=SpaceType.personal, nullable=False
    )
    cover_image_url: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)
    owner_id: Mapped[str] = mapped_column(
        GUID, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    archived: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    owner = relationship("User", back_populates="owned_spaces")
    members = relationship(
        "SpaceMember", back_populates="space", cascade="all, delete-orphan"
    )
    entries = relationship(
        "JournalEntry", back_populates="space", cascade="all, delete-orphan"
    )
    invitations = relationship(
        "Invitation", back_populates="space", cascade="all, delete-orphan"
    )
