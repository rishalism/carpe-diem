"""JournalEntry model."""
from typing import Optional

from sqlalchemy import Boolean, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import GUID, Base, TimestampMixin, gen_uuid
from app.models.enums import AIStatus, Mood, enum_column
from app.models.tag import entry_tags


class JournalEntry(Base, TimestampMixin):
    __tablename__ = "journal_entries"

    id: Mapped[str] = mapped_column(GUID, primary_key=True, default=gen_uuid)
    space_id: Mapped[str] = mapped_column(
        GUID, ForeignKey("spaces.id", ondelete="CASCADE"), nullable=False, index=True
    )
    author_id: Mapped[str] = mapped_column(
        GUID, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False, default="")
    content_enhanced: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    enhanced_active: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    ai_status: Mapped[AIStatus] = mapped_column(
        enum_column(AIStatus), default=AIStatus.none, nullable=False
    )
    mood: Mapped[Optional[Mood]] = mapped_column(enum_column(Mood), nullable=True)

    space = relationship("Space", back_populates="entries")
    author = relationship("User", back_populates="entries")
    tags = relationship("Tag", secondary=entry_tags, back_populates="entries")
    attachments = relationship(
        "Attachment", back_populates="entry", cascade="all, delete-orphan"
    )
    comments = relationship(
        "Comment", back_populates="entry", cascade="all, delete-orphan"
    )
    reactions = relationship(
        "Reaction", back_populates="entry", cascade="all, delete-orphan"
    )
