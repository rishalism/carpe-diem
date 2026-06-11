"""Authentication endpoints (rate-limited)."""
from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from app.config import settings
from app.database.session import get_db
from app.middleware.rate_limit import AUTH_RATE_LIMIT, limiter
from app.schemas.auth import (
    AuthResponse,
    ForgotPasswordRequest,
    ForgotPasswordResponse,
    GoogleLoginRequest,
    LoginRequest,
    RefreshRequest,
    RegisterRequest,
    ResetPasswordRequest,
    TokenResponse,
)
from app.schemas.common import Message
from app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=AuthResponse, status_code=201)
@limiter.limit(AUTH_RATE_LIMIT)
def register(request: Request, data: RegisterRequest, db: Session = Depends(get_db)):
    return AuthService(db).register(data)


@router.post("/login", response_model=AuthResponse)
@limiter.limit(AUTH_RATE_LIMIT)
def login(request: Request, data: LoginRequest, db: Session = Depends(get_db)):
    return AuthService(db).login(data.email, data.password)


@router.post("/refresh", response_model=TokenResponse)
@limiter.limit(AUTH_RATE_LIMIT)
def refresh(request: Request, data: RefreshRequest, db: Session = Depends(get_db)):
    return AuthService(db).refresh(data.refresh_token)


@router.post("/google", response_model=AuthResponse)
@limiter.limit(AUTH_RATE_LIMIT)
def google_login(request: Request, data: GoogleLoginRequest, db: Session = Depends(get_db)):
    return AuthService(db).google_login(data.id_token)


@router.post("/forgot-password", response_model=ForgotPasswordResponse)
@limiter.limit(AUTH_RATE_LIMIT)
def forgot_password(
    request: Request, data: ForgotPasswordRequest, db: Session = Depends(get_db)
):
    token = AuthService(db).forgot_password(data.email)
    # Always return the same message so we don't reveal which emails exist.
    # In development we surface the token so the flow is testable without email.
    expose = token if settings.ENVIRONMENT == "development" else None
    return ForgotPasswordResponse(
        detail="If an account exists for that email, a reset link has been sent.",
        reset_token=expose,
    )


@router.post("/reset-password", response_model=Message)
@limiter.limit(AUTH_RATE_LIMIT)
def reset_password(
    request: Request, data: ResetPasswordRequest, db: Session = Depends(get_db)
):
    AuthService(db).reset_password(data.token, data.new_password)
    return Message(detail="Password updated. You can now sign in.")
