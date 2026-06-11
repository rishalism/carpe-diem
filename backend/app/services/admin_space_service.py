"""Admin space-management business logic (audited)."""
import math
from typing import Optional

from sqlalchemy.orm import Session

from app.exceptions import BadRequestError, ConflictError, NotFoundError
from app.models.enums import MemberRole, SpaceType
from app.models.space import Space
from app.models.user import User
from app.repositories.admin_space_repo import AdminSpaceRepository
from app.schemas.admin import Paginated
from app.schemas.admin_metrics import (
    AdminSpaceDetail,
    AdminSpaceListItem,
    SpaceInvitationItem,
    SpaceMemberItem,
)
from app.services.audit_service import AuditService


class AdminSpaceService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = AdminSpaceRepository(db)
        self.audit = AuditService(db)

    def list(
        self,
        *,
        page: int,
        page_size: int,
        type: Optional[SpaceType] = None,
        archived: Optional[bool] = None,
        q: Optional[str] = None,
    ) -> Paginated[AdminSpaceListItem]:
        offset = (page - 1) * page_size
        spaces, total = self.repo.list_spaces(
            offset=offset, limit=page_size, type=type, archived=archived, q=q
        )
        ids = [s.id for s in spaces]
        members = self.repo.member_counts(ids)
        entries = self.repo.entry_counts(ids)
        invites = self.repo.pending_invite_counts(ids)
        activity = self.repo.last_activity(ids)
        owners = self.repo.owner_usernames([s.owner_id for s in spaces])

        items = [self._list_item(s, members, entries, invites, activity, owners) for s in spaces]
        return Paginated(
            items=items, total=total, page=page, page_size=page_size,
            pages=max(1, math.ceil(total / page_size)),
        )

    def get_detail(self, space_id: str) -> AdminSpaceDetail:
        space = self._get(space_id)
        ids = [space.id]
        base = self._list_item(
            space,
            self.repo.member_counts(ids),
            self.repo.entry_counts(ids),
            self.repo.pending_invite_counts(ids),
            self.repo.last_activity(ids),
            self.repo.owner_usernames([space.owner_id]),
        )
        members = [
            SpaceMemberItem(
                user_id=uid,
                username=name,
                role=role.value if hasattr(role, "value") else str(role),
                joined_at=joined,
            )
            for uid, name, role, joined in self.repo.members(space_id)
        ]
        invitations = [
            SpaceInvitationItem(
                email=inv.email,
                status=inv.status.value if hasattr(inv.status, "value") else str(inv.status),
                created_at=inv.created_at,
            )
            for inv in self.repo.invitations(space_id)
        ]
        return AdminSpaceDetail(
            **base.model_dump(),
            description=space.description,
            members=members,
            invitations=invitations,
        )

    # --- actions ---------------------------------------------------------
    def archive(self, actor: User, space_id: str, ip: str, ua: str) -> AdminSpaceDetail:
        space = self._get(space_id)
        space.archived = True
        self._audit(actor, "space.archive", space_id, ip, ua)
        return self.get_detail(space_id)

    def restore(self, actor: User, space_id: str, ip: str, ua: str) -> AdminSpaceDetail:
        space = self._get(space_id)
        space.archived = False
        self._audit(actor, "space.restore", space_id, ip, ua)
        return self.get_detail(space_id)

    def delete(
        self, actor: User, space_id: str, confirm_name: str, reason: str, ip: str, ua: str
    ) -> None:
        space = self._get(space_id)
        if confirm_name != space.name:
            raise BadRequestError("Confirmation name does not match")
        self.db.delete(space)  # cascades to members, entries, invitations
        self._audit(actor, "space.delete", space_id, ip, ua, reason=reason)

    def remove_member(
        self, actor: User, space_id: str, user_id: str, reason: str, ip: str, ua: str
    ) -> AdminSpaceDetail:
        space = self._get(space_id)
        if user_id == space.owner_id:
            raise ConflictError("Cannot remove the space owner; archive or delete the space instead")
        member = self.repo.get_member(space_id, user_id)
        if member is None:
            raise NotFoundError("Member not found in this space")
        self.db.delete(member)
        self._audit(
            actor, "space.remove_member", space_id, ip, ua,
            reason=reason, meta={"member": user_id},
        )
        return self.get_detail(space_id)

    # --- helpers ---------------------------------------------------------
    def _get(self, space_id: str) -> Space:
        space = self.repo.get(space_id)
        if space is None:
            raise NotFoundError("Space not found")
        return space

    @staticmethod
    def _list_item(space, members, entries, invites, activity, owners) -> AdminSpaceListItem:
        return AdminSpaceListItem(
            id=space.id,
            name=space.name,
            type=space.type,
            owner_id=space.owner_id,
            owner_username=owners.get(space.owner_id),
            member_count=members.get(space.id, 0),
            entry_count=entries.get(space.id, 0),
            pending_invitations=invites.get(space.id, 0),
            archived=space.archived,
            created_at=space.created_at,
            last_activity_at=activity.get(space.id),
        )

    def _audit(self, actor, action, space_id, ip, ua, *, reason=None, meta=None) -> None:
        self.audit.record(
            admin=actor, action=action, resource_type="space", resource_id=space_id,
            reason=reason, meta=meta, ip_address=ip, user_agent=ua, commit=False,
        )
        self.db.commit()
