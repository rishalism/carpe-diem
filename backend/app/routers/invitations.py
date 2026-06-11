"""Invitation endpoints.

`space_router` — owner-managed invites scoped to a space.
`router` — token-based actions an invitee performs (view / accept / decline).
"""
from typing import List

from fastapi import APIRouter, Depends, Response
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.middleware.auth_middleware import get_current_user
from app.models.user import User
from app.schemas.invitation import (
    InvitationCreate,
    InvitationPublic,
    InvitationResponse,
)
from app.schemas.space import SpaceResponse
from app.services.invitation_service import InvitationService

space_router = APIRouter(prefix="/spaces/{space_id}/invitations", tags=["invitations"])
router = APIRouter(prefix="/invitations", tags=["invitations"])


@space_router.post("", response_model=InvitationResponse, status_code=201)
def create_invitation(
    space_id: str,
    data: InvitationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return InvitationService(db).create(current_user, space_id, data)


@space_router.get("", response_model=List[InvitationResponse])
def list_invitations(
    space_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return InvitationService(db).list_for_space(current_user, space_id)


@space_router.delete("/{invitation_id}", status_code=204)
def cancel_invitation(
    space_id: str,
    invitation_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    InvitationService(db).cancel(current_user, space_id, invitation_id)
    return Response(status_code=204)


@router.get("/{token}", response_model=InvitationPublic)
def view_invitation(
    token: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return InvitationService(db).get_public(token)


@router.post("/{token}/accept", response_model=SpaceResponse)
def accept_invitation(
    token: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return InvitationService(db).accept(current_user, token)


@router.post("/{token}/decline", status_code=204)
def decline_invitation(
    token: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    InvitationService(db).decline(current_user, token)
    return Response(status_code=204)
