"""Reaction endpoints (on an entry)."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.middleware.auth_middleware import get_current_user
from app.models.user import User
from app.schemas.reaction import ReactionSummary, ReactionToggle
from app.services.reaction_service import ReactionService

router = APIRouter(
    prefix="/spaces/{space_id}/entries/{entry_id}/reactions", tags=["reactions"]
)


@router.get("", response_model=ReactionSummary)
def get_reactions(
    space_id: str,
    entry_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return ReactionService(db).summary(current_user, space_id, entry_id)


@router.post("", response_model=ReactionSummary)
def toggle_reaction(
    space_id: str,
    entry_id: str,
    data: ReactionToggle,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return ReactionService(db).toggle(current_user, space_id, entry_id, data.type)
