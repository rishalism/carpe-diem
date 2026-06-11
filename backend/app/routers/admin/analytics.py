"""Admin analytics endpoint."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.middleware.admin_middleware import require_admin
from app.models.user import User
from app.schemas.admin_metrics import AnalyticsSummary
from app.services.admin_analytics_service import AdminAnalyticsService

router = APIRouter(prefix="/analytics", tags=["admin:analytics"])


@router.get("", response_model=AnalyticsSummary)
def get_analytics(
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    return AdminAnalyticsService(db).summary()
