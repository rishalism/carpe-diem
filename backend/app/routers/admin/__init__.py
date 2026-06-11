"""Admin portal API — mounted at /api/admin.

All sub-routers require at least a `moderator` role (enforced per-endpoint by
the dependencies in app.middleware.admin_middleware).
"""
from fastapi import APIRouter

from app.routers.admin import (
    analytics,
    audit,
    auth,
    dashboard,
    monitoring,
    reports,
    spaces,
    users,
)

router = APIRouter(prefix="/admin")
router.include_router(auth.router)
router.include_router(dashboard.router)
router.include_router(users.router)
router.include_router(reports.router)
router.include_router(audit.router)
router.include_router(analytics.router)
router.include_router(monitoring.router)
router.include_router(spaces.router)
