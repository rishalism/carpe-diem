"""Journal entry schemas."""
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.models.enums import AIStatus, Mood
from app.schemas.user import UserSummary


class EntryCreate(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    content: str = Field(default="", max_length=100_000)
    mood: Optional[Mood] = None
    tags: List[str] = Field(default_factory=list)
    use_ai: bool = False

    @field_validator("tags")
    @classmethod
    def _clean_tags(cls, v: List[str]) -> List[str]:
        cleaned = {t.strip().lower() for t in v if t and t.strip()}
        return sorted(cleaned)


class EntryUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=1, max_length=255)
    content: Optional[str] = Field(default=None, max_length=100_000)
    mood: Optional[Mood] = None
    tags: Optional[List[str]] = None
    enhanced_active: Optional[bool] = None
    use_ai: bool = False

    @field_validator("tags")
    @classmethod
    def _clean_tags(cls, v):
        if v is None:
            return v
        cleaned = {t.strip().lower() for t in v if t and t.strip()}
        return sorted(cleaned)


class EntryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    space_id: str
    title: str
    content: str
    content_enhanced: Optional[str] = None
    enhanced_active: bool
    ai_status: AIStatus
    mood: Optional[Mood] = None
    tags: List[str] = Field(default_factory=list)
    author: UserSummary
    created_at: datetime
    updated_at: datetime

    @field_validator("tags", mode="before")
    @classmethod
    def _tags_to_names(cls, v):
        # Accept either a list of Tag ORM objects or a list of strings.
        if v and not isinstance(v[0], str):
            return [t.name for t in v]
        return v
