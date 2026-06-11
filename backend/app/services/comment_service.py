"""Comment business logic + authorization."""
from typing import Dict, List

from sqlalchemy.orm import Session

from app.exceptions import BadRequestError, NotFoundError, PermissionDeniedError
from app.models.comment import Comment
from app.models.entry import JournalEntry
from app.models.enums import NotificationType
from app.models.user import User
from app.repositories.comment_repo import CommentRepository
from app.repositories.entry_repo import EntryRepository
from app.repositories.space_repo import SpaceRepository
from app.schemas.comment import CommentCreate, CommentResponse, CommentUpdate
from app.services.notification_service import NotificationService


class CommentService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = CommentRepository(db)
        self.entries = EntryRepository(db)
        self.spaces = SpaceRepository(db)
        self.notifications = NotificationService(db)

    def _require_member(self, space_id: str, user_id: str) -> None:
        if self.spaces.get_member(space_id, user_id) is None:
            raise NotFoundError("Space not found")

    def _load_entry(self, space_id: str, entry_id: str) -> JournalEntry:
        entry = self.entries.get_by_id(entry_id)
        if entry is None or entry.space_id != space_id:
            raise NotFoundError("Entry not found")
        return entry

    def list_comments(
        self, user: User, space_id: str, entry_id: str
    ) -> List[CommentResponse]:
        self._require_member(space_id, user.id)
        self._load_entry(space_id, entry_id)
        flat = self.repo.list_for_entry(entry_id)

        nodes: Dict[str, CommentResponse] = {}
        for c in flat:
            node = CommentResponse.model_validate(c)
            node.replies = []
            nodes[c.id] = node

        roots: List[CommentResponse] = []
        for c in flat:
            node = nodes[c.id]
            if c.parent_id and c.parent_id in nodes:
                nodes[c.parent_id].replies.append(node)
            else:
                roots.append(node)
        return roots

    def create_comment(
        self, user: User, space_id: str, entry_id: str, data: CommentCreate
    ) -> CommentResponse:
        self._require_member(space_id, user.id)
        entry = self._load_entry(space_id, entry_id)

        if data.parent_id:
            parent = self.repo.get_by_id(data.parent_id)
            if parent is None or parent.entry_id != entry_id:
                raise BadRequestError("Parent comment does not belong to this entry")

        comment = Comment(
            entry_id=entry_id,
            author_id=user.id,
            parent_id=data.parent_id,
            content=data.content,
        )
        self.repo.add(comment)

        self._emit_new_comment(user, entry, data.parent_id)
        self.db.commit()

        created = self.repo.get_by_id(comment.id)
        return CommentResponse.model_validate(created)

    def _emit_new_comment(self, actor: User, entry: JournalEntry, parent_id) -> None:
        space = self.spaces.get_by_id(entry.space_id)
        payload = {
            "space_id": entry.space_id,
            "space_name": space.name if space else "",
            "entry_id": entry.id,
            "entry_title": entry.title,
            "actor_name": actor.username,
            "message": f'{actor.username} commented on "{entry.title}"',
            "link": f"/spaces/{entry.space_id}/entries/{entry.id}",
        }
        recipients = {entry.author_id}
        if parent_id:
            parent = self.repo.get_by_id(parent_id)
            if parent:
                recipients.add(parent.author_id)
        for uid in recipients:
            self.notifications.emit(
                uid, NotificationType.new_comment, payload, actor_id=actor.id
            )

    def update_comment(
        self, user: User, space_id: str, entry_id: str, comment_id: str, data: CommentUpdate
    ) -> CommentResponse:
        self._require_member(space_id, user.id)
        self._load_entry(space_id, entry_id)
        comment = self.repo.get_by_id(comment_id)
        if comment is None or comment.entry_id != entry_id:
            raise NotFoundError("Comment not found")
        if comment.author_id != user.id:
            raise PermissionDeniedError("You can only edit your own comments")
        comment.content = data.content
        self.db.commit()
        return CommentResponse.model_validate(self.repo.get_by_id(comment_id))

    def delete_comment(
        self, user: User, space_id: str, entry_id: str, comment_id: str
    ) -> None:
        self._require_member(space_id, user.id)
        self._load_entry(space_id, entry_id)
        comment = self.repo.get_by_id(comment_id)
        if comment is None or comment.entry_id != entry_id:
            raise NotFoundError("Comment not found")
        if comment.author_id != user.id:
            raise PermissionDeniedError("You can only delete your own comments")
        self.repo.delete(comment)
        self.db.commit()
