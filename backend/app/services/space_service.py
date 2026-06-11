"""Space business logic + authorization."""
from typing import List

from sqlalchemy.orm import Session

from app.exceptions import NotFoundError, PermissionDeniedError
from app.models.enums import MemberRole
from app.models.membership import SpaceMember
from app.models.space import Space
from app.models.user import User
from app.repositories.space_repo import SpaceRepository
from app.schemas.space import (
    SpaceCreate,
    SpaceMemberResponse,
    SpaceResponse,
    SpaceUpdate,
)


class SpaceService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = SpaceRepository(db)

    # --- authorization helpers ---
    def require_member(self, space_id: str, user_id: str) -> SpaceMember:
        member = self.repo.get_member(space_id, user_id)
        if member is None:
            # Do not leak existence of spaces the user cannot access.
            raise NotFoundError("Space not found")
        return member

    def require_owner(self, space_id: str, user_id: str) -> SpaceMember:
        member = self.require_member(space_id, user_id)
        if member.role != MemberRole.owner:
            raise PermissionDeniedError("Only the space owner can do that")
        return member

    # --- serialization ---
    def _to_response(self, space: Space, role: MemberRole) -> SpaceResponse:
        resp = SpaceResponse.model_validate(space)
        resp.member_count = self.repo.count_members(space.id)
        resp.entry_count = self.repo.count_entries(space.id)
        resp.current_user_role = role
        return resp

    # --- operations ---
    def create_space(self, user: User, data: SpaceCreate) -> SpaceResponse:
        space = Space(
            name=data.name,
            type=data.type,
            description=data.description,
            cover_image_url=data.cover_image_url,
            owner_id=user.id,
        )
        self.repo.add(space)
        self.repo.add_member(space.id, user.id, role=MemberRole.owner)
        self.db.commit()
        self.db.refresh(space)
        return self._to_response(space, MemberRole.owner)

    def list_spaces(self, user: User, include_archived: bool = False) -> List[SpaceResponse]:
        spaces = self.repo.list_for_user(user.id, include_archived=include_archived)
        result: List[SpaceResponse] = []
        for space in spaces:
            member = self.repo.get_member(space.id, user.id)
            role = member.role if member else MemberRole.member
            result.append(self._to_response(space, role))
        return result

    def get_space(self, user: User, space_id: str) -> SpaceResponse:
        member = self.require_member(space_id, user.id)
        space = self.repo.get_by_id(space_id)
        if space is None:
            raise NotFoundError("Space not found")
        return self._to_response(space, member.role)

    def update_space(self, user: User, space_id: str, data: SpaceUpdate) -> SpaceResponse:
        member = self.require_owner(space_id, user.id)
        space = self.repo.get_by_id(space_id)
        if space is None:
            raise NotFoundError("Space not found")
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(space, field, value)
        self.db.commit()
        self.db.refresh(space)
        return self._to_response(space, member.role)

    def delete_space(self, user: User, space_id: str) -> None:
        self.require_owner(space_id, user.id)
        space = self.repo.get_by_id(space_id)
        if space is None:
            raise NotFoundError("Space not found")
        self.repo.delete(space)
        self.db.commit()

    def list_members(self, user: User, space_id: str) -> List[SpaceMemberResponse]:
        self.require_member(space_id, user.id)
        members = self.repo.list_members(space_id)
        return [SpaceMemberResponse.model_validate(m) for m in members]
