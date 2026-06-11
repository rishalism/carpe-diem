"""Admin identity endpoint."""
from fastapi import APIRouter, Depends

from app.middleware.admin_middleware import get_current_admin
from app.models.user import User
from app.schemas.admin import AdminMe

router = APIRouter(tags=["admin:auth"])


@router.get("/me", response_model=AdminMe)
def admin_me(admin: User = Depends(get_current_admin)):
    """Return the current staff member's identity and role.

    Used by the admin frontend to confirm portal access and tailor the UI to
    the role. Returns 403 for non-staff accounts.
    """
    return admin
