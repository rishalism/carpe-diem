"""User account model."""
from datetime import datetime
from typing import Optional

from sqlalchemy import JSON, Boolean, DateTime, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import GUID, Base, TimestampMixin, gen_uuid
from app.models.enums import AccountStatus, UserRole, enum_column


class User(Base, TimestampMixin):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(GUID, primary_key=True, default=gen_uuid)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    password_hash: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    google_id: Mapped[Optional[str]] = mapped_column(
        String(255), unique=True, index=True, nullable=True
    )
    username: Mapped[str] = mapped_column(String(50), nullable=False)
    avatar_url: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)
    bio: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    dark_mode: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    notification_prefs: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)

    # --- Admin / moderation fields ---
    # `role` drives admin-portal access (see app.middleware.admin_middleware).
    role: Mapped[UserRole] = mapped_column(
        enum_column(UserRole), default=UserRole.user, nullable=False, index=True
    )
    account_status: Mapped[AccountStatus] = mapped_column(
        enum_column(AccountStatus), default=AccountStatus.active, nullable=False, index=True
    )
    # Reason captured when an admin suspends/bans the account (audited).
    suspension_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    last_active_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    owned_spaces = relationship(
        "Space", back_populates="owner", cascade="all, delete-orphan"
    )
    memberships = relationship(
        "SpaceMember", back_populates="user", cascade="all, delete-orphan"
    )
    entries = relationship(
        "JournalEntry", back_populates="author", cascade="all, delete-orphan"
    )
    comments = relationship(
        "Comment", back_populates="author", cascade="all, delete-orphan"
    )
    reactions = relationship(
        "Reaction", back_populates="user", cascade="all, delete-orphan"
    )
