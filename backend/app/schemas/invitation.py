"""Invitation schemas."""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, EmailStr

from app.models.enums import InvitationStatus, MemberRole
from app.schemas.user import UserSummary


class InvitationCreate(BaseModel):
    email: EmailStr
    role: MemberRole = MemberRole.member


class InvitationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    space_id: str
    email: EmailStr
    role: MemberRole
    status: InvitationStatus
    token: str
    created_at: datetime
    expires_at: Optional[datetime] = None
    inviter: UserSummary


class InvitationPublic(BaseModel):
    """Shown to an invitee when they open an invite link."""

    token: str
    status: InvitationStatus
    email: EmailStr
    role: MemberRole
    space_name: str
    inviter_name: str
    expires_at: Optional[datetime] = None
