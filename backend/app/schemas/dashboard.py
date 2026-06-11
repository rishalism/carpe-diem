"""Dashboard summary schema."""
from typing import Dict, List

from pydantic import BaseModel

from app.schemas.search import EntrySearchResult


class DashboardSummary(BaseModel):
    total_spaces: int
    total_entries: int
    streak_days: int
    entries_this_month: int
    mood_counts: Dict[str, int]
    recent_entries: List[EntrySearchResult]
    on_this_day: List[EntrySearchResult]
