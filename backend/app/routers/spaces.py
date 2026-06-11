"""Space endpoints."""
from typing import List

from fastapi import APIRouter, Depends, Response
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.middleware.auth_middleware import get_current_user
from app.models.user import User
from app.schemas.space import (
    SpaceCreate,
    SpaceMemberResponse,
    SpaceResponse,
    SpaceUpdate,
)
from app.services.space_service import SpaceService

router = APIRouter(prefix="/spaces", tags=["spaces"])


@router.post("", response_model=SpaceResponse, status_code=201)
def create_space(
    data: SpaceCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return SpaceService(db).create_space(current_user, data)


@router.get("", response_model=List[SpaceResponse])
def list_spaces(
    include_archived: bool = False,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return SpaceService(db).list_spaces(current_user, include_archived=include_archived)


@router.get("/{space_id}", response_model=SpaceResponse)
def get_space(
    space_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return SpaceService(db).get_space(current_user, space_id)


@router.patch("/{space_id}", response_model=SpaceResponse)
def update_space(
    space_id: str,
    data: SpaceUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return SpaceService(db).update_space(current_user, space_id, data)


@router.delete("/{space_id}", status_code=204)
def delete_space(
    space_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    SpaceService(db).delete_space(current_user, space_id)
    return Response(status_code=204)


@router.get("/{space_id}/members", response_model=List[SpaceMemberResponse])
def list_members(
    space_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return SpaceService(db).list_members(current_user, space_id)
