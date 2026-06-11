"""Data access for invitations."""
from typing import List, Optional

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models.enums import InvitationStatus
from app.models.invitation import Invitation


class InvitationRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, invitation_id: str) -> Optional[Invitation]:
        return self.db.get(Invitation, invitation_id)

    def get_by_token(self, token: str) -> Optional[Invitation]:
        stmt = (
            select(Invitation)
            .where(Invitation.token == token)
            .options(selectinload(Invitation.inviter), selectinload(Invitation.space))
        )
        return self.db.scalar(stmt)

    def get_pending(self, space_id: str, email: str) -> Optional[Invitation]:
        stmt = select(Invitation).where(
            Invitation.space_id == space_id,
            Invitation.email == email.lower(),
            Invitation.status == InvitationStatus.pending,
        )
        return self.db.scalar(stmt)

    def list_for_space(self, space_id: str) -> List[Invitation]:
        stmt = (
            select(Invitation)
            .where(Invitation.space_id == space_id)
            .options(selectinload(Invitation.inviter))
            .order_by(Invitation.created_at.desc())
        )
        return list(self.db.scalars(stmt).all())

    def add(self, invitation: Invitation) -> Invitation:
        self.db.add(invitation)
        self.db.flush()
        return invitation

    def delete(self, invitation: Invitation) -> None:
        self.db.delete(invitation)
