"""Aggregate data access for the admin portal (users list + dashboard counts).

Per-user activity totals are computed page-by-page: fetch a page of users,
then run grouped COUNT queries scoped to those ids. This keeps the list query
index-friendly and avoids N correlated subqueries per row.
"""
from datetime import datetime, timedelta, timezone
from typing import List, Optional, Tuple

from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.models.comment import Comment
from app.models.entry import JournalEntry
from app.models.enums import AccountStatus, UserRole
from app.models.membership import SpaceMember
from app.models.reaction import Reaction
from app.models.space import Space
from app.models.user import User


class AdminRepository:
    def __init__(self, db: Session):
        self.db = db

    # --- user listing --------------------------------------------------------
    def list_users(
        self,
        *,
        offset: int,
        limit: int,
        status: Optional[AccountStatus] = None,
        role: Optional[UserRole] = None,
        q: Optional[str] = None,
    ) -> Tuple[List[User], int]:
        stmt = select(User)
        if status:
            stmt = stmt.where(User.account_status == status)
        if role:
            stmt = stmt.where(User.role == role)
        if q:
            like = f"%{q.lower()}%"
            stmt = stmt.where(
                or_(
                    func.lower(User.username).like(like),
                    func.lower(User.email).like(like),
                    User.id == q,
                )
            )
        total = self.db.scalar(
            select(func.count()).select_from(stmt.subquery())
        ) or 0
        rows = list(
            self.db.scalars(
                stmt.order_by(User.created_at.desc()).offset(offset).limit(limit)
            ).all()
        )
        return rows, total

    def _count_map(self, model, key_col, ids: List[str]) -> dict[str, int]:
        if not ids:
            return {}
        stmt = (
            select(key_col, func.count())
            .where(key_col.in_(ids))
            .group_by(key_col)
        )
        return {k: n for k, n in self.db.execute(stmt).all() if k}

    def spaces_count(self, ids: List[str]) -> dict[str, int]:
        # SpaceMember rows include the owner, so this is total spaces a user is in.
        return self._count_map(SpaceMember, SpaceMember.user_id, ids)

    def entries_count(self, ids: List[str]) -> dict[str, int]:
        return self._count_map(JournalEntry, JournalEntry.author_id, ids)

    def comments_count(self, ids: List[str]) -> dict[str, int]:
        return self._count_map(Comment, Comment.author_id, ids)

    def reactions_count(self, ids: List[str]) -> dict[str, int]:
        return self._count_map(Reaction, Reaction.user_id, ids)

    # --- dashboard counts ----------------------------------------------------
    def dashboard_counts(self) -> dict:
        now = datetime.now(timezone.utc)
        d7 = now - timedelta(days=7)
        h24 = now - timedelta(hours=24)

        def _count(stmt) -> int:
            return self.db.scalar(stmt) or 0

        total_users = _count(
            select(func.count()).select_from(User).where(
                User.account_status != AccountStatus.deleted
            )
        )
        active_users_7d = _count(
            select(func.count()).select_from(User).where(User.last_active_at >= d7)
        )
        new_signups_7d = _count(
            select(func.count()).select_from(User).where(User.created_at >= d7)
        )
        suspended_users = _count(
            select(func.count()).select_from(User).where(
                User.account_status == AccountStatus.suspended
            )
        )
        total_spaces = _count(select(func.count()).select_from(Space))
        total_entries = _count(select(func.count()).select_from(JournalEntry))
        entries_24h = _count(
            select(func.count()).select_from(JournalEntry).where(
                JournalEntry.created_at >= h24
            )
        )
        return {
            "total_users": total_users,
            "active_users_7d": active_users_7d,
            "new_signups_7d": new_signups_7d,
            "suspended_users": suspended_users,
            "total_spaces": total_spaces,
            "total_entries": total_entries,
            "entries_24h": entries_24h,
        }

    def signup_dates(self, days: int = 30) -> List[datetime]:
        """created_at values within the window, bucketed into a trend by the
        service in Python (portable across SQLite/Postgres)."""
        since = datetime.now(timezone.utc) - timedelta(days=days)
        rows = self.db.scalars(
            select(User.created_at).where(User.created_at >= since)
        ).all()
        return list(rows)
