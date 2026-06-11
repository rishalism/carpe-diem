"""Dashboard aggregation: stats, streak, mood overview, on-this-day."""
from datetime import date, timedelta
from typing import List

from sqlalchemy.orm import Session

from app.models.entry import JournalEntry
from app.models.user import User
from app.repositories.entry_repo import EntryRepository
from app.repositories.space_repo import SpaceRepository
from app.schemas.dashboard import DashboardSummary
from app.schemas.search import EntrySearchResult


def _to_result(entry: JournalEntry) -> EntrySearchResult:
    item = EntrySearchResult.model_validate(entry)
    item.space_name = entry.space.name if entry.space else ""
    return item


def _streak(dates: set[date]) -> int:
    if not dates:
        return 0
    today = date.today()
    # Streak counts back from today, or yesterday if nothing yet today.
    start = today if today in dates else today - timedelta(days=1)
    if start not in dates:
        return 0
    count = 0
    cursor = start
    while cursor in dates:
        count += 1
        cursor -= timedelta(days=1)
    return count


class DashboardService:
    def __init__(self, db: Session):
        self.db = db
        self.entries = EntryRepository(db)
        self.spaces = SpaceRepository(db)

    def summary(self, user: User) -> DashboardSummary:
        spaces = self.spaces.list_for_user(user.id)
        authored = self.entries.search_for_user(user.id, author_id=user.id, limit=10000)
        recent = self.entries.search_for_user(user.id, limit=6)

        today = date.today()
        authored_dates = {e.created_at.date() for e in authored}
        mood_counts: dict[str, int] = {}
        entries_this_month = 0
        on_this_day: List[EntrySearchResult] = []

        for e in authored:
            d = e.created_at.date()
            if e.mood:
                mood_counts[e.mood.value] = mood_counts.get(e.mood.value, 0) + 1
            if d.year == today.year and d.month == today.month:
                entries_this_month += 1
            if d.month == today.month and d.day == today.day and d.year < today.year:
                on_this_day.append(_to_result(e))

        return DashboardSummary(
            total_spaces=len(spaces),
            total_entries=len(authored),
            streak_days=_streak(authored_dates),
            entries_this_month=entries_this_month,
            mood_counts=mood_counts,
            recent_entries=[_to_result(e) for e in recent],
            on_this_day=on_this_day[:5],
        )
