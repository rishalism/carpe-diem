"""Global search across the user's spaces."""
from datetime import datetime
from typing import List, Optional

from sqlalchemy.orm import Session

from app.models.enums import Mood
from app.models.user import User
from app.repositories.entry_repo import EntryRepository
from app.schemas.search import EntrySearchResult


class SearchService:
    def __init__(self, db: Session):
        self.db = db
        self.entries = EntryRepository(db)

    def search(
        self,
        user: User,
        *,
        q: Optional[str] = None,
        mood: Optional[Mood] = None,
        tag: Optional[str] = None,
        space_id: Optional[str] = None,
        author_id: Optional[str] = None,
        date_from: Optional[datetime] = None,
        date_to: Optional[datetime] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> List[EntrySearchResult]:
        rows = self.entries.search_for_user(
            user.id,
            search=q,
            mood=mood,
            tag=tag,
            space_id=space_id,
            author_id=author_id,
            date_from=date_from,
            date_to=date_to,
            limit=limit,
            offset=offset,
        )
        results: List[EntrySearchResult] = []
        for entry in rows:
            item = EntrySearchResult.model_validate(entry)
            item.space_name = entry.space.name if entry.space else ""
            results.append(item)
        return results
