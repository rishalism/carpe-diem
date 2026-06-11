"""Attachment model — file linked to a journal entry."""
from typing import Optional

from sqlalchemy import ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import GUID, Base, TimestampMixin, gen_uuid


class Attachment(Base, TimestampMixin):
    __tablename__ = "attachments"

    id: Mapped[str] = mapped_column(GUID, primary_key=True, default=gen_uuid)
    entry_id: Mapped[str] = mapped_column(
        GUID, ForeignKey("journal_entries.id", ondelete="CASCADE"), nullable=False, index=True
    )
    uploader_id: Mapped[str] = mapped_column(
        GUID, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    file_url: Mapped[str] = mapped_column(String(1024), nullable=False)
    file_name: Mapped[str] = mapped_column(String(255), nullable=False)
    file_type: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    file_size: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    entry = relationship("JournalEntry", back_populates="attachments")
    uploader = relationship("User")
