"""User-facing report schemas (filing a report against content)."""
from typing import Optional

from pydantic import BaseModel, Field

from app.models.enums import ReportContentType


class ReportCreateRequest(BaseModel):
    content_type: ReportContentType
    content_id: str
    reason: str = Field(min_length=2, max_length=64)
    details: Optional[str] = Field(default=None, max_length=2000)


class ReportCreatedResponse(BaseModel):
    id: str
    detail: str = "Report submitted for review"
