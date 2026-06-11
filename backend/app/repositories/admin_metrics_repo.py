"""Aggregate queries for Phase 2 admin analytics & monitoring.

All queries return counts / metadata / timestamps only — never entry content.
"""
from datetime import datetime, timedelta, timezone
from typing import List, Optional, Tuple

from sqlalchemy import distinct, func, select
from sqlalchemy.orm import Session

from app.models.attachment import Attachment
from app.models.comment import Comment
from app.models.entry import JournalEntry
from app.models.enums import AccountStatus, AIStatus, ReportContentType
from app.models.invitation import Invitation
from app.models.reaction import Reaction
from app.models.report import Report
from app.models.user import User


def _now() -> datetime:
    return datetime.now(timezone.utc)


class AdminMetricsRepository:
    def __init__(self, db: Session):
        self.db = db

    def _scalar(self, stmt) -> int:
        return self.db.scalar(stmt) or 0

    # --- analytics: funnel + growth + engagement -------------------------
    def total_users(self) -> int:
        return self._scalar(
            select(func.count()).select_from(User).where(
                User.account_status != AccountStatus.deleted
            )
        )

    def signups_by_auth(self) -> Tuple[int, int]:
        google = self._scalar(
            select(func.count()).select_from(User).where(User.google_id.isnot(None))
        )
        password = self._scalar(
            select(func.count()).select_from(User).where(User.google_id.is_(None))
        )
        return google, password

    def users_with_space(self) -> int:
        from app.models.space import Space

        return self._scalar(select(func.count(distinct(Space.owner_id))))

    def users_with_entry(self) -> int:
        return self._scalar(select(func.count(distinct(JournalEntry.author_id))))

    def users_with_ai(self) -> int:
        return self._scalar(
            select(func.count(distinct(JournalEntry.author_id))).where(
                JournalEntry.ai_status == AIStatus.done
            )
        )

    def users_with_invite(self) -> int:
        return self._scalar(select(func.count(distinct(Invitation.inviter_id))))

    def active_authors_since(self, cutoff: datetime) -> int:
        return self._scalar(
            select(func.count(distinct(JournalEntry.author_id))).where(
                JournalEntry.created_at >= cutoff
            )
        )

    def count_since(self, model, since: datetime) -> int:
        return self._scalar(
            select(func.count()).select_from(model).where(model.created_at >= since)
        )

    def signup_timestamps(self, days: int) -> List[datetime]:
        since = _now() - timedelta(days=days)
        return list(
            self.db.scalars(select(User.created_at).where(User.created_at >= since)).all()
        )

    def retention_rows(self) -> Tuple[List[tuple], dict]:
        """(user_id, created_at, last_active_at) for non-deleted users, plus a
        map user_id -> last entry created_at."""
        rows = self.db.execute(
            select(User.id, User.created_at, User.last_active_at).where(
                User.account_status != AccountStatus.deleted
            )
        ).all()
        last_entry = dict(
            self.db.execute(
                select(JournalEntry.author_id, func.max(JournalEntry.created_at)).group_by(
                    JournalEntry.author_id
                )
            ).all()
        )
        return rows, last_entry

    # --- journal monitoring ----------------------------------------------
    def entries_total(self) -> int:
        return self._scalar(select(func.count()).select_from(JournalEntry))

    def entries_since(self, since: datetime) -> int:
        return self.count_since(JournalEntry, since)

    def mood_counts(self) -> dict[str, int]:
        rows = self.db.execute(
            select(JournalEntry.mood, func.count())
            .where(JournalEntry.mood.isnot(None))
            .group_by(JournalEntry.mood)
        ).all()
        return {m.value if hasattr(m, "value") else str(m): n for m, n in rows}

    def entries_with_attachments(self) -> int:
        return self._scalar(select(func.count(distinct(Attachment.entry_id))))

    def ai_done_count(self) -> int:
        return self._scalar(
            select(func.count()).select_from(JournalEntry).where(
                JournalEntry.ai_status == AIStatus.done
            )
        )

    def reported_entry_ids(self) -> set[str]:
        rows = self.db.scalars(
            select(distinct(Report.content_id)).where(
                Report.content_type == ReportContentType.entry
            )
        ).all()
        return set(rows)

    def entry_meta_page(
        self, *, offset: int, limit: int
    ) -> Tuple[List[JournalEntry], int]:
        stmt = select(JournalEntry)
        total = self._scalar(select(func.count()).select_from(stmt.subquery()))
        rows = list(
            self.db.scalars(
                stmt.order_by(JournalEntry.created_at.desc()).offset(offset).limit(limit)
            ).all()
        )
        return rows, total

    def comment_counts_for(self, entry_ids: List[str]) -> dict[str, int]:
        if not entry_ids:
            return {}
        rows = self.db.execute(
            select(Comment.entry_id, func.count())
            .where(Comment.entry_id.in_(entry_ids))
            .group_by(Comment.entry_id)
        ).all()
        return {eid: n for eid, n in rows}

    def reaction_counts_for(self, entry_ids: List[str]) -> dict[str, int]:
        if not entry_ids:
            return {}
        rows = self.db.execute(
            select(Reaction.entry_id, func.count())
            .where(Reaction.entry_id.in_(entry_ids))
            .group_by(Reaction.entry_id)
        ).all()
        return {eid: n for eid, n in rows}

    def attachment_entry_ids(self, entry_ids: List[str]) -> set[str]:
        if not entry_ids:
            return set()
        rows = self.db.scalars(
            select(distinct(Attachment.entry_id)).where(Attachment.entry_id.in_(entry_ids))
        ).all()
        return set(rows)

    # --- AI monitoring ---------------------------------------------------
    def ai_status_counts(self) -> dict[str, int]:
        rows = self.db.execute(
            select(JournalEntry.ai_status, func.count()).group_by(JournalEntry.ai_status)
        ).all()
        return {s.value if hasattr(s, "value") else str(s): n for s, n in rows}

    def ai_requests_since(self, since: datetime) -> int:
        return self._scalar(
            select(func.count()).select_from(JournalEntry).where(
                JournalEntry.ai_status != AIStatus.none,
                JournalEntry.created_at >= since,
            )
        )

    # --- storage ---------------------------------------------------------
    def attachment_count(self) -> int:
        return self._scalar(select(func.count()).select_from(Attachment))

    def attachment_total_bytes(self) -> int:
        return self._scalar(select(func.coalesce(func.sum(Attachment.file_size), 0)))

    def attachment_by_type(self) -> dict[str, int]:
        rows = self.db.execute(
            select(func.coalesce(Attachment.file_type, "unknown"), func.count()).group_by(
                Attachment.file_type
            )
        ).all()
        return {t: n for t, n in rows}

    def largest_attachments(self, n: int = 10) -> List[tuple]:
        rows = self.db.execute(
            select(
                Attachment.id,
                Attachment.file_name,
                Attachment.file_size,
                Attachment.file_type,
                JournalEntry.space_id,
            )
            .join(JournalEntry, JournalEntry.id == Attachment.entry_id)
            .where(Attachment.file_size.isnot(None))
            .order_by(Attachment.file_size.desc())
            .limit(n)
        ).all()
        return rows

    # --- system health ---------------------------------------------------
    def db_ok(self) -> bool:
        try:
            self.db.execute(select(1))
            return True
        except Exception:
            return False

    def ai_pending(self) -> int:
        return self._scalar(
            select(func.count()).select_from(JournalEntry).where(
                JournalEntry.ai_status == AIStatus.pending
            )
        )

    def ai_oldest_pending(self) -> Optional[datetime]:
        return self.db.scalar(
            select(func.min(JournalEntry.created_at)).where(
                JournalEntry.ai_status == AIStatus.pending
            )
        )

    def ai_failed_since(self, since: datetime) -> int:
        return self._scalar(
            select(func.count()).select_from(JournalEntry).where(
                JournalEntry.ai_status == AIStatus.failed,
                JournalEntry.updated_at >= since,
            )
        )

    # --- user journey ----------------------------------------------------
    def first_membership_at(self, user_id: str) -> Optional[datetime]:
        from app.models.membership import SpaceMember

        return self.db.scalar(
            select(func.min(SpaceMember.joined_at)).where(SpaceMember.user_id == user_id)
        )

    def first_entry_at(self, user_id: str) -> Optional[datetime]:
        return self.db.scalar(
            select(func.min(JournalEntry.created_at)).where(
                JournalEntry.author_id == user_id
            )
        )

    def last_entry_at(self, user_id: str) -> Optional[datetime]:
        return self.db.scalar(
            select(func.max(JournalEntry.created_at)).where(
                JournalEntry.author_id == user_id
            )
        )

    def first_ai_at(self, user_id: str) -> Optional[datetime]:
        return self.db.scalar(
            select(func.min(JournalEntry.created_at)).where(
                JournalEntry.author_id == user_id,
                JournalEntry.ai_status == AIStatus.done,
            )
        )

    def first_invite_at(self, user_id: str) -> Optional[datetime]:
        return self.db.scalar(
            select(func.min(Invitation.created_at)).where(Invitation.inviter_id == user_id)
        )
