"""Data access for spaces and memberships."""
from typing import List, Optional

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.entry import JournalEntry
from app.models.enums import MemberRole
from app.models.membership import SpaceMember
from app.models.space import Space


class SpaceRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, space_id: str) -> Optional[Space]:
        return self.db.get(Space, space_id)

    def list_for_user(self, user_id: str, include_archived: bool = False) -> List[Space]:
        stmt = (
            select(Space)
            .join(SpaceMember, SpaceMember.space_id == Space.id)
            .where(SpaceMember.user_id == user_id)
            .order_by(Space.updated_at.desc())
        )
        if not include_archived:
            stmt = stmt.where(Space.archived.is_(False))
        return list(self.db.scalars(stmt).all())

    def add(self, space: Space) -> Space:
        self.db.add(space)
        self.db.flush()
        return space

    def delete(self, space: Space) -> None:
        self.db.delete(space)

    # --- memberships ---
    def get_member(self, space_id: str, user_id: str) -> Optional[SpaceMember]:
        stmt = select(SpaceMember).where(
            SpaceMember.space_id == space_id, SpaceMember.user_id == user_id
        )
        return self.db.scalar(stmt)

    def list_members(self, space_id: str) -> List[SpaceMember]:
        stmt = (
            select(SpaceMember)
            .where(SpaceMember.space_id == space_id)
            .order_by(SpaceMember.joined_at.asc())
        )
        return list(self.db.scalars(stmt).all())

    def add_member(
        self, space_id: str, user_id: str, role: MemberRole = MemberRole.member
    ) -> SpaceMember:
        member = SpaceMember(space_id=space_id, user_id=user_id, role=role)
        self.db.add(member)
        self.db.flush()
        return member

    def count_members(self, space_id: str) -> int:
        stmt = select(func.count()).select_from(SpaceMember).where(
            SpaceMember.space_id == space_id
        )
        return self.db.scalar(stmt) or 0

    def count_entries(self, space_id: str) -> int:
        stmt = select(func.count()).select_from(JournalEntry).where(
            JournalEntry.space_id == space_id
        )
        return self.db.scalar(stmt) or 0
