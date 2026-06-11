"""Reaction business logic + authorization."""
from sqlalchemy.orm import Session

from app.exceptions import NotFoundError
from app.models.enums import ReactionType
from app.models.reaction import Reaction
from app.models.user import User
from app.repositories.entry_repo import EntryRepository
from app.repositories.reaction_repo import ReactionRepository
from app.repositories.space_repo import SpaceRepository
from app.schemas.reaction import ReactionSummary


class ReactionService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = ReactionRepository(db)
        self.entries = EntryRepository(db)
        self.spaces = SpaceRepository(db)

    def _require_member(self, space_id: str, user_id: str) -> None:
        if self.spaces.get_member(space_id, user_id) is None:
            raise NotFoundError("Space not found")

    def _require_entry(self, space_id: str, entry_id: str) -> None:
        entry = self.entries.get_by_id(entry_id)
        if entry is None or entry.space_id != space_id:
            raise NotFoundError("Entry not found")

    def _summary(self, entry_id: str, user_id: str) -> ReactionSummary:
        reactions = self.repo.list_for_entry(entry_id)
        counts: dict[str, int] = {}
        mine: list[str] = []
        for r in reactions:
            counts[r.type.value] = counts.get(r.type.value, 0) + 1
            if r.user_id == user_id:
                mine.append(r.type.value)
        return ReactionSummary(counts=counts, mine=mine, total=len(reactions))

    def summary(self, user: User, space_id: str, entry_id: str) -> ReactionSummary:
        self._require_member(space_id, user.id)
        self._require_entry(space_id, entry_id)
        return self._summary(entry_id, user.id)

    def toggle(
        self, user: User, space_id: str, entry_id: str, rtype: ReactionType
    ) -> ReactionSummary:
        self._require_member(space_id, user.id)
        self._require_entry(space_id, entry_id)
        existing = self.repo.get(entry_id, user.id, rtype)
        if existing:
            self.repo.delete(existing)
        else:
            self.repo.add(Reaction(entry_id=entry_id, user_id=user.id, type=rtype))
        self.db.commit()
        return self._summary(entry_id, user.id)
