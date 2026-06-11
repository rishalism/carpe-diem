"""Enumerated types shared across models and schemas.

Stored as VARCHAR + CHECK constraint (native_enum=False) so they are portable
between SQLite and PostgreSQL without enum-type migrations.
"""
import enum

from sqlalchemy import Enum as SAEnum


class SpaceType(str, enum.Enum):
    personal = "personal"
    couple = "couple"
    family = "family"
    friends = "friends"
    custom = "custom"


class MemberRole(str, enum.Enum):
    owner = "owner"
    member = "member"


class InvitationStatus(str, enum.Enum):
    pending = "pending"
    accepted = "accepted"
    declined = "declined"
    expired = "expired"


class Mood(str, enum.Enum):
    happy = "happy"
    grateful = "grateful"
    excited = "excited"
    calm = "calm"
    neutral = "neutral"
    tired = "tired"
    anxious = "anxious"
    sad = "sad"
    angry = "angry"


class AIStatus(str, enum.Enum):
    none = "none"
    pending = "pending"
    done = "done"
    failed = "failed"


class ReactionType(str, enum.Enum):
    heart = "heart"
    thumbs_up = "thumbs_up"
    smile = "smile"
    party = "party"
    sad = "sad"


class NotificationType(str, enum.Enum):
    space_invitation = "space_invitation"
    invitation_accepted = "invitation_accepted"
    new_entry = "new_entry"
    new_comment = "new_comment"
    member_joined = "member_joined"


class UserRole(str, enum.Enum):
    """Platform-level role. `user` is a normal end user with no admin access.

    Ranked privilege: user < moderator < admin < super_admin. See
    ``ROLE_RANK`` in ``app.middleware.admin_middleware`` for enforcement.
    """

    user = "user"
    moderator = "moderator"
    admin = "admin"
    super_admin = "super_admin"


class AccountStatus(str, enum.Enum):
    active = "active"
    inactive = "inactive"
    suspended = "suspended"
    banned = "banned"
    deleted = "deleted"


class ReportContentType(str, enum.Enum):
    entry = "entry"
    comment = "comment"


class ReportStatus(str, enum.Enum):
    open = "open"
    under_review = "under_review"
    action_taken = "action_taken"
    dismissed = "dismissed"


class ReportSeverity(str, enum.Enum):
    low = "low"
    medium = "medium"
    high = "high"
    critical = "critical"


def enum_column(py_enum, length: int = 32) -> SAEnum:
    """Build a portable, string-backed Enum column type."""
    return SAEnum(
        py_enum,
        native_enum=False,
        length=length,
        validate_strings=True,
        values_callable=lambda e: [m.value for m in e],
    )
