"""Comment schemas (supports nested replies)."""
from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.user import UserSummary


class CommentCreate(BaseModel):
    content: str = Field(min_length=1, max_length=5000)
    parent_id: Optional[str] = None


class CommentUpdate(BaseModel):
    content: str = Field(min_length=1, max_length=5000)


class CommentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    entry_id: str
    parent_id: Optional[str] = None
    content: str
    author: UserSummary
    created_at: datetime
    updated_at: datetime
    replies: List["CommentResponse"] = Field(default_factory=list)
