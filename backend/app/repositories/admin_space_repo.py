"""Aggregate data access for admin space management."""
from typing import List, Optional, Tuple

from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.models.entry import JournalEntry
from app.models.enums import InvitationStatus, SpaceType
from app.models.invitation import Invitation
from app.models.membership import SpaceMember
from app.models.space import Space
from app.models.user import User


class AdminSpaceRepository:
    def __init__(self, db: Session):
        self.db = db

    def get(self, space_id: str) -> Optional[Space]:
        return self.db.get(Space, space_id)

    def list_spaces(
        self,
        *,
        offset: int,
        limit: int,
        type: Optional[SpaceType] = None,
        archived: Optional[bool] = None,
        q: Optional[str] = None,
    ) -> Tuple[List[Space], int]:
        stmt = select(Space)
        if type:
            stmt = stmt.where(Space.type == type)
        if archived is not None:
            stmt = stmt.where(Space.archived.is_(archived))
        if q:
            like = f"%{q.lower()}%"
            stmt = stmt.where(or_(func.lower(Space.name).like(like), Space.id == q))
        total = self.db.scalar(select(func.count()).select_from(stmt.subquery())) or 0
        rows = list(
            self.db.scalars(
                stmt.order_by(Space.created_at.desc()).offset(offset).limit(limit)
            ).all()
        )
        return rows, total

    def _group_count(self, key_col, model, ids: List[str], where=None) -> dict[str, int]:
        if not ids:
            return {}
        stmt = select(key_col, func.count()).where(key_col.in_(ids))
        if where is not None:
            stmt = stmt.where(where)
        stmt = stmt.group_by(key_col)
        return {k: n for k, n in self.db.execute(stmt).all()}

    def member_counts(self, ids: List[str]) -> dict[str, int]:
        return self._group_count(SpaceMember.space_id, SpaceMember, ids)

    def entry_counts(self, ids: List[str]) -> dict[str, int]:
        return self._group_count(JournalEntry.space_id, JournalEntry, ids)

    def pending_invite_counts(self, ids: List[str]) -> dict[str, int]:
        return self._group_count(
            Invitation.space_id, Invitation, ids,
            where=Invitation.status == InvitationStatus.pending,
        )

    def last_activity(self, ids: List[str]) -> dict[str, object]:
        if not ids:
            return {}
        rows = self.db.execute(
            select(JournalEntry.space_id, func.max(JournalEntry.created_at))
            .where(JournalEntry.space_id.in_(ids))
            .group_by(JournalEntry.space_id)
        ).all()
        return {sid: ts for sid, ts in rows}

    def owner_usernames(self, owner_ids: List[str]) -> dict[str, str]:
        if not owner_ids:
            return {}
        rows = self.db.execute(
            select(User.id, User.username).where(User.id.in_(owner_ids))
        ).all()
        return {uid: name for uid, name in rows}

    def members(self, space_id: str) -> List[tuple]:
        return self.db.execute(
            select(SpaceMember.user_id, User.username, SpaceMember.role, SpaceMember.joined_at)
            .join(User, User.id == SpaceMember.user_id)
            .where(SpaceMember.space_id == space_id)
            .order_by(SpaceMember.joined_at.asc())
        ).all()

    def invitations(self, space_id: str) -> List[Invitation]:
        return list(
            self.db.scalars(
                select(Invitation)
                .where(Invitation.space_id == space_id)
                .order_by(Invitation.created_at.desc())
            ).all()
        )

    def get_member(self, space_id: str, user_id: str) -> Optional[SpaceMember]:
        return self.db.scalar(
            select(SpaceMember).where(
                SpaceMember.space_id == space_id, SpaceMember.user_id == user_id
            )
        )
