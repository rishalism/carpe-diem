"""User-related schemas."""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class UserSummary(BaseModel):
    """Lightweight user info embedded in other responses."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    username: str
    avatar_url: Optional[str] = None


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    email: EmailStr
    username: str
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    dark_mode: bool
    notification_prefs: dict
    created_at: datetime


class UserUpdate(BaseModel):
    username: Optional[str] = Field(default=None, min_length=2, max_length=50)
    avatar_url: Optional[str] = Field(default=None, max_length=512)
    bio: Optional[str] = Field(default=None, max_length=2000)
    dark_mode: Optional[bool] = None
    notification_prefs: Optional[dict] = None
