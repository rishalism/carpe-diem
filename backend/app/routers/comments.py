"""Comment endpoints (nested under an entry)."""
from typing import List

from fastapi import APIRouter, Depends, Response
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.middleware.auth_middleware import get_current_user
from app.models.user import User
from app.schemas.comment import CommentCreate, CommentResponse, CommentUpdate
from app.services.comment_service import CommentService

router = APIRouter(
    prefix="/spaces/{space_id}/entries/{entry_id}/comments", tags=["comments"]
)


@router.get("", response_model=List[CommentResponse])
def list_comments(
    space_id: str,
    entry_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return CommentService(db).list_comments(current_user, space_id, entry_id)


@router.post("", response_model=CommentResponse, status_code=201)
def create_comment(
    space_id: str,
    entry_id: str,
    data: CommentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return CommentService(db).create_comment(current_user, space_id, entry_id, data)


@router.patch("/{comment_id}", response_model=CommentResponse)
def update_comment(
    space_id: str,
    entry_id: str,
    comment_id: str,
    data: CommentUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return CommentService(db).update_comment(
        current_user, space_id, entry_id, comment_id, data
    )


@router.delete("/{comment_id}", status_code=204)
def delete_comment(
    space_id: str,
    entry_id: str,
    comment_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    CommentService(db).delete_comment(current_user, space_id, entry_id, comment_id)
    return Response(status_code=204)
