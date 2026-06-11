"""Validation helpers (file uploads, etc.). Used from Phase 3 onward."""
from typing import Optional

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/gif", "image/webp"}
ALLOWED_DOC_TYPES = {
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
}
MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB


def is_allowed_file_type(content_type: Optional[str]) -> bool:
    if not content_type:
        return False
    return content_type in ALLOWED_IMAGE_TYPES or content_type in ALLOWED_DOC_TYPES


def is_within_size_limit(size: Optional[int]) -> bool:
    if size is None:
        return True
    return 0 < size <= MAX_FILE_SIZE_BYTES
