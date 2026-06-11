"""Data access for journal entries and tags."""
from datetime import datetime
from typing import List, Optional

from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session, selectinload

from app.models.entry import JournalEntry
from app.models.enums import Mood
from app.models.membership import SpaceMember
from app.models.tag import Tag


class EntryRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, entry_id: str) -> Optional[JournalEntry]:
        stmt = (
            select(JournalEntry)
            .where(JournalEntry.id == entry_id)
            .options(
                selectinload(JournalEntry.tags),
                selectinload(JournalEntry.author),
            )
        )
        return self.db.scalar(stmt)

    def list_for_space(
        self,
        space_id: str,
        *,
        author_id: Optional[str] = None,
        mood: Optional[Mood] = None,
        tag: Optional[str] = None,
        search: Optional[str] = None,
        date_from: Optional[datetime] = None,
        date_to: Optional[datetime] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> List[JournalEntry]:
        stmt = (
            select(JournalEntry)
            .where(JournalEntry.space_id == space_id)
            .options(
                selectinload(JournalEntry.tags),
                selectinload(JournalEntry.author),
            )
            .order_by(JournalEntry.created_at.desc())
        )
        if author_id:
            stmt = stmt.where(JournalEntry.author_id == author_id)
        if mood:
            stmt = stmt.where(JournalEntry.mood == mood)
        if search:
            like = f"%{search.lower()}%"
            stmt = stmt.where(
                or_(
                    func.lower(JournalEntry.title).like(like),
                    func.lower(JournalEntry.content).like(like),
                )
            )
        if tag:
            stmt = stmt.where(JournalEntry.tags.any(Tag.name == tag.lower()))
        if date_from:
            stmt = stmt.where(JournalEntry.created_at >= date_from)
        if date_to:
            stmt = stmt.where(JournalEntry.created_at <= date_to)
        stmt = stmt.limit(limit).offset(offset)
        return list(self.db.scalars(stmt).unique().all())

    def search_for_user(
        self,
        user_id: str,
        *,
        search: Optional[str] = None,
        mood: Optional[Mood] = None,
        tag: Optional[str] = None,
        space_id: Optional[str] = None,
        author_id: Optional[str] = None,
        date_from: Optional[datetime] = None,
        date_to: Optional[datetime] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> List[JournalEntry]:
        """Search entries across every space the user belongs to."""
        stmt = (
            select(JournalEntry)
            .join(SpaceMember, SpaceMember.space_id == JournalEntry.space_id)
            .where(SpaceMember.user_id == user_id)
            .options(
                selectinload(JournalEntry.tags),
                selectinload(JournalEntry.author),
                selectinload(JournalEntry.space),
            )
            .order_by(JournalEntry.created_at.desc())
        )
        if space_id:
            stmt = stmt.where(JournalEntry.space_id == space_id)
        if author_id:
            stmt = stmt.where(JournalEntry.author_id == author_id)
        if mood:
            stmt = stmt.where(JournalEntry.mood == mood)
        if tag:
            stmt = stmt.where(JournalEntry.tags.any(Tag.name == tag.lower()))
        if search:
            like = f"%{search.lower()}%"
            stmt = stmt.where(
                or_(
                    func.lower(JournalEntry.title).like(like),
                    func.lower(JournalEntry.content).like(like),
                )
            )
        if date_from:
            stmt = stmt.where(JournalEntry.created_at >= date_from)
        if date_to:
            stmt = stmt.where(JournalEntry.created_at <= date_to)
        stmt = stmt.limit(limit).offset(offset)
        return list(self.db.scalars(stmt).unique().all())

    def add(self, entry: JournalEntry) -> JournalEntry:
        self.db.add(entry)
        self.db.flush()
        return entry

    def delete(self, entry: JournalEntry) -> None:
        self.db.delete(entry)

    def get_or_create_tags(self, names: List[str]) -> List[Tag]:
        tags: List[Tag] = []
        for name in names:
            existing = self.db.scalar(select(Tag).where(Tag.name == name))
            if existing is None:
                existing = Tag(name=name)
                self.db.add(existing)
                self.db.flush()
            tags.append(existing)
        return tags
