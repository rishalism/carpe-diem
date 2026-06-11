"""Data access for notifications."""
from typing import List, Optional

from sqlalchemy import func, select, update
from sqlalchemy.orm import Session, selectinload

from app.models.notification import Notification


class NotificationRepository:
    def __init__(self, db: Session):
        self.db = db

    def list_for_user(self, user_id: str, limit: int = 50) -> List[Notification]:
        stmt = (
            select(Notification)
            .where(Notification.user_id == user_id)
            .options(selectinload(Notification.actor))
            .order_by(Notification.created_at.desc())
            .limit(limit)
        )
        return list(self.db.scalars(stmt).all())

    def unread_count(self, user_id: str) -> int:
        stmt = (
            select(func.count())
            .select_from(Notification)
            .where(Notification.user_id == user_id, Notification.read.is_(False))
        )
        return self.db.scalar(stmt) or 0

    def get_by_id(self, notification_id: str) -> Optional[Notification]:
        return self.db.get(Notification, notification_id)

    def add(self, notification: Notification) -> Notification:
        self.db.add(notification)
        self.db.flush()
        return notification

    def mark_all_read(self, user_id: str) -> None:
        self.db.execute(
            update(Notification)
            .where(Notification.user_id == user_id, Notification.read.is_(False))
            .values(read=True)
        )
