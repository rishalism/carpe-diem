"""Role-based access control for the admin portal.

Admins are normal ``User`` rows with an elevated ``role``. These dependencies
gate the ``/api/admin/*`` endpoints by privilege rank:

    user < moderator < admin < super_admin

Use ``require_roles(...)`` to demand membership in a specific set, or the
convenience dependencies ``require_moderator`` / ``require_admin`` /
``require_super_admin`` which apply the rank ordering.
"""
from dataclasses import dataclass
from typing import Callable

from fastapi import Depends, Request

from app.exceptions import PermissionDeniedError
from app.middleware.auth_middleware import get_current_user
from app.models.enums import UserRole
from app.models.user import User

# Higher number = more privilege. Used for "at least this role" checks.
ROLE_RANK: dict[UserRole, int] = {
    UserRole.user: 0,
    UserRole.moderator: 1,
    UserRole.admin: 2,
    UserRole.super_admin: 3,
}


def get_current_admin(current_user: User = Depends(get_current_user)) -> User:
    """Any authenticated staff member (moderator or above)."""
    if ROLE_RANK.get(current_user.role, 0) < ROLE_RANK[UserRole.moderator]:
        raise PermissionDeniedError("Admin portal access requires a staff role")
    return current_user


def require_min_role(minimum: UserRole) -> Callable[..., User]:
    """Dependency factory: caller must have at least ``minimum`` rank."""

    def _dep(current_user: User = Depends(get_current_user)) -> User:
        if ROLE_RANK.get(current_user.role, 0) < ROLE_RANK[minimum]:
            raise PermissionDeniedError(
                f"This action requires the {minimum.value} role or higher"
            )
        return current_user

    return _dep


# Convenience dependencies for routers.
require_moderator = require_min_role(UserRole.moderator)
require_admin = require_min_role(UserRole.admin)
require_super_admin = require_min_role(UserRole.super_admin)


def client_ip(request: Request) -> str:
    """Best-effort client IP for audit logging.

    Honors the first hop in X-Forwarded-For (set by Render/Vercel proxies),
    falling back to the direct peer address.
    """
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


@dataclass
class ReqMeta:
    """Audit context (IP + user agent) for a request."""

    ip: str
    user_agent: str


def req_meta(request: Request) -> ReqMeta:
    return ReqMeta(
        ip=client_ip(request),
        user_agent=(request.headers.get("user-agent") or "")[:512],
    )
