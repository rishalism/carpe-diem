"""Public runtime config for the frontend (which optional features are enabled)."""
from fastapi import APIRouter

from app.config import settings
from app.utils.validation import MAX_FILE_SIZE_BYTES

router = APIRouter(prefix="/config", tags=["config"])


@router.get("")
def get_config():
    return {
        "ai_enabled": settings.ai_enabled,
        "supabase_enabled": settings.supabase_enabled,
        "google_enabled": settings.google_enabled,
        "google_client_id": settings.GOOGLE_CLIENT_ID,
        "max_file_size_mb": MAX_FILE_SIZE_BYTES // (1024 * 1024),
    }
