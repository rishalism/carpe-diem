"""Moderation / reports business logic.

This is the ONLY service that exposes journal content, and only via
``get_case`` for an open report — every such view is itself audited.
"""
import math
from typing import Optional

from sqlalchemy.orm import Session

from app.exceptions import BadRequestError, NotFoundError, PermissionDeniedError
from app.middleware.admin_middleware import ROLE_RANK
from app.models.comment import Comment
from app.models.entry import JournalEntry
from app.models.enums import (
    ReportContentType,
    ReportSeverity,
    ReportStatus,
    UserRole,
)
from app.models.report import Report
from app.models.user import User
from app.repositories.report_repo import ReportRepository
from app.schemas.admin import Paginated, ReportCaseDetail, ReportListItem
from app.services.audit_service import AuditService


class AdminReportService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = ReportRepository(db)
        self.audit = AuditService(db)

    # --- creation (called by the user-facing report endpoint) ----------------
    def create(
        self,
        *,
        reporter: Optional[User],
        content_type: ReportContentType,
        content_id: str,
        reason: str,
        details: Optional[str] = None,
    ) -> Report:
        reported_user_id = self._resolve_author(content_type, content_id)
        if reported_user_id is None:
            raise NotFoundError("Reported content not found")
        if reporter and reporter.id == reported_user_id:
            raise BadRequestError("You cannot report your own content")
        report = Report(
            content_type=content_type,
            content_id=content_id,
            reported_user_id=reported_user_id,
            reporter_id=reporter.id if reporter else None,
            reason=reason,
            details=details,
        )
        self.repo.add(report)
        self.db.commit()
        self.db.refresh(report)
        return report

    # --- read ----------------------------------------------------------------
    def list_queue(
        self,
        *,
        page: int,
        page_size: int,
        status: Optional[ReportStatus] = None,
        severity: Optional[ReportSeverity] = None,
        assigned_admin_id: Optional[str] = None,
        unassigned: bool = False,
    ) -> Paginated[ReportListItem]:
        offset = (page - 1) * page_size
        rows, total = self.repo.list(
            offset=offset, limit=page_size, status=status, severity=severity,
            assigned_admin_id=assigned_admin_id, unassigned=unassigned,
        )
        return Paginated(
            items=[ReportListItem.model_validate(r) for r in rows],
            total=total,
            page=page,
            page_size=page_size,
            pages=max(1, math.ceil(total / page_size)),
        )

    def get_case(self, actor: User, report_id: str, ip: str, ua: str) -> ReportCaseDetail:
        """Privacy exception: returns the reported content. The view is audited."""
        report = self._get(report_id)
        title, body, exists = self._load_content(report)

        # Log the content access (PRD §6 — moderation.content_viewed).
        self.audit.record(
            admin=actor, action="moderation.content_viewed",
            resource_type=report.content_type.value, resource_id=report.content_id,
            meta={"report_id": report.id}, ip_address=ip, user_agent=ua,
        )

        detail = ReportCaseDetail.model_validate(report)
        detail.reported_username = report.reported_user.username if report.reported_user else None
        detail.content_title = title
        detail.content_body = body
        detail.content_exists = exists
        return detail

    # --- actions -------------------------------------------------------------
    def assign(self, actor: User, report_id: str, admin_id: Optional[str], ip: str, ua: str) -> Report:
        report = self._get(report_id)
        target_id = admin_id or actor.id
        if admin_id:
            assignee = self.db.get(User, admin_id)
            if not assignee or ROLE_RANK.get(assignee.role, 0) < ROLE_RANK[UserRole.moderator]:
                raise BadRequestError("Assignee must be a staff member")
        report.assigned_admin_id = target_id
        if report.status == ReportStatus.open:
            report.status = ReportStatus.under_review
        return self._save_with_audit(actor, "report.assign", report, ip, ua,
                                     meta={"assigned_to": target_id})

    def mark_under_review(self, actor: User, report_id: str, ip: str, ua: str) -> Report:
        report = self._get(report_id)
        report.status = ReportStatus.under_review
        return self._save_with_audit(actor, "report.under_review", report, ip, ua)

    def set_severity(self, actor: User, report_id: str, severity: ReportSeverity, ip: str, ua: str) -> Report:
        report = self._get(report_id)
        report.severity = severity
        return self._save_with_audit(actor, "report.set_severity", report, ip, ua,
                                     meta={"severity": severity.value})

    def dismiss(self, actor: User, report_id: str, note: str, ip: str, ua: str) -> Report:
        report = self._guard_conflict(actor, self._get(report_id))
        report.status = ReportStatus.dismissed
        report.resolution_note = note
        return self._save_with_audit(actor, "report.dismiss", report, ip, ua, reason=note)

    def remove_content(self, actor: User, report_id: str, reason: str, ip: str, ua: str) -> Report:
        """Take down the reported entry/comment, then close the case."""
        report = self._guard_conflict(actor, self._get(report_id))
        self._delete_content(report)
        report.status = ReportStatus.action_taken
        report.resolution_note = reason
        return self._save_with_audit(actor, "report.remove_content", report, ip, ua, reason=reason)

    # --- helpers -------------------------------------------------------------
    def _get(self, report_id: str) -> Report:
        report = self.repo.get_by_id(report_id)
        if report is None:
            raise NotFoundError("Report not found")
        return report

    def _guard_conflict(self, actor: User, report: Report) -> Report:
        if report.reporter_id and report.reporter_id == actor.id:
            raise PermissionDeniedError("You cannot adjudicate a report you filed")
        return report

    def _resolve_author(self, content_type: ReportContentType, content_id: str) -> Optional[str]:
        if content_type == ReportContentType.entry:
            obj = self.db.get(JournalEntry, content_id)
        else:
            obj = self.db.get(Comment, content_id)
        return obj.author_id if obj else None

    def _load_content(self, report: Report) -> tuple[Optional[str], Optional[str], bool]:
        if report.content_type == ReportContentType.entry:
            entry = self.db.get(JournalEntry, report.content_id)
            if not entry:
                return None, None, False
            body = (
                entry.content_enhanced
                if entry.enhanced_active and entry.content_enhanced
                else entry.content
            )
            return entry.title, body, True
        comment = self.db.get(Comment, report.content_id)
        if not comment:
            return None, None, False
        return None, comment.content, True

    def _delete_content(self, report: Report) -> None:
        if report.content_type == ReportContentType.entry:
            obj = self.db.get(JournalEntry, report.content_id)
        else:
            obj = self.db.get(Comment, report.content_id)
        if obj is not None:
            self.db.delete(obj)

    def _save_with_audit(
        self, actor, action, report, ip, ua, *, reason=None, meta=None
    ) -> Report:
        self.audit.record(
            admin=actor, action=action, resource_type="report", resource_id=report.id,
            reason=reason, meta=meta, ip_address=ip, user_agent=ua, commit=False,
        )
        self.db.commit()
        self.db.refresh(report)
        return report
