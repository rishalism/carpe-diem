"""Data access for comments."""
from typing import List, Optional

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models.comment import Comment


class CommentRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, comment_id: str) -> Optional[Comment]:
        stmt = (
            select(Comment)
            .where(Comment.id == comment_id)
            .options(selectinload(Comment.author))
        )
        return self.db.scalar(stmt)

    def list_for_entry(self, entry_id: str) -> List[Comment]:
        stmt = (
            select(Comment)
            .where(Comment.entry_id == entry_id)
            .options(selectinload(Comment.author))
            .order_by(Comment.created_at.asc())
        )
        return list(self.db.scalars(stmt).all())

    def add(self, comment: Comment) -> Comment:
        self.db.add(comment)
        self.db.flush()
        return comment

    def delete(self, comment: Comment) -> None:
        self.db.delete(comment)
