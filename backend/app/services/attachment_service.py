"""Attachment business logic + authorization."""
from typing import List

from sqlalchemy.orm import Session

from app.exceptions import BadRequestError, NotFoundError, PermissionDeniedError
from app.models.attachment import Attachment
from app.models.enums import MemberRole
from app.models.user import User
from app.repositories.attachment_repo import AttachmentRepository
from app.repositories.entry_repo import EntryRepository
from app.repositories.space_repo import SpaceRepository
from app.schemas.attachment import AttachmentResponse
from app.services.storage_service import StorageService
from app.utils.validation import (
    MAX_FILE_SIZE_BYTES,
    is_allowed_file_type,
    is_within_size_limit,
)


class AttachmentService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = AttachmentRepository(db)
        self.entries = EntryRepository(db)
        self.spaces = SpaceRepository(db)
        self.storage = StorageService()

    def _require_member(self, space_id: str, user_id: str) -> None:
        if self.spaces.get_member(space_id, user_id) is None:
            raise NotFoundError("Space not found")

    def _require_entry(self, space_id: str, entry_id: str) -> None:
        entry = self.entries.get_by_id(entry_id)
        if entry is None or entry.space_id != space_id:
            raise NotFoundError("Entry not found")

    def upload(
        self,
        user: User,
        space_id: str,
        entry_id: str,
        data: bytes,
        filename: str,
        content_type: str,
    ) -> AttachmentResponse:
        self._require_member(space_id, user.id)
        self._require_entry(space_id, entry_id)

        if not is_allowed_file_type(content_type):
            raise BadRequestError("Unsupported file type")
        if not is_within_size_limit(len(data)):
            mb = MAX_FILE_SIZE_BYTES // (1024 * 1024)
            raise BadRequestError(f"File exceeds the {mb} MB limit")

        file_url = self.storage.save(data, filename, content_type)
        attachment = Attachment(
            entry_id=entry_id,
            uploader_id=user.id,
            file_url=file_url,
            file_name=filename,
            file_type=content_type,
            file_size=len(data),
        )
        self.repo.add(attachment)
        self.db.commit()
        return AttachmentResponse.model_validate(self.repo.get_by_id(attachment.id))

    def list_for_entry(
        self, user: User, space_id: str, entry_id: str
    ) -> List[AttachmentResponse]:
        self._require_member(space_id, user.id)
        self._require_entry(space_id, entry_id)
        return [
            AttachmentResponse.model_validate(a)
            for a in self.repo.list_for_entry(entry_id)
        ]

    def list_for_space(self, user: User, space_id: str) -> List[AttachmentResponse]:
        self._require_member(space_id, user.id)
        return [
            AttachmentResponse.model_validate(a)
            for a in self.repo.list_for_space(space_id)
        ]

    def delete(self, user: User, space_id: str, attachment_id: str) -> None:
        member = self.spaces.get_member(space_id, user.id)
        if member is None:
            raise NotFoundError("Space not found")
        attachment = self.repo.get_by_id(attachment_id)
        if attachment is None:
            raise NotFoundError("Attachment not found")
        entry = self.entries.get_by_id(attachment.entry_id)
        if entry is None or entry.space_id != space_id:
            raise NotFoundError("Attachment not found")
        # Uploader or space owner may delete.
        if attachment.uploader_id != user.id and member.role != MemberRole.owner:
            raise PermissionDeniedError("You cannot delete this attachment")

        url = attachment.file_url
        self.repo.delete(attachment)
        self.db.commit()
        self.storage.delete(url)
