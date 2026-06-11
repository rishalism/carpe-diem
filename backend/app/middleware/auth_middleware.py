"""Authentication dependencies."""
from typing import Optional

from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.exceptions import AuthError
from app.models.user import User
from app.repositories.user_repo import UserRepository
from app.utils.security import ACCESS_TOKEN_TYPE, decode_token

# auto_error=False so we can raise our own domain exception (consistent JSON).
_bearer = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(_bearer),
    db: Session = Depends(get_db),
) -> User:
    if credentials is None or not credentials.credentials:
        raise AuthError("Not authenticated")
    payload = decode_token(credentials.credentials, expected_type=ACCESS_TOKEN_TYPE)
    if not payload:
        raise AuthError("Invalid or expired access token")
    user = UserRepository(db).get_by_id(payload["sub"])
    if user is None:
        raise AuthError("User not found")
    return user
