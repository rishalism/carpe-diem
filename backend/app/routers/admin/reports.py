"""Admin reports / moderation endpoints.

The GET /{report_id} case endpoint is the only place reported content is
returned; the view is audited inside the service.
"""
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.middleware.admin_middleware import ReqMeta, get_current_admin, req_meta
from app.models.enums import ReportSeverity, ReportStatus
from app.models.user import User
from app.schemas.admin import (
    AssignRequest,
    Paginated,
    ReportCaseDetail,
    ReportListItem,
    ResolveRequest,
    SeverityRequest,
)
from app.services.admin_report_service import AdminReportService

router = APIRouter(prefix="/reports", tags=["admin:reports"])


@router.get("", response_model=Paginated[ReportListItem])
def list_reports(
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    status: Optional[ReportStatus] = None,
    severity: Optional[ReportSeverity] = None,
    unassigned: bool = False,
    assigned_admin_id: Optional[str] = None,
    _: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    return AdminReportService(db).list_queue(
        page=page, page_size=page_size, status=status, severity=severity,
        unassigned=unassigned, assigned_admin_id=assigned_admin_id,
    )


@router.get("/{report_id}", response_model=ReportCaseDetail)
def get_report_case(
    report_id: str,
    actor: User = Depends(get_current_admin),
    meta: ReqMeta = Depends(req_meta),
    db: Session = Depends(get_db),
):
    return AdminReportService(db).get_case(actor, report_id, meta.ip, meta.user_agent)


@router.post("/{report_id}/assign", response_model=ReportListItem)
def assign_report(
    report_id: str,
    body: AssignRequest,
    actor: User = Depends(get_current_admin),
    meta: ReqMeta = Depends(req_meta),
    db: Session = Depends(get_db),
):
    return AdminReportService(db).assign(actor, report_id, body.admin_id, meta.ip, meta.user_agent)


@router.post("/{report_id}/under-review", response_model=ReportListItem)
def mark_under_review(
    report_id: str,
    actor: User = Depends(get_current_admin),
    meta: ReqMeta = Depends(req_meta),
    db: Session = Depends(get_db),
):
    return AdminReportService(db).mark_under_review(actor, report_id, meta.ip, meta.user_agent)


@router.patch("/{report_id}/severity", response_model=ReportListItem)
def set_report_severity(
    report_id: str,
    body: SeverityRequest,
    actor: User = Depends(get_current_admin),
    meta: ReqMeta = Depends(req_meta),
    db: Session = Depends(get_db),
):
    return AdminReportService(db).set_severity(actor, report_id, body.severity, meta.ip, meta.user_agent)


@router.post("/{report_id}/dismiss", response_model=ReportListItem)
def dismiss_report(
    report_id: str,
    body: ResolveRequest,
    actor: User = Depends(get_current_admin),
    meta: ReqMeta = Depends(req_meta),
    db: Session = Depends(get_db),
):
    return AdminReportService(db).dismiss(actor, report_id, body.resolution_note, meta.ip, meta.user_agent)


@router.post("/{report_id}/remove-content", response_model=ReportListItem)
def remove_reported_content(
    report_id: str,
    body: ResolveRequest,
    actor: User = Depends(get_current_admin),
    meta: ReqMeta = Depends(req_meta),
    db: Session = Depends(get_db),
):
    return AdminReportService(db).remove_content(actor, report_id, body.resolution_note, meta.ip, meta.user_agent)
