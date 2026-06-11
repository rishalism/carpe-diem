"""FastAPI application entrypoint."""
from contextlib import asynccontextmanager

import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.config import settings
from app.database.base import Base
from app.database.session import engine
from app.middleware.error_handler import register_exception_handlers
from app.middleware.rate_limit import limiter
from app.routers import (
    attachments,
    auth,
    comments,
    config,
    dashboard,
    entries,
    invitations,
    notifications,
    reactions,
    reports,
    search,
    spaces,
    users,
)
from app.routers import admin as admin_router
from app.services.storage_service import UPLOADS_DIR

# Ensure all models are registered on Base.metadata.
import app.models  # noqa: F401,E402


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Dev convenience: auto-create tables on SQLite so the app runs without a
    # migration step. On Postgres, use Alembic (`alembic upgrade head`).
    if settings.is_sqlite:
        Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    version="0.1.0",
    description="Private journaling platform — Spaces, entries, memories.",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Rate limiting
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Error handlers
register_exception_handlers(app)

# Routers
api = settings.API_PREFIX
app.include_router(auth.router, prefix=api)
app.include_router(users.router, prefix=api)
app.include_router(spaces.router, prefix=api)
app.include_router(entries.router, prefix=api)
app.include_router(comments.router, prefix=api)
app.include_router(reactions.router, prefix=api)
app.include_router(invitations.space_router, prefix=api)
app.include_router(invitations.router, prefix=api)
app.include_router(notifications.router, prefix=api)
app.include_router(attachments.router, prefix=api)
app.include_router(attachments.gallery_router, prefix=api)
app.include_router(search.router, prefix=api)
app.include_router(config.router, prefix=api)
app.include_router(dashboard.router, prefix=api)
app.include_router(reports.router, prefix=api)
app.include_router(admin_router.router, prefix=api)

# Serve locally-stored uploads (no-op effect when Supabase Storage is used).
os.makedirs(UPLOADS_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOADS_DIR), name="uploads")


@app.get("/health", tags=["health"])
def health():
    return {"status": "ok", "environment": settings.ENVIRONMENT}


@app.get("/", tags=["health"])
def root():
    return {"name": settings.PROJECT_NAME, "docs": "/docs"}
