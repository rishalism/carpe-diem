"""Admin user management endpoints."""
from typing import Optional

from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.middleware.admin_middleware import (
    ReqMeta,
    get_current_admin,
    req_meta,
    require_admin,
    require_super_admin,
)
from app.models.enums import AccountStatus, UserRole
from app.models.user import User
from app.schemas.admin import (
    AdminUserDetail,
    AdminUserListItem,
    BanRequest,
    DeleteUserRequest,
    Paginated,
    ResetPasswordResponse,
    RoleUpdateRequest,
    SuspendRequest,
)
from app.schemas.admin_metrics import UserJourney
from app.services.admin_analytics_service import AdminAnalyticsService
from app.services.admin_user_service import AdminUserService

router = APIRouter(prefix="/users", tags=["admin:users"])


@router.get("", response_model=Paginated[AdminUserListItem])
def list_users(
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    status: Optional[AccountStatus] = None,
    role: Optional[UserRole] = None,
    q: Optional[str] = Query(None, min_length=1, max_length=255),
    _: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    return AdminUserService(db).list(
        page=page, page_size=page_size, status=status, role=role, q=q
    )


@router.get("/{user_id}", response_model=AdminUserDetail)
def get_user(
    user_id: str,
    _: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    return AdminUserService(db).get_detail(user_id)


@router.get("/{user_id}/journey", response_model=UserJourney)
def get_user_journey(
    user_id: str,
    _: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    return AdminAnalyticsService(db).user_journey(user_id)


@router.post("/{user_id}/suspend", response_model=AdminUserDetail)
def suspend_user(
    user_id: str,
    body: SuspendRequest,
    actor: User = Depends(require_admin),
    meta: ReqMeta = Depends(req_meta),
    db: Session = Depends(get_db),
):
    return AdminUserService(db).suspend(actor, user_id, body.reason, meta.ip, meta.user_agent)


@router.post("/{user_id}/reactivate", response_model=AdminUserDetail)
def reactivate_user(
    user_id: str,
    actor: User = Depends(require_admin),
    meta: ReqMeta = Depends(req_meta),
    db: Session = Depends(get_db),
):
    return AdminUserService(db).reactivate(actor, user_id, meta.ip, meta.user_agent)


@router.post("/{user_id}/ban", response_model=AdminUserDetail)
def ban_user(
    user_id: str,
    body: BanRequest,
    actor: User = Depends(require_admin),
    meta: ReqMeta = Depends(req_meta),
    db: Session = Depends(get_db),
):
    return AdminUserService(db).ban(actor, user_id, body.reason, meta.ip, meta.user_agent)


@router.post("/{user_id}/reset-password", response_model=ResetPasswordResponse)
def reset_user_password(
    user_id: str,
    actor: User = Depends(require_admin),
    meta: ReqMeta = Depends(req_meta),
    db: Session = Depends(get_db),
):
    return AdminUserService(db).reset_password(actor, user_id, meta.ip, meta.user_agent)


@router.patch("/{user_id}/role", response_model=AdminUserDetail)
def set_user_role(
    user_id: str,
    body: RoleUpdateRequest,
    actor: User = Depends(require_super_admin),
    meta: ReqMeta = Depends(req_meta),
    db: Session = Depends(get_db),
):
    return AdminUserService(db).set_role(actor, user_id, body.role, meta.ip, meta.user_agent)


@router.post("/{user_id}/delete", status_code=204)
def delete_user(
    user_id: str,
    body: DeleteUserRequest,
    actor: User = Depends(require_super_admin),
    meta: ReqMeta = Depends(req_meta),
    db: Session = Depends(get_db),
):
    AdminUserService(db).soft_delete(
        actor, user_id, body.confirm_username, body.reason, meta.ip, meta.user_agent
    )
    return Response(status_code=204)
