"""Data access for content reports / moderation cases."""
from typing import List, Optional, Tuple

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.enums import ReportSeverity, ReportStatus
from app.models.report import Report


class ReportRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, report_id: str) -> Optional[Report]:
        return self.db.get(Report, report_id)

    def add(self, report: Report) -> Report:
        self.db.add(report)
        self.db.flush()
        return report

    def count_open(self) -> int:
        stmt = select(func.count()).select_from(Report).where(
            Report.status.in_([ReportStatus.open, ReportStatus.under_review])
        )
        return self.db.scalar(stmt) or 0

    def count_against_users(self, user_ids: List[str]) -> dict[str, int]:
        """reports-against count per reported_user_id, for a page of users."""
        if not user_ids:
            return {}
        stmt = (
            select(Report.reported_user_id, func.count())
            .where(Report.reported_user_id.in_(user_ids))
            .group_by(Report.reported_user_id)
        )
        return {uid: n for uid, n in self.db.execute(stmt).all() if uid}

    def list(
        self,
        *,
        offset: int,
        limit: int,
        status: Optional[ReportStatus] = None,
        severity: Optional[ReportSeverity] = None,
        assigned_admin_id: Optional[str] = None,
        unassigned: bool = False,
    ) -> Tuple[List[Report], int]:
        stmt = select(Report)
        if status:
            stmt = stmt.where(Report.status == status)
        if severity:
            stmt = stmt.where(Report.severity == severity)
        if unassigned:
            stmt = stmt.where(Report.assigned_admin_id.is_(None))
        elif assigned_admin_id:
            stmt = stmt.where(Report.assigned_admin_id == assigned_admin_id)

        total = self.db.scalar(
            select(func.count()).select_from(stmt.subquery())
        ) or 0
        rows = list(
            self.db.scalars(
                stmt.order_by(Report.created_at.desc()).offset(offset).limit(limit)
            ).all()
        )
        return rows, total
