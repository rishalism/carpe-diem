"""Admin dashboard KPIs."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.middleware.admin_middleware import get_current_admin
from app.models.user import User
from app.schemas.admin import AdminDashboard
from app.services.admin_dashboard_service import AdminDashboardService

router = APIRouter(prefix="/dashboard", tags=["admin:dashboard"])


@router.get("", response_model=AdminDashboard)
def get_dashboard(
    _: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    return AdminDashboardService(db).summary()
