"""Reaction schemas."""
from typing import Dict, List

from pydantic import BaseModel

from app.models.enums import ReactionType


class ReactionToggle(BaseModel):
    type: ReactionType


class ReactionSummary(BaseModel):
    counts: Dict[str, int]
    mine: List[str]
    total: int
