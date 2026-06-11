"""User profile + account business logic."""
from typing import Any, Dict

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.comment import Comment
from app.models.user import User
from app.repositories.entry_repo import EntryRepository
from app.repositories.space_repo import SpaceRepository
from app.schemas.user import UserUpdate


class UserService:
    def __init__(self, db: Session):
        self.db = db

    def update_profile(self, user: User, data: UserUpdate) -> User:
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(user, field, value)
        self.db.commit()
        self.db.refresh(user)
        return user

    def export_data(self, user: User) -> Dict[str, Any]:
        """Full export of the user's own data (profile, spaces, entries, comments)."""
        spaces = SpaceRepository(self.db).list_for_user(user.id, include_archived=True)
        entries = EntryRepository(self.db).search_for_user(user.id, author_id=user.id, limit=10000)
        comments = list(
            self.db.scalars(select(Comment).where(Comment.author_id == user.id)).all()
        )

        return {
            "profile": {
                "id": user.id,
                "email": user.email,
                "username": user.username,
                "bio": user.bio,
                "avatar_url": user.avatar_url,
                "created_at": user.created_at.isoformat(),
            },
            "spaces": [
                {
                    "id": s.id,
                    "name": s.name,
                    "type": s.type.value,
                    "description": s.description,
                    "archived": s.archived,
                    "created_at": s.created_at.isoformat(),
                }
                for s in spaces
            ],
            "entries": [
                {
                    "id": e.id,
                    "space_id": e.space_id,
                    "title": e.title,
                    "content": e.content,
                    "content_enhanced": e.content_enhanced,
                    "mood": e.mood.value if e.mood else None,
                    "tags": [t.name for t in e.tags],
                    "created_at": e.created_at.isoformat(),
                }
                for e in entries
            ],
            "comments": [
                {
                    "id": c.id,
                    "entry_id": c.entry_id,
                    "content": c.content,
                    "created_at": c.created_at.isoformat(),
                }
                for c in comments
            ],
        }

    def delete_account(self, user: User) -> None:
        # Cascades remove owned spaces (and their entries), memberships,
        # authored entries/comments/reactions.
        self.db.delete(user)
        self.db.commit()
