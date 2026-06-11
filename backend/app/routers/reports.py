"""User-facing endpoint to report an entry or comment for moderation."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.middleware.auth_middleware import get_current_user
from app.models.user import User
from app.schemas.report import ReportCreatedResponse, ReportCreateRequest
from app.services.admin_report_service import AdminReportService

router = APIRouter(prefix="/reports", tags=["reports"])


@router.post("", response_model=ReportCreatedResponse, status_code=201)
def create_report(
    data: ReportCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    report = AdminReportService(db).create(
        reporter=current_user,
        content_type=data.content_type,
        content_id=data.content_id,
        reason=data.reason,
        details=data.details,
    )
    return ReportCreatedResponse(id=report.id)
