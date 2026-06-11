"""Invitation business logic + authorization."""
from datetime import timedelta
from typing import List

from sqlalchemy.orm import Session

from app.database.base import ensure_aware, utcnow
from app.exceptions import BadRequestError, ConflictError, NotFoundError
from app.models.enums import InvitationStatus, NotificationType
from app.models.invitation import Invitation
from app.models.user import User
from app.repositories.invitation_repo import InvitationRepository
from app.repositories.space_repo import SpaceRepository
from app.repositories.user_repo import UserRepository
from app.schemas.invitation import (
    InvitationCreate,
    InvitationPublic,
    InvitationResponse,
)
from app.schemas.space import SpaceResponse
from app.services.notification_service import NotificationService
from app.services.space_service import SpaceService
from app.utils.security import generate_url_token

INVITE_TTL_DAYS = 7


class InvitationService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = InvitationRepository(db)
        self.spaces = SpaceRepository(db)
        self.users = UserRepository(db)
        self.space_service = SpaceService(db)
        self.notifications = NotificationService(db)

    def create(
        self, owner: User, space_id: str, data: InvitationCreate
    ) -> InvitationResponse:
        self.space_service.require_owner(space_id, owner.id)
        space = self.spaces.get_by_id(space_id)
        if space is None:
            raise NotFoundError("Space not found")

        email = data.email.lower()
        invitee = self.users.get_by_email(email)
        if invitee and self.spaces.get_member(space_id, invitee.id):
            raise ConflictError("That person is already a member")
        if self.repo.get_pending(space_id, email):
            raise ConflictError("There is already a pending invitation for this email")

        invitation = Invitation(
            space_id=space_id,
            inviter_id=owner.id,
            email=email,
            role=data.role,
            token=generate_url_token(),
            status=InvitationStatus.pending,
            expires_at=utcnow() + timedelta(days=INVITE_TTL_DAYS),
        )
        self.repo.add(invitation)

        # Notify the invitee in-app if they already have an account.
        if invitee:
            self.notifications.emit(
                invitee.id,
                NotificationType.space_invitation,
                {
                    "space_id": space_id,
                    "space_name": space.name,
                    "inviter_name": owner.username,
                    "token": invitation.token,
                    "message": f"{owner.username} invited you to {space.name}",
                    "link": f"/invite/{invitation.token}",
                },
                actor_id=owner.id,
            )
        self.db.commit()
        return InvitationResponse.model_validate(self.repo.get_by_token(invitation.token))

    def list_for_space(self, owner: User, space_id: str) -> List[InvitationResponse]:
        self.space_service.require_owner(space_id, owner.id)
        return [
            InvitationResponse.model_validate(i)
            for i in self.repo.list_for_space(space_id)
        ]

    def cancel(self, owner: User, space_id: str, invitation_id: str) -> None:
        self.space_service.require_owner(space_id, owner.id)
        inv = self.repo.get_by_id(invitation_id)
        if inv is None or inv.space_id != space_id:
            raise NotFoundError("Invitation not found")
        self.repo.delete(inv)
        self.db.commit()

    def get_public(self, token: str) -> InvitationPublic:
        inv = self.repo.get_by_token(token)
        if inv is None:
            raise NotFoundError("Invitation not found")
        return InvitationPublic(
            token=inv.token,
            status=inv.status,
            email=inv.email,
            role=inv.role,
            space_name=inv.space.name if inv.space else "",
            inviter_name=inv.inviter.username if inv.inviter else "",
            expires_at=inv.expires_at,
        )

    def accept(self, user: User, token: str) -> SpaceResponse:
        inv = self.repo.get_by_token(token)
        if inv is None:
            raise NotFoundError("Invitation not found")
        if inv.status != InvitationStatus.pending:
            raise BadRequestError("This invitation is no longer valid")
        expires = ensure_aware(inv.expires_at)
        if expires and expires < utcnow():
            inv.status = InvitationStatus.expired
            self.db.commit()
            raise BadRequestError("This invitation has expired")

        already = self.spaces.get_member(inv.space_id, user.id)
        if not already:
            self.spaces.add_member(inv.space_id, user.id, role=inv.role)
        inv.status = InvitationStatus.accepted

        space = self.spaces.get_by_id(inv.space_id)
        space_name = space.name if space else ""
        # Notify the inviter.
        self.notifications.emit(
            inv.inviter_id,
            NotificationType.invitation_accepted,
            {
                "space_id": inv.space_id,
                "space_name": space_name,
                "actor_name": user.username,
                "message": f"{user.username} accepted your invitation to {space_name}",
                "link": f"/spaces/{inv.space_id}",
            },
            actor_id=user.id,
        )
        # Notify existing members that someone joined.
        if not already:
            self.notifications.emit_to_members(
                inv.space_id,
                NotificationType.member_joined,
                {
                    "space_id": inv.space_id,
                    "space_name": space_name,
                    "actor_name": user.username,
                    "message": f"{user.username} joined {space_name}",
                    "link": f"/spaces/{inv.space_id}",
                },
                actor_id=user.id,
            )
        self.db.commit()
        return self.space_service.get_space(user, inv.space_id)

    def decline(self, user: User, token: str) -> None:
        inv = self.repo.get_by_token(token)
        if inv is None:
            raise NotFoundError("Invitation not found")
        if inv.status == InvitationStatus.pending:
            inv.status = InvitationStatus.declined
            self.db.commit()
