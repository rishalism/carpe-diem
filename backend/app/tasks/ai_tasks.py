"""Background jobs for AI enhancement.

Run via FastAPI BackgroundTasks. Each job opens its own DB session so it is
independent of the request lifecycle. Journals always save first; this only
populates `content_enhanced` afterward and never blocks entry creation.
"""
import logging

from app.database.session import SessionLocal
from app.models.entry import JournalEntry
from app.models.enums import AIStatus
from app.services.ai_service import AIService

logger = logging.getLogger("carpe_diem")


def enhance_entry_task(entry_id: str) -> None:
    db = SessionLocal()
    try:
        entry = db.get(JournalEntry, entry_id)
        if entry is None:
            return
        try:
            entry.content_enhanced = AIService().enhance(entry.content)
            entry.ai_status = AIStatus.done
        except Exception:  # noqa: BLE001 — never let a bg failure crash the worker
            logger.exception("AI enhancement failed for entry %s", entry_id)
            entry.ai_status = AIStatus.failed
        db.commit()
    finally:
        db.close()
