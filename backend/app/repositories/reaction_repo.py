"""Data access for reactions."""
from typing import List, Optional

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.enums import ReactionType
from app.models.reaction import Reaction


class ReactionRepository:
    def __init__(self, db: Session):
        self.db = db

    def list_for_entry(self, entry_id: str) -> List[Reaction]:
        stmt = select(Reaction).where(Reaction.entry_id == entry_id)
        return list(self.db.scalars(stmt).all())

    def get(self, entry_id: str, user_id: str, rtype: ReactionType) -> Optional[Reaction]:
        stmt = select(Reaction).where(
            Reaction.entry_id == entry_id,
            Reaction.user_id == user_id,
            Reaction.type == rtype,
        )
        return self.db.scalar(stmt)

    def add(self, reaction: Reaction) -> Reaction:
        self.db.add(reaction)
        self.db.flush()
        return reaction

    def delete(self, reaction: Reaction) -> None:
        self.db.delete(reaction)
