"""Attachment schemas."""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict

from app.schemas.user import UserSummary


class AttachmentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    entry_id: str
    file_url: str
    file_name: str
    file_type: Optional[str] = None
    file_size: Optional[int] = None
    uploader: UserSummary
    created_at: datetime
