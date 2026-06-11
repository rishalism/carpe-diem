"""Import all models so Base.metadata is fully populated (Alembic, create_all)."""
from app.database.base import Base  # noqa: F401
from app.models.attachment import Attachment  # noqa: F401
from app.models.audit_log import AuditLog  # noqa: F401
from app.models.comment import Comment  # noqa: F401
from app.models.entry import JournalEntry  # noqa: F401
from app.models.invitation import Invitation  # noqa: F401
from app.models.membership import SpaceMember  # noqa: F401
from app.models.notification import Notification  # noqa: F401
from app.models.reaction import Reaction  # noqa: F401
from app.models.report import Report  # noqa: F401
from app.models.space import Space  # noqa: F401
from app.models.tag import Tag, entry_tags  # noqa: F401
from app.models.user import User  # noqa: F401

__all__ = [
    "Base",
    "User",
    "Space",
    "SpaceMember",
    "Invitation",
    "JournalEntry",
    "Tag",
    "entry_tags",
    "Attachment",
    "Comment",
    "Reaction",
    "Notification",
    "AuditLog",
    "Report",
]
