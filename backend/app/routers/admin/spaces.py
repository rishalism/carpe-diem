"""Admin space management endpoints."""
from typing import Optional

from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.middleware.admin_middleware import (
    ReqMeta,
    get_current_admin,
    req_meta,
    require_admin,
)
from app.models.enums import SpaceType
from app.models.user import User
from app.schemas.admin import Paginated
from app.schemas.admin_metrics import (
    AdminSpaceDetail,
    AdminSpaceListItem,
    RemoveMemberRequest,
    SpaceDeleteRequest,
)
from app.services.admin_space_service import AdminSpaceService

router = APIRouter(prefix="/spaces", tags=["admin:spaces"])


@router.get("", response_model=Paginated[AdminSpaceListItem])
def list_spaces(
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    type: Optional[SpaceType] = None,
    archived: Optional[bool] = None,
    q: Optional[str] = Query(None, min_length=1, max_length=255),
    _: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    return AdminSpaceService(db).list(
        page=page, page_size=page_size, type=type, archived=archived, q=q
    )


@router.get("/{space_id}", response_model=AdminSpaceDetail)
def get_space(
    space_id: str,
    _: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    return AdminSpaceService(db).get_detail(space_id)


@router.post("/{space_id}/archive", response_model=AdminSpaceDetail)
def archive_space(
    space_id: str,
    actor: User = Depends(require_admin),
    meta: ReqMeta = Depends(req_meta),
    db: Session = Depends(get_db),
):
    return AdminSpaceService(db).archive(actor, space_id, meta.ip, meta.user_agent)


@router.post("/{space_id}/restore", response_model=AdminSpaceDetail)
def restore_space(
    space_id: str,
    actor: User = Depends(require_admin),
    meta: ReqMeta = Depends(req_meta),
    db: Session = Depends(get_db),
):
    return AdminSpaceService(db).restore(actor, space_id, meta.ip, meta.user_agent)


@router.post("/{space_id}/remove-member", response_model=AdminSpaceDetail)
def remove_member(
    space_id: str,
    body: RemoveMemberRequest,
    actor: User = Depends(require_admin),
    meta: ReqMeta = Depends(req_meta),
    db: Session = Depends(get_db),
):
    return AdminSpaceService(db).remove_member(
        actor, space_id, body.user_id, body.reason, meta.ip, meta.user_agent
    )


@router.post("/{space_id}/delete", status_code=204)
def delete_space(
    space_id: str,
    body: SpaceDeleteRequest,
    actor: User = Depends(require_admin),
    meta: ReqMeta = Depends(req_meta),
    db: Session = Depends(get_db),
):
    AdminSpaceService(db).delete(
        actor, space_id, body.confirm_name, body.reason, meta.ip, meta.user_agent
    )
    return Response(status_code=204)
