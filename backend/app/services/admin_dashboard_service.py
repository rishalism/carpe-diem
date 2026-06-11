"""Admin dashboard aggregation (privacy-safe: counts and trends only)."""
from collections import Counter
from datetime import timedelta

from sqlalchemy.orm import Session

from app.database.base import ensure_aware, utcnow
from app.repositories.admin_repo import AdminRepository
from app.repositories.report_repo import ReportRepository
from app.schemas.admin import AdminDashboard, TrendPoint


class AdminDashboardService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = AdminRepository(db)
        self.reports = ReportRepository(db)

    def summary(self) -> AdminDashboard:
        counts = self.repo.dashboard_counts()

        # Bucket signups by day in Python so the query stays dialect-portable.
        buckets: Counter[str] = Counter()
        for ts in self.repo.signup_dates(days=30):
            ts = ensure_aware(ts)
            buckets[ts.date().isoformat()] += 1

        today = utcnow().date()
        trend = [
            TrendPoint(
                date=(today - timedelta(days=i)).isoformat(),
                count=buckets.get((today - timedelta(days=i)).isoformat(), 0),
            )
            for i in range(29, -1, -1)
        ]

        return AdminDashboard(
            total_users=counts["total_users"],
            active_users_7d=counts["active_users_7d"],
            new_signups_7d=counts["new_signups_7d"],
            total_spaces=counts["total_spaces"],
            total_entries=counts["total_entries"],
            entries_24h=counts["entries_24h"],
            open_reports=self.reports.count_open(),
            suspended_users=counts["suspended_users"],
            signups_trend=trend,
        )
