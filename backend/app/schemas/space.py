"""Space-related schemas."""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import MemberRole, SpaceType
from app.schemas.user import UserSummary


class SpaceCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    type: SpaceType = SpaceType.personal
    description: Optional[str] = Field(default=None, max_length=2000)
    cover_image_url: Optional[str] = Field(default=None, max_length=512)


class SpaceUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=120)
    description: Optional[str] = Field(default=None, max_length=2000)
    cover_image_url: Optional[str] = Field(default=None, max_length=512)
    archived: Optional[bool] = None


class SpaceMemberResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    role: MemberRole
    joined_at: datetime
    user: UserSummary


class SpaceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    description: Optional[str] = None
    type: SpaceType
    cover_image_url: Optional[str] = None
    owner_id: str
    archived: bool
    created_at: datetime
    updated_at: datetime
    # Populated by the service layer:
    member_count: int = 0
    entry_count: int = 0
    current_user_role: Optional[MemberRole] = None
