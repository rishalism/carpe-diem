"""Reaction model — one row per (entry, user, type)."""
from sqlalchemy import ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import GUID, Base, TimestampMixin, gen_uuid
from app.models.enums import ReactionType, enum_column


class Reaction(Base, TimestampMixin):
    __tablename__ = "reactions"
    __table_args__ = (
        UniqueConstraint("entry_id", "user_id", "type", name="uq_reaction"),
    )

    id: Mapped[str] = mapped_column(GUID, primary_key=True, default=gen_uuid)
    entry_id: Mapped[str] = mapped_column(
        GUID, ForeignKey("journal_entries.id", ondelete="CASCADE"), nullable=False, index=True
    )
    user_id: Mapped[str] = mapped_column(
        GUID, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    type: Mapped[ReactionType] = mapped_column(enum_column(ReactionType), nullable=False)

    entry = relationship("JournalEntry", back_populates="reactions")
    user = relationship("User", back_populates="reactions")
