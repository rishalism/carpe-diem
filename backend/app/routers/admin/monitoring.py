"""Admin monitoring: journal metadata, AI, storage, system health.

Journal endpoints return metadata only — never entry titles or bodies.
"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.middleware.admin_middleware import get_current_admin, require_admin
from app.models.user import User
from app.schemas.admin import Paginated
from app.schemas.admin_metrics import (
    AIMonitoring,
    EntryMetaItem,
    JournalAggregates,
    StorageStats,
    SystemHealth,
)
from app.services.admin_monitoring_service import AdminMonitoringService

router = APIRouter(prefix="/monitoring", tags=["admin:monitoring"])


@router.get("/journal", response_model=JournalAggregates)
def journal_aggregates(
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    return AdminMonitoringService(db).journal_aggregates()


@router.get("/journal/entries", response_model=Paginated[EntryMetaItem])
def journal_entries(
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    return AdminMonitoringService(db).journal_metadata(page=page, page_size=page_size)


@router.get("/ai", response_model=AIMonitoring)
def ai_monitoring(
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    return AdminMonitoringService(db).ai_monitoring()


@router.get("/storage", response_model=StorageStats)
def storage_stats(
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    return AdminMonitoringService(db).storage_stats()


@router.get("/system", response_model=SystemHealth)
def system_health(
    _: User = Depends(get_current_admin),  # viewable by moderators+
    db: Session = Depends(get_db),
):
    return AdminMonitoringService(db).system_health()
