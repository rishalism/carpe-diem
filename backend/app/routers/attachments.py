"""Attachment endpoints (per entry) + per-space gallery."""
from typing import List

from fastapi import APIRouter, Depends, File, Response, UploadFile
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.middleware.auth_middleware import get_current_user
from app.models.user import User
from app.schemas.attachment import AttachmentResponse
from app.services.attachment_service import AttachmentService

# Per-entry attachments
router = APIRouter(
    prefix="/spaces/{space_id}/entries/{entry_id}/attachments", tags=["attachments"]
)
# Per-space gallery
gallery_router = APIRouter(prefix="/spaces/{space_id}/gallery", tags=["attachments"])


@router.get("", response_model=List[AttachmentResponse])
def list_attachments(
    space_id: str,
    entry_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return AttachmentService(db).list_for_entry(current_user, space_id, entry_id)


@router.post("", response_model=AttachmentResponse, status_code=201)
async def upload_attachment(
    space_id: str,
    entry_id: str,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    data = await file.read()
    return AttachmentService(db).upload(
        current_user,
        space_id,
        entry_id,
        data,
        file.filename or "file",
        file.content_type or "application/octet-stream",
    )


@router.delete("/{attachment_id}", status_code=204)
def delete_attachment(
    space_id: str,
    entry_id: str,
    attachment_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    AttachmentService(db).delete(current_user, space_id, attachment_id)
    return Response(status_code=204)


@gallery_router.get("", response_model=List[AttachmentResponse])
def space_gallery(
    space_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return AttachmentService(db).list_for_space(current_user, space_id)
