"""Admin user-management business logic: listing, lifecycle actions, roles.

Every mutating method writes an audit record in the same transaction as the
change, so the action and its audit trail commit atomically.
"""
import math
from typing import Optional

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.config import settings
from app.exceptions import BadRequestError, ConflictError, NotFoundError, PermissionDeniedError
from app.middleware.admin_middleware import ROLE_RANK
from app.models.enums import AccountStatus, UserRole
from app.models.user import User
from app.repositories.admin_repo import AdminRepository
from app.repositories.report_repo import ReportRepository
from app.schemas.admin import (
    AdminUserDetail,
    AdminUserListItem,
    Paginated,
    ResetPasswordResponse,
)
from app.services.audit_service import AuditService
from app.utils.security import create_reset_token


def _auth_method(user: User) -> str:
    return "google" if user.google_id else "password"


class AdminUserService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = AdminRepository(db)
        self.reports = ReportRepository(db)
        self.audit = AuditService(db)

    # --- read ----------------------------------------------------------------
    def list(
        self,
        *,
        page: int,
        page_size: int,
        status: Optional[AccountStatus] = None,
        role: Optional[UserRole] = None,
        q: Optional[str] = None,
    ) -> Paginated[AdminUserListItem]:
        offset = (page - 1) * page_size
        users, total = self.repo.list_users(
            offset=offset, limit=page_size, status=status, role=role, q=q
        )
        ids = [u.id for u in users]
        spaces = self.repo.spaces_count(ids)
        entries = self.repo.entries_count(ids)
        reports = self.reports.count_against_users(ids)

        items = [
            AdminUserListItem(
                id=u.id,
                username=u.username,
                email=u.email,
                role=u.role,
                account_status=u.account_status,
                auth_method=_auth_method(u),
                created_at=u.created_at,
                last_active_at=u.last_active_at,
                total_spaces=spaces.get(u.id, 0),
                total_entries=entries.get(u.id, 0),
                total_reports_against=reports.get(u.id, 0),
            )
            for u in users
        ]
        return Paginated(
            items=items,
            total=total,
            page=page,
            page_size=page_size,
            pages=max(1, math.ceil(total / page_size)),
        )

    def get_detail(self, user_id: str) -> AdminUserDetail:
        user = self._get(user_id)
        ids = [user.id]
        return AdminUserDetail(
            id=user.id,
            username=user.username,
            email=user.email,
            role=user.role,
            account_status=user.account_status,
            auth_method=_auth_method(user),
            created_at=user.created_at,
            last_active_at=user.last_active_at,
            total_spaces=self.repo.spaces_count(ids).get(user.id, 0),
            total_entries=self.repo.entries_count(ids).get(user.id, 0),
            total_reports_against=self.reports.count_against_users(ids).get(user.id, 0),
            total_comments=self.repo.comments_count(ids).get(user.id, 0),
            total_reactions=self.repo.reactions_count(ids).get(user.id, 0),
            bio=user.bio,
            avatar_url=user.avatar_url,
            suspension_reason=user.suspension_reason,
        )

    # --- lifecycle actions ---------------------------------------------------
    def suspend(self, actor: User, user_id: str, reason: str, ip: str, ua: str) -> AdminUserDetail:
        user = self._target_for_enforcement(actor, user_id)
        if user.account_status in (AccountStatus.banned, AccountStatus.deleted):
            raise ConflictError("Cannot suspend a banned or deleted account")
        user.account_status = AccountStatus.suspended
        user.suspension_reason = reason
        self._commit_with_audit(
            actor, "user.suspend", user_id, reason=reason, ip=ip, ua=ua
        )
        return self.get_detail(user_id)

    def reactivate(self, actor: User, user_id: str, ip: str, ua: str) -> AdminUserDetail:
        user = self._target_for_enforcement(actor, user_id)
        if user.account_status == AccountStatus.deleted:
            raise ConflictError("Cannot reactivate a deleted account")
        # A banned account can only be reactivated by a super admin.
        if user.account_status == AccountStatus.banned and actor.role != UserRole.super_admin:
            raise PermissionDeniedError("Only a super admin can reverse a ban")
        user.account_status = AccountStatus.active
        user.suspension_reason = None
        self._commit_with_audit(actor, "user.reactivate", user_id, ip=ip, ua=ua)
        return self.get_detail(user_id)

    def ban(self, actor: User, user_id: str, reason: str, ip: str, ua: str) -> AdminUserDetail:
        user = self._target_for_enforcement(actor, user_id)
        if user.account_status == AccountStatus.deleted:
            raise ConflictError("Cannot ban a deleted account")
        user.account_status = AccountStatus.banned
        user.suspension_reason = reason
        self._commit_with_audit(actor, "user.ban", user_id, reason=reason, ip=ip, ua=ua)
        return self.get_detail(user_id)

    def soft_delete(
        self, actor: User, user_id: str, confirm_username: str, reason: str, ip: str, ua: str
    ) -> None:
        user = self._target_for_enforcement(actor, user_id)
        if confirm_username != user.username:
            raise BadRequestError("Confirmation username does not match")
        user.account_status = AccountStatus.deleted
        user.suspension_reason = reason
        # Minimize PII while retaining the row for the audit trail.
        user.bio = None
        user.avatar_url = None
        self._commit_with_audit(actor, "user.delete", user_id, reason=reason, ip=ip, ua=ua)

    def reset_password(self, actor: User, user_id: str, ip: str, ua: str) -> ResetPasswordResponse:
        user = self._get(user_id)
        if user.google_id and not user.password_hash:
            raise BadRequestError("This account signs in with Google; no password to reset")
        token = create_reset_token(user.id)
        link = f"{settings.FRONTEND_URL}/reset-password?token={token}"
        # Audit records WHO initiated the reset — never the token/password.
        self._commit_with_audit(actor, "user.reset_password", user_id, ip=ip, ua=ua)
        return ResetPasswordResponse(
            detail="Password reset link generated. Delivered to the user by email when configured.",
            temporary_link=link,
        )

    def set_role(self, actor: User, user_id: str, role: UserRole, ip: str, ua: str) -> AdminUserDetail:
        user = self._get(user_id)
        if user.id == actor.id:
            raise PermissionDeniedError("You cannot change your own role")
        # Guard against demoting the last super admin.
        if user.role == UserRole.super_admin and role != UserRole.super_admin:
            others = self.db.scalar(
                select(func.count()).select_from(User).where(
                    User.role == UserRole.super_admin, User.id != user.id
                )
            ) or 0
            if others == 0:
                raise ConflictError("At least one super admin must remain")
        old = user.role.value
        user.role = role
        self._commit_with_audit(
            actor, "user.set_role", user_id,
            reason=f"{old} -> {role.value}",
            meta={"from": old, "to": role.value}, ip=ip, ua=ua,
        )
        return self.get_detail(user_id)

    # --- helpers -------------------------------------------------------------
    def _get(self, user_id: str) -> User:
        user = self.db.get(User, user_id)
        if user is None:
            raise NotFoundError("User not found")
        return user

    def _target_for_enforcement(self, actor: User, user_id: str) -> User:
        """Fetch target and block acting on yourself or on a peer/higher role."""
        user = self._get(user_id)
        if user.id == actor.id:
            raise PermissionDeniedError("You cannot perform this action on your own account")
        if ROLE_RANK.get(user.role, 0) >= ROLE_RANK.get(actor.role, 0):
            raise PermissionDeniedError(
                "You cannot perform enforcement actions on a peer or higher-ranked account"
            )
        return user

    def _commit_with_audit(
        self, actor, action, resource_id, *, reason=None, meta=None, ip=None, ua=None
    ) -> None:
        self.audit.record(
            admin=actor, action=action, resource_type="user", resource_id=resource_id,
            reason=reason, meta=meta, ip_address=ip, user_agent=ua, commit=False,
        )
        self.db.commit()
