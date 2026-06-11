"""Search schemas."""
from app.schemas.entry import EntryResponse


class EntrySearchResult(EntryResponse):
    space_name: str = ""
