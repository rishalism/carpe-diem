"""Comment model — supports nested replies via parent_id."""
from typing import Optional

from sqlalchemy import ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import GUID, Base, TimestampMixin, gen_uuid


class Comment(Base, TimestampMixin):
    __tablename__ = "comments"

    id: Mapped[str] = mapped_column(GUID, primary_key=True, default=gen_uuid)
    entry_id: Mapped[str] = mapped_column(
        GUID, ForeignKey("journal_entries.id", ondelete="CASCADE"), nullable=False, index=True
    )
    author_id: Mapped[str] = mapped_column(
        GUID, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    parent_id: Mapped[Optional[str]] = mapped_column(
        GUID, ForeignKey("comments.id", ondelete="CASCADE"), nullable=True, index=True
    )
    content: Mapped[str] = mapped_column(Text, nullable=False)

    entry = relationship("JournalEntry", back_populates="comments")
    author = relationship("User", back_populates="comments")
    replies = relationship(
        "Comment",
        back_populates="parent",
        cascade="all, delete-orphan",
    )
    parent = relationship(
        "Comment",
        back_populates="replies",
        remote_side="Comment.id",
    )
