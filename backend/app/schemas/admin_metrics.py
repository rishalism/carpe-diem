"""Phase 2 admin schemas: analytics, journal monitoring, AI, storage, system,
space management, and user journey.

Privacy: none of these expose journal entry/comment CONTENT — only counts,
metadata, moods, and timestamps.
"""
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field

from app.models.enums import AIStatus, Mood, SpaceType
from app.schemas.admin import TrendPoint


# --- Space action requests ---------------------------------------------------
class SpaceDeleteRequest(BaseModel):
    confirm_name: str
    reason: str = Field(min_length=5, max_length=2000)


class RemoveMemberRequest(BaseModel):
    user_id: str
    reason: str = Field(min_length=5, max_length=2000)


# --- Analytics ---------------------------------------------------------------
class FunnelStep(BaseModel):
    key: str
    label: str
    count: int
    pct: float  # relative to the registered total


class EngagementStats(BaseModel):
    dau: int
    wau: int
    mau: int
    stickiness: float  # DAU / MAU
    entries_per_active: float
    comments_per_active: float
    reactions_per_active: float


class AnalyticsSummary(BaseModel):
    total_users: int
    signups_google: int
    signups_password: int
    growth_trend: List[TrendPoint]
    cumulative_users: int
    funnel: List[FunnelStep]
    engagement: EngagementStats
    # Rolling retention: fraction of the eligible cohort whose last activity is
    # at least N days after registration. `retention_basis` documents the rule.
    retention_d1: float
    retention_d7: float
    retention_d30: float
    retention_basis: str


# --- Journal monitoring (metadata only) --------------------------------------
class JournalAggregates(BaseModel):
    total_entries: int
    entries_today: int
    entries_7d: int
    entries_30d: int
    mood_counts: dict[str, int]
    attachment_rate: float
    ai_enhanced_rate: float
    reported_entries: int


class EntryMetaItem(BaseModel):
    entry_id: str
    space_id: str
    author_user_id: str
    created_at: datetime
    mood: Optional[Mood] = None
    has_attachments: bool
    ai_status: AIStatus
    comment_count: int
    reaction_count: int
    is_reported: bool


# --- AI monitoring -----------------------------------------------------------
class AIMonitoring(BaseModel):
    total_entries: int
    by_status: dict[str, int]
    success_rate: float       # done / (done + failed)
    failure_rate: float
    ai_enhanced_rate: float   # done / total_entries
    adoption_pct: float       # users who used AI / users with any entry
    requests_24h: int
    requests_7d: int
    note: str


# --- Storage -----------------------------------------------------------------
class LargestObject(BaseModel):
    id: str
    file_name: str
    file_size: Optional[int] = None
    file_type: Optional[str] = None
    space_id: Optional[str] = None


class StorageStats(BaseModel):
    backend: str  # "supabase" | "local"
    total_attachments: int
    total_bytes: int
    avg_bytes: int
    by_type: dict[str, int]
    largest: List[LargestObject]


# --- System health -----------------------------------------------------------
class SystemHealth(BaseModel):
    status: str  # Operational | Degraded | Down
    db_ok: bool
    ai_enabled: bool
    ai_pending: int
    ai_oldest_pending_age_seconds: Optional[int] = None
    ai_failed_24h: int
    storage_backend: str
    total_users: int
    total_entries: int


# --- Space management --------------------------------------------------------
class AdminSpaceListItem(BaseModel):
    id: str
    name: str
    type: SpaceType
    owner_id: str
    owner_username: Optional[str] = None
    member_count: int
    entry_count: int
    pending_invitations: int
    archived: bool
    created_at: datetime
    last_activity_at: Optional[datetime] = None


class SpaceMemberItem(BaseModel):
    user_id: str
    username: str
    role: str
    joined_at: datetime


class SpaceInvitationItem(BaseModel):
    email: str
    status: str
    created_at: datetime


class AdminSpaceDetail(AdminSpaceListItem):
    description: Optional[str] = None
    members: List[SpaceMemberItem]
    invitations: List[SpaceInvitationItem]


# --- User journey ------------------------------------------------------------
class JourneyEvent(BaseModel):
    type: str
    label: str
    at: Optional[datetime] = None


class UserJourney(BaseModel):
    stage: str  # Activated | Habitual | Dormant | Churned | New
    events: List[JourneyEvent]
    retained_d1: bool
    retained_d7: bool
    retained_d30: bool


__all__ = [
    "FunnelStep",
    "EngagementStats",
    "AnalyticsSummary",
    "JournalAggregates",
    "EntryMetaItem",
    "AIMonitoring",
    "LargestObject",
    "StorageStats",
    "SystemHealth",
    "AdminSpaceListItem",
    "SpaceMemberItem",
    "SpaceInvitationItem",
    "AdminSpaceDetail",
    "JourneyEvent",
    "UserJourney",
]
