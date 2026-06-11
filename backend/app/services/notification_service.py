"""Notification creation + retrieval.

Emit methods add rows to the current session WITHOUT committing — the calling
service commits as part of its own transaction.
"""
from typing import Optional

from sqlalchemy.orm import Session

from app.exceptions import NotFoundError, PermissionDeniedError
from app.models.enums import NotificationType
from app.models.notification import Notification
from app.models.user import User
from app.repositories.notification_repo import NotificationRepository
from app.repositories.space_repo import SpaceRepository
from app.schemas.notification import NotificationList, NotificationResponse


class NotificationService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = NotificationRepository(db)
        self.spaces = SpaceRepository(db)

    # Maps a notification type to the preference key that can silence it.
    _PREF_KEY = {
        NotificationType.new_entry: "new_entry",
        NotificationType.new_comment: "new_comment",
        NotificationType.space_invitation: "social",
        NotificationType.invitation_accepted: "social",
        NotificationType.member_joined: "social",
    }

    def emit(
        self,
        user_id: str,
        ntype: NotificationType,
        payload: dict,
        actor_id: Optional[str] = None,
    ) -> None:
        # Never notify a user about their own action.
        if actor_id and actor_id == user_id:
            return
        recipient = self.db.get(User, user_id)
        if recipient is None:
            return
        # Respect the recipient's notification preferences (default on).
        key = self._PREF_KEY.get(ntype)
        if key and recipient.notification_prefs.get(key) is False:
            return
        self.repo.add(
            Notification(
                user_id=user_id, actor_id=actor_id, type=ntype, payload=payload
            )
        )

    def emit_to_members(
        self,
        space_id: str,
        ntype: NotificationType,
        payload: dict,
        actor_id: Optional[str] = None,
    ) -> None:
        for member in self.spaces.list_members(space_id):
            self.emit(member.user_id, ntype, payload, actor_id=actor_id)

    def list(self, user: User) -> NotificationList:
        items = self.repo.list_for_user(user.id)
        return NotificationList(
            items=[NotificationResponse.model_validate(n) for n in items],
            unread_count=self.repo.unread_count(user.id),
        )

    def mark_read(self, user: User, notification_id: str) -> None:
        n = self.repo.get_by_id(notification_id)
        if n is None:
            raise NotFoundError("Notification not found")
        if n.user_id != user.id:
            raise PermissionDeniedError()
        n.read = True
        self.db.commit()

    def mark_all_read(self, user: User) -> None:
        self.repo.mark_all_read(user.id)
        self.db.commit()
