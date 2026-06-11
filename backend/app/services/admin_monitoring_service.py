"""Journal/AI/storage/system monitoring (privacy-safe — no entry content)."""
import math
from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from app.config import settings
from app.database.base import ensure_aware, utcnow
from app.repositories.admin_metrics_repo import AdminMetricsRepository
from app.schemas.admin import Paginated
from app.schemas.admin_metrics import (
    AIMonitoring,
    EntryMetaItem,
    JournalAggregates,
    LargestObject,
    StorageStats,
    SystemHealth,
)


def _ratio(num: int, den: int) -> float:
    return round(num / den, 4) if den else 0.0


def _start_of_today() -> datetime:
    now = utcnow()
    return datetime(now.year, now.month, now.day, tzinfo=timezone.utc)


class AdminMonitoringService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = AdminMetricsRepository(db)

    # --- journal ---------------------------------------------------------
    def journal_aggregates(self) -> JournalAggregates:
        now = utcnow()
        total = self.repo.entries_total()
        return JournalAggregates(
            total_entries=total,
            entries_today=self.repo.entries_since(_start_of_today()),
            entries_7d=self.repo.entries_since(now - timedelta(days=7)),
            entries_30d=self.repo.entries_since(now - timedelta(days=30)),
            mood_counts=self.repo.mood_counts(),
            attachment_rate=_ratio(self.repo.entries_with_attachments(), total),
            ai_enhanced_rate=_ratio(self.repo.ai_done_count(), total),
            reported_entries=len(self.repo.reported_entry_ids()),
        )

    def journal_metadata(self, *, page: int, page_size: int) -> Paginated[EntryMetaItem]:
        offset = (page - 1) * page_size
        entries, total = self.repo.entry_meta_page(offset=offset, limit=page_size)
        ids = [e.id for e in entries]
        comments = self.repo.comment_counts_for(ids)
        reactions = self.repo.reaction_counts_for(ids)
        with_attach = self.repo.attachment_entry_ids(ids)
        reported = self.repo.reported_entry_ids()

        items = [
            EntryMetaItem(
                entry_id=e.id,
                space_id=e.space_id,
                author_user_id=e.author_id,
                created_at=e.created_at,
                mood=e.mood,
                has_attachments=e.id in with_attach,
                ai_status=e.ai_status,
                comment_count=comments.get(e.id, 0),
                reaction_count=reactions.get(e.id, 0),
                is_reported=e.id in reported,
            )
            for e in entries
        ]
        return Paginated(
            items=items, total=total, page=page, page_size=page_size,
            pages=max(1, math.ceil(total / page_size)),
        )

    # --- AI --------------------------------------------------------------
    def ai_monitoring(self) -> AIMonitoring:
        now = utcnow()
        by_status = self.repo.ai_status_counts()
        done = by_status.get("done", 0)
        failed = by_status.get("failed", 0)
        total = sum(by_status.values())
        return AIMonitoring(
            total_entries=total,
            by_status=by_status,
            success_rate=_ratio(done, done + failed),
            failure_rate=_ratio(failed, done + failed),
            ai_enhanced_rate=_ratio(done, total),
            adoption_pct=round(
                _ratio(self.repo.users_with_ai(), self.repo.users_with_entry()) * 100, 1
            ),
            requests_24h=self.repo.ai_requests_since(now - timedelta(days=1)),
            requests_7d=self.repo.ai_requests_since(now - timedelta(days=7)),
            note="Latency and token cost are not instrumented; success is derived "
            "from each entry's ai_status.",
        )

    # --- storage ---------------------------------------------------------
    def storage_stats(self) -> StorageStats:
        count = self.repo.attachment_count()
        total_bytes = self.repo.attachment_total_bytes()
        largest = [
            LargestObject(
                id=r[0], file_name=r[1], file_size=r[2], file_type=r[3], space_id=r[4]
            )
            for r in self.repo.largest_attachments(10)
        ]
        return StorageStats(
            backend="supabase" if settings.supabase_enabled else "local",
            total_attachments=count,
            total_bytes=total_bytes,
            avg_bytes=round(total_bytes / count) if count else 0,
            by_type=self.repo.attachment_by_type(),
            largest=largest,
        )

    # --- system health ---------------------------------------------------
    def system_health(self) -> SystemHealth:
        now = utcnow()
        db_ok = self.repo.db_ok()
        ai_pending = self.repo.ai_pending()
        ai_failed_24h = self.repo.ai_failed_since(now - timedelta(days=1))

        oldest = ensure_aware(self.repo.ai_oldest_pending())
        oldest_age = int((now - oldest).total_seconds()) if oldest else None

        if not db_ok:
            status = "Down"
        elif ai_pending > 50 or ai_failed_24h > 10:
            status = "Degraded"
        else:
            status = "Operational"

        return SystemHealth(
            status=status,
            db_ok=db_ok,
            ai_enabled=settings.ai_enabled,
            ai_pending=ai_pending,
            ai_oldest_pending_age_seconds=oldest_age,
            ai_failed_24h=ai_failed_24h,
            storage_backend="supabase" if settings.supabase_enabled else "local",
            total_users=self.repo.total_users(),
            total_entries=self.repo.entries_total(),
        )
