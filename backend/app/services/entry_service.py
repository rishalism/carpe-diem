"""Journal entry business logic + authorization."""
from typing import List, Optional

from sqlalchemy.orm import Session

from app.config import settings
from app.exceptions import NotFoundError, PermissionDeniedError
from app.models.entry import JournalEntry
from app.models.enums import AIStatus, Mood, NotificationType
from app.models.user import User
from app.repositories.entry_repo import EntryRepository
from app.repositories.space_repo import SpaceRepository
from app.schemas.entry import EntryCreate, EntryResponse, EntryUpdate
from app.services.notification_service import NotificationService


class EntryService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = EntryRepository(db)
        self.spaces = SpaceRepository(db)
        self.notifications = NotificationService(db)

    def _require_member(self, space_id: str, user_id: str) -> None:
        if self.spaces.get_member(space_id, user_id) is None:
            raise NotFoundError("Space not found")

    def _load_in_space(self, space_id: str, entry_id: str) -> JournalEntry:
        entry = self.repo.get_by_id(entry_id)
        if entry is None or entry.space_id != space_id:
            raise NotFoundError("Entry not found")
        return entry

    def create_entry(
        self, user: User, space_id: str, data: EntryCreate
    ) -> EntryResponse:
        self._require_member(space_id, user.id)
        entry = JournalEntry(
            space_id=space_id,
            author_id=user.id,
            title=data.title,
            content=data.content,
            mood=data.mood,
        )
        if data.tags:
            entry.tags = self.repo.get_or_create_tags(data.tags)
        if data.use_ai and settings.ai_enabled:
            entry.ai_status = AIStatus.pending
        self.repo.add(entry)

        space = self.spaces.get_by_id(space_id)
        self.notifications.emit_to_members(
            space_id,
            NotificationType.new_entry,
            {
                "space_id": space_id,
                "space_name": space.name if space else "",
                "entry_id": entry.id,
                "entry_title": entry.title,
                "actor_name": user.username,
                "message": f'{user.username} added "{entry.title}"',
                "link": f"/spaces/{space_id}/entries/{entry.id}",
            },
            actor_id=user.id,
        )
        self.db.commit()
        # Reload with relationships eagerly populated for the response.
        entry = self.repo.get_by_id(entry.id)
        # AI enhancement (use_ai) is wired in Phase 3.
        return EntryResponse.model_validate(entry)

    def list_entries(
        self,
        user: User,
        space_id: str,
        *,
        author_id: Optional[str] = None,
        mood: Optional[Mood] = None,
        tag: Optional[str] = None,
        search: Optional[str] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> List[EntryResponse]:
        self._require_member(space_id, user.id)
        entries = self.repo.list_for_space(
            space_id,
            author_id=author_id,
            mood=mood,
            tag=tag,
            search=search,
            limit=limit,
            offset=offset,
        )
        return [EntryResponse.model_validate(e) for e in entries]

    def get_entry(self, user: User, space_id: str, entry_id: str) -> EntryResponse:
        self._require_member(space_id, user.id)
        entry = self._load_in_space(space_id, entry_id)
        return EntryResponse.model_validate(entry)

    def update_entry(
        self, user: User, space_id: str, entry_id: str, data: EntryUpdate
    ) -> EntryResponse:
        self._require_member(space_id, user.id)
        entry = self._load_in_space(space_id, entry_id)
        if entry.author_id != user.id:
            raise PermissionDeniedError("You can only edit your own entries")

        fields = data.model_dump(exclude_unset=True, exclude={"tags", "use_ai"})
        for field, value in fields.items():
            setattr(entry, field, value)
        if data.tags is not None:
            entry.tags = self.repo.get_or_create_tags(data.tags)
        if data.use_ai and settings.ai_enabled:
            entry.ai_status = AIStatus.pending
        self.db.commit()
        entry = self.repo.get_by_id(entry_id)
        return EntryResponse.model_validate(entry)

    def delete_entry(self, user: User, space_id: str, entry_id: str) -> None:
        self._require_member(space_id, user.id)
        entry = self._load_in_space(space_id, entry_id)
        if entry.author_id != user.id:
            raise PermissionDeniedError("You can only delete your own entries")
        self.repo.delete(entry)
        self.db.commit()
