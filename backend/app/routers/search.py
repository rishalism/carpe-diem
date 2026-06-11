"""Global search endpoint."""
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.middleware.auth_middleware import get_current_user
from app.models.enums import Mood
from app.models.user import User
from app.schemas.search import EntrySearchResult
from app.services.search_service import SearchService

router = APIRouter(prefix="/search", tags=["search"])


@router.get("", response_model=List[EntrySearchResult])
def search_entries(
    q: Optional[str] = None,
    mood: Optional[Mood] = None,
    tag: Optional[str] = None,
    space_id: Optional[str] = None,
    author_id: Optional[str] = None,
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return SearchService(db).search(
        current_user,
        q=q,
        mood=mood,
        tag=tag,
        space_id=space_id,
        author_id=author_id,
        date_from=date_from,
        date_to=date_to,
        limit=limit,
        offset=offset,
    )
