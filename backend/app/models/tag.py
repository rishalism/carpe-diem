"""Tag model + entry<->tag association table."""
from sqlalchemy import Column, ForeignKey, String, Table, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import GUID, Base, gen_uuid

entry_tags = Table(
    "entry_tags",
    Base.metadata,
    Column(
        "entry_id",
        GUID,
        ForeignKey("journal_entries.id", ondelete="CASCADE"),
        primary_key=True,
    ),
    Column(
        "tag_id",
        GUID,
        ForeignKey("tags.id", ondelete="CASCADE"),
        primary_key=True,
    ),
)


class Tag(Base):
    __tablename__ = "tags"
    __table_args__ = (UniqueConstraint("name", name="uq_tag_name"),)

    id: Mapped[str] = mapped_column(GUID, primary_key=True, default=gen_uuid)
    name: Mapped[str] = mapped_column(String(50), nullable=False, index=True)

    entries = relationship(
        "JournalEntry", secondary=entry_tags, back_populates="tags"
    )
