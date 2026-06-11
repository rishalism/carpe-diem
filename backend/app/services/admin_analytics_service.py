"""Admin analytics + per-user journey (privacy-safe aggregates only)."""
from collections import Counter
from datetime import datetime, timedelta

from sqlalchemy.orm import Session

from app.database.base import ensure_aware, utcnow
from app.exceptions import NotFoundError
from app.models.comment import Comment
from app.models.entry import JournalEntry
from app.models.reaction import Reaction
from app.models.user import User
from app.repositories.admin_metrics_repo import AdminMetricsRepository
from app.schemas.admin import TrendPoint
from app.schemas.admin_metrics import (
    AnalyticsSummary,
    EngagementStats,
    FunnelStep,
    JourneyEvent,
    UserJourney,
)

RETENTION_BASIS = (
    "Rolling retention: of users registered at least N days ago, the fraction "
    "whose last activity (entry or login) is at least N days after signup."
)


def _ratio(num: int, den: int) -> float:
    return round(num / den, 4) if den else 0.0


class AdminAnalyticsService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = AdminMetricsRepository(db)

    def summary(self) -> AnalyticsSummary:
        now = utcnow()
        reg = self.repo.total_users()
        google, password = self.repo.signups_by_auth()

        # Funnel
        funnel_raw = [
            ("registered", "Registered", reg),
            ("created_space", "Created a space", self.repo.users_with_space()),
            ("wrote_entry", "Wrote an entry", self.repo.users_with_entry()),
            ("used_ai", "Used AI", self.repo.users_with_ai()),
            ("invited", "Invited others", self.repo.users_with_invite()),
        ]
        funnel = [
            FunnelStep(key=k, label=lbl, count=c, pct=round(_ratio(c, reg) * 100, 1))
            for k, lbl, c in funnel_raw
        ]

        # Engagement
        dau = self.repo.active_authors_since(now - timedelta(days=1))
        wau = self.repo.active_authors_since(now - timedelta(days=7))
        mau = self.repo.active_authors_since(now - timedelta(days=30))
        since30 = now - timedelta(days=30)
        entries30 = self.repo.count_since(JournalEntry, since30)
        comments30 = self.repo.count_since(Comment, since30)
        reactions30 = self.repo.count_since(Reaction, since30)
        engagement = EngagementStats(
            dau=dau,
            wau=wau,
            mau=mau,
            stickiness=_ratio(dau, mau),
            entries_per_active=round(_ratio(entries30, mau), 2),
            comments_per_active=round(_ratio(comments30, mau), 2),
            reactions_per_active=round(_ratio(reactions30, mau), 2),
        )

        # Growth (signups/day, last 30 days)
        buckets: Counter[str] = Counter()
        for ts in self.repo.signup_timestamps(30):
            buckets[ensure_aware(ts).date().isoformat()] += 1
        today = now.date()
        growth = [
            TrendPoint(
                date=(today - timedelta(days=i)).isoformat(),
                count=buckets.get((today - timedelta(days=i)).isoformat(), 0),
            )
            for i in range(29, -1, -1)
        ]

        d1, d7, d30 = self._rolling_retention()

        return AnalyticsSummary(
            total_users=reg,
            signups_google=google,
            signups_password=password,
            growth_trend=growth,
            cumulative_users=reg,
            funnel=funnel,
            engagement=engagement,
            retention_d1=d1,
            retention_d7=d7,
            retention_d30=d30,
            retention_basis=RETENTION_BASIS,
        )

    def _rolling_retention(self) -> tuple[float, float, float]:
        rows, last_entry = self.repo.retention_rows()
        now = utcnow()

        def retained(days: int) -> float:
            eligible = 0
            kept = 0
            for uid, created, last_active in rows:
                created = ensure_aware(created)
                if created is None or (now - created).days < days:
                    continue
                eligible += 1
                candidates = [created]
                la = ensure_aware(last_active)
                le = ensure_aware(last_entry.get(uid))
                if la:
                    candidates.append(la)
                if le:
                    candidates.append(le)
                last_activity = max(candidates)
                if (last_activity - created).days >= days:
                    kept += 1
            return _ratio(kept, eligible)

        return retained(1), retained(7), retained(30)

    # --- per-user journey ----------------------------------------------------
    def user_journey(self, user_id: str) -> UserJourney:
        user = self.db.get(User, user_id)
        if user is None:
            raise NotFoundError("User not found")

        reg = ensure_aware(user.created_at)
        first_space = self.repo.first_membership_at(user_id)
        first_entry = self.repo.first_entry_at(user_id)
        first_ai = self.repo.first_ai_at(user_id)
        first_invite = self.repo.first_invite_at(user_id)
        last_entry = self.repo.last_entry_at(user_id)

        events = [
            JourneyEvent(type="registered", label="Registered", at=user.created_at),
            JourneyEvent(type="first_space", label="Joined / created first space", at=first_space),
            JourneyEvent(type="first_entry", label="Wrote first entry", at=first_entry),
            JourneyEvent(type="first_ai", label="First AI enhancement", at=first_ai),
            JourneyEvent(type="first_invite", label="Sent first invitation", at=first_invite),
            JourneyEvent(type="last_entry", label="Most recent entry", at=last_entry),
        ]

        # Last activity = latest of last_active_at / last entry / registration.
        now = utcnow()
        candidates = [reg]
        for ts in (ensure_aware(user.last_active_at), ensure_aware(last_entry)):
            if ts:
                candidates.append(ts)
        last_activity = max(candidates)
        idle_days = (now - last_activity).days

        if first_entry is None:
            stage = "New"
        elif idle_days <= 7:
            stage = "Active"
        elif idle_days <= 30:
            stage = "Dormant"
        else:
            stage = "Churned"

        def span_ok(end: datetime | None, days: int) -> bool:
            end = ensure_aware(end)
            return bool(end and reg and (end - reg).days >= days)

        return UserJourney(
            stage=stage,
            events=events,
            retained_d1=span_ok(last_activity, 1),
            retained_d7=span_ok(last_activity, 7),
            retained_d30=span_ok(last_activity, 30),
        )
