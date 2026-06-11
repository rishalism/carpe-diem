"""Data access for attachments."""
from typing import List, Optional

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models.attachment import Attachment
from app.models.entry import JournalEntry


class AttachmentRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, attachment_id: str) -> Optional[Attachment]:
        stmt = (
            select(Attachment)
            .where(Attachment.id == attachment_id)
            .options(selectinload(Attachment.uploader))
        )
        return self.db.scalar(stmt)

    def list_for_entry(self, entry_id: str) -> List[Attachment]:
        stmt = (
            select(Attachment)
            .where(Attachment.entry_id == entry_id)
            .options(selectinload(Attachment.uploader))
            .order_by(Attachment.created_at.asc())
        )
        return list(self.db.scalars(stmt).all())

    def list_for_space(self, space_id: str) -> List[Attachment]:
        stmt = (
            select(Attachment)
            .join(JournalEntry, JournalEntry.id == Attachment.entry_id)
            .where(JournalEntry.space_id == space_id)
            .options(selectinload(Attachment.uploader))
            .order_by(Attachment.created_at.desc())
        )
        return list(self.db.scalars(stmt).all())

    def add(self, attachment: Attachment) -> Attachment:
        self.db.add(attachment)
        self.db.flush()
        return attachment

    def delete(self, attachment: Attachment) -> None:
        self.db.delete(attachment)
