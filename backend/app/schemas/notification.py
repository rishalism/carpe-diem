"""Notification schemas."""
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict

from app.models.enums import NotificationType
from app.schemas.user import UserSummary


class NotificationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    type: NotificationType
    payload: dict
    read: bool
    created_at: datetime
    actor: Optional[UserSummary] = None


class NotificationList(BaseModel):
    items: List[NotificationResponse]
    unread_count: int
