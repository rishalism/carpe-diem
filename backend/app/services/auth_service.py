"""Authentication business logic: register, login, refresh, reset, Google."""
from typing import Optional

import httpx
from sqlalchemy.orm import Session

from app.config import settings
from app.database.base import utcnow
from app.exceptions import AuthError, BadRequestError, ConflictError
from app.models.enums import AccountStatus
from app.models.user import User
from app.repositories.user_repo import UserRepository
from app.schemas.auth import AuthResponse, RegisterRequest, TokenResponse
from app.utils.security import (
    REFRESH_TOKEN_TYPE,
    RESET_TOKEN_TYPE,
    create_access_token,
    create_refresh_token,
    create_reset_token,
    decode_token,
    hash_password,
    verify_password,
)

GOOGLE_TOKENINFO_URL = "https://oauth2.googleapis.com/tokeninfo"


class AuthService:
    def __init__(self, db: Session):
        self.db = db
        self.users = UserRepository(db)

    def _issue_tokens(self, user: User) -> TokenResponse:
        return TokenResponse(
            access_token=create_access_token(user.id),
            refresh_token=create_refresh_token(user.id),
        )

    def register(self, data: RegisterRequest) -> AuthResponse:
        email = data.email.lower()
        if self.users.get_by_email(email):
            raise ConflictError("An account with this email already exists")
        user = User(
            email=email,
            username=data.username,
            password_hash=hash_password(data.password),
        )
        self.users.add(user)
        self.db.commit()
        self.db.refresh(user)
        tokens = self._issue_tokens(user)
        return AuthResponse(user=user, **tokens.model_dump())

    @staticmethod
    def _ensure_active(user: User) -> None:
        """Block login for non-active accounts (suspended/banned/deleted)."""
        status = user.account_status
        if status == AccountStatus.active:
            return
        if status == AccountStatus.suspended:
            raise AuthError("This account is suspended. Contact support.")
        if status == AccountStatus.banned:
            raise AuthError("This account has been banned.")
        if status == AccountStatus.deleted:
            raise AuthError("This account no longer exists.")
        # `inactive` is a derived/reporting state, not a login block.

    def authenticate(self, email: str, password: str) -> User:
        user = self.users.get_by_email(email.lower())
        if not user or not verify_password(password, user.password_hash or ""):
            raise AuthError("Invalid email or password")
        self._ensure_active(user)
        return user

    def login(self, email: str, password: str) -> AuthResponse:
        user = self.authenticate(email, password)
        user.last_active_at = utcnow()
        self.db.commit()
        tokens = self._issue_tokens(user)
        return AuthResponse(user=user, **tokens.model_dump())

    def refresh(self, refresh_token: str) -> TokenResponse:
        payload = decode_token(refresh_token, expected_type=REFRESH_TOKEN_TYPE)
        if not payload:
            raise AuthError("Invalid or expired refresh token")
        user = self.users.get_by_id(payload["sub"])
        if not user:
            raise AuthError("User no longer exists")
        return self._issue_tokens(user)

    # --- password reset ---
    def forgot_password(self, email: str) -> Optional[str]:
        """Return a reset token if the account exists (caller decides delivery)."""
        user = self.users.get_by_email(email.lower())
        if not user:
            return None
        return create_reset_token(user.id)

    def reset_password(self, token: str, new_password: str) -> None:
        payload = decode_token(token, expected_type=RESET_TOKEN_TYPE)
        if not payload:
            raise BadRequestError("Invalid or expired reset link")
        user = self.users.get_by_id(payload["sub"])
        if not user:
            raise BadRequestError("Invalid reset link")
        user.password_hash = hash_password(new_password)
        self.db.commit()

    def change_password(self, user: User, current: str, new: str) -> None:
        # Accounts created via Google have no password yet; allow setting one.
        if user.password_hash and not verify_password(current, user.password_hash):
            raise AuthError("Current password is incorrect")
        user.password_hash = hash_password(new)
        self.db.commit()

    # --- Google OAuth ---
    def google_login(self, id_token: str) -> AuthResponse:
        if not settings.google_enabled:
            raise BadRequestError("Google sign-in is not configured")
        try:
            with httpx.Client(timeout=10.0) as client:
                resp = client.get(GOOGLE_TOKENINFO_URL, params={"id_token": id_token})
                resp.raise_for_status()
                info = resp.json()
        except (httpx.HTTPError, ValueError) as exc:
            raise AuthError("Could not verify Google token") from exc

        if info.get("aud") != settings.GOOGLE_CLIENT_ID:
            raise AuthError("Google token was issued for a different app")
        email = (info.get("email") or "").lower()
        google_id = info.get("sub")
        if not email or not google_id:
            raise AuthError("Google token missing required fields")

        user = self.users.get_by_google_id(google_id) or self.users.get_by_email(email)
        if user is None:
            username = info.get("name") or email.split("@")[0]
            user = User(
                email=email,
                username=username[:50],
                google_id=google_id,
                avatar_url=info.get("picture"),
            )
            self.users.add(user)
        elif not user.google_id:
            user.google_id = google_id  # link Google to an existing email account
        self._ensure_active(user)
        user.last_active_at = utcnow()
        self.db.commit()
        self.db.refresh(user)
        tokens = self._issue_tokens(user)
        return AuthResponse(user=user, **tokens.model_dump())
