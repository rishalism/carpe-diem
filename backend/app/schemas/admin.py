"""Admin-portal request/response schemas.

Privacy note: journal entry/comment CONTENT only appears in ``ReportCaseDetail``
(an open moderation case). No other admin schema exposes content.
"""
from datetime import datetime
from typing import Generic, List, Optional, TypeVar

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import (
    AccountStatus,
    ReportContentType,
    ReportSeverity,
    ReportStatus,
    UserRole,
)

T = TypeVar("T")


class Paginated(BaseModel, Generic[T]):
    items: List[T]
    total: int
    page: int
    page_size: int
    pages: int


# --- Auth / identity ---------------------------------------------------------
class AdminMe(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    username: str
    email: str
    role: UserRole


# --- User management ---------------------------------------------------------
class AdminUserListItem(BaseModel):
    id: str
    username: str
    email: str
    role: UserRole
    account_status: AccountStatus
    auth_method: str  # "google" | "password"
    created_at: datetime
    last_active_at: Optional[datetime] = None
    total_spaces: int
    total_entries: int
    total_reports_against: int


class AdminUserDetail(AdminUserListItem):
    bio: Optional[str] = None
    avatar_url: Optional[str] = None
    suspension_reason: Optional[str] = None
    total_comments: int
    total_reactions: int


class SuspendRequest(BaseModel):
    reason: str = Field(min_length=5, max_length=2000)


class BanRequest(BaseModel):
    reason: str = Field(min_length=5, max_length=2000)


class DeleteUserRequest(BaseModel):
    # Typed confirmation guard — must equal the target's username.
    confirm_username: str
    reason: str = Field(min_length=5, max_length=2000)


class RoleUpdateRequest(BaseModel):
    role: UserRole


class ResetPasswordResponse(BaseModel):
    detail: str
    # Present only in dev / when email delivery is not configured.
    temporary_link: Optional[str] = None


# --- Audit log ---------------------------------------------------------------
class AuditLogResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    admin_id: Optional[str] = None
    admin_name: str
    admin_role: str
    action: str
    resource_type: Optional[str] = None
    resource_id: Optional[str] = None
    reason: Optional[str] = None
    result: str
    ip_address: Optional[str] = None
    created_at: datetime


# --- Reports / moderation ----------------------------------------------------
class ReportListItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    content_type: ReportContentType
    content_id: str
    reported_user_id: Optional[str] = None
    reporter_id: Optional[str] = None
    reason: str
    status: ReportStatus
    severity: ReportSeverity
    assigned_admin_id: Optional[str] = None
    created_at: datetime


class ReportCaseDetail(ReportListItem):
    """Includes the reported content — the ONLY place content is exposed."""

    details: Optional[str] = None
    resolution_note: Optional[str] = None
    reported_username: Optional[str] = None
    # Reported content, surfaced only because this is an open case.
    content_title: Optional[str] = None
    content_body: Optional[str] = None
    content_exists: bool = True


class AssignRequest(BaseModel):
    # Omit to claim the case for yourself.
    admin_id: Optional[str] = None


class ResolveRequest(BaseModel):
    resolution_note: str = Field(min_length=3, max_length=2000)


class SeverityRequest(BaseModel):
    severity: ReportSeverity


# --- Dashboard ---------------------------------------------------------------
class AdminDashboard(BaseModel):
    total_users: int
    active_users_7d: int
    new_signups_7d: int
    total_spaces: int
    total_entries: int
    entries_24h: int
    open_reports: int
    suspended_users: int
    signups_trend: List["TrendPoint"]


class TrendPoint(BaseModel):
    date: str  # YYYY-MM-DD
    count: int


AdminDashboard.model_rebuild()
