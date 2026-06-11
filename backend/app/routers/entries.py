"""Journal entry endpoints (nested under a space)."""
from typing import List, Optional

from fastapi import APIRouter, BackgroundTasks, Depends, Query, Response
from sqlalchemy.orm import Session

from app.config import settings
from app.database.session import get_db
from app.middleware.auth_middleware import get_current_user
from app.models.enums import Mood
from app.models.user import User
from app.schemas.entry import EntryCreate, EntryResponse, EntryUpdate
from app.services.entry_service import EntryService
from app.tasks.ai_tasks import enhance_entry_task

router = APIRouter(prefix="/spaces/{space_id}/entries", tags=["entries"])


@router.post("", response_model=EntryResponse, status_code=201)
def create_entry(
    space_id: str,
    data: EntryCreate,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    entry = EntryService(db).create_entry(current_user, space_id, data)
    if data.use_ai and settings.ai_enabled:
        background_tasks.add_task(enhance_entry_task, entry.id)
    return entry


@router.get("", response_model=List[EntryResponse])
def list_entries(
    space_id: str,
    author_id: Optional[str] = None,
    mood: Optional[Mood] = None,
    tag: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return EntryService(db).list_entries(
        current_user,
        space_id,
        author_id=author_id,
        mood=mood,
        tag=tag,
        search=search,
        limit=limit,
        offset=offset,
    )


@router.get("/{entry_id}", response_model=EntryResponse)
def get_entry(
    space_id: str,
    entry_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return EntryService(db).get_entry(current_user, space_id, entry_id)


@router.patch("/{entry_id}", response_model=EntryResponse)
def update_entry(
    space_id: str,
    entry_id: str,
    data: EntryUpdate,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    entry = EntryService(db).update_entry(current_user, space_id, entry_id, data)
    if data.use_ai and settings.ai_enabled:
        background_tasks.add_task(enhance_entry_task, entry.id)
    return entry


@router.delete("/{entry_id}", status_code=204)
def delete_entry(
    space_id: str,
    entry_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    EntryService(db).delete_entry(current_user, space_id, entry_id)
    return Response(status_code=204)
