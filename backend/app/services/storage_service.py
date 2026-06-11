"""File storage abstraction: Supabase Storage in production, local disk fallback.

If SUPABASE_URL/SERVICE_KEY are set, files go to a Supabase Storage bucket and
the public object URL is stored. Otherwise files are written under ./uploads and
served by the app at /uploads/<key> (see main.py).
"""
import logging
import os
import re
import uuid

import httpx

from app.config import settings

logger = logging.getLogger("carpe_diem")

UPLOADS_DIR = "uploads"
LOCAL_PREFIX = "/uploads/"


def _safe_name(filename: str) -> str:
    base = os.path.basename(filename or "file")
    base = re.sub(r"[^A-Za-z0-9._-]", "_", base)
    return base[:120] or "file"


class StorageService:
    def __init__(self) -> None:
        self.supabase = settings.supabase_enabled
        self.bucket = settings.SUPABASE_STORAGE_BUCKET
        self.base = settings.SUPABASE_URL.rstrip("/")
        self.key = settings.SUPABASE_SERVICE_KEY

    def save(self, data: bytes, filename: str, content_type: str) -> str:
        object_key = f"{uuid.uuid4().hex}_{_safe_name(filename)}"
        if self.supabase:
            return self._save_supabase(data, object_key, content_type)
        return self._save_local(data, object_key)

    def delete(self, file_url: str) -> None:
        try:
            if self.supabase and "/storage/v1/object/public/" in file_url:
                key = file_url.split(f"/public/{self.bucket}/", 1)[-1]
                self._delete_supabase(key)
            elif file_url.startswith(LOCAL_PREFIX):
                path = os.path.join(UPLOADS_DIR, file_url[len(LOCAL_PREFIX):])
                if os.path.isfile(path):
                    os.remove(path)
        except Exception:  # noqa: BLE001 — deletion is best-effort
            logger.exception("Failed to delete stored file %s", file_url)

    # --- local ---
    def _save_local(self, data: bytes, key: str) -> str:
        os.makedirs(UPLOADS_DIR, exist_ok=True)
        with open(os.path.join(UPLOADS_DIR, key), "wb") as f:
            f.write(data)
        return f"{LOCAL_PREFIX}{key}"

    # --- supabase ---
    def _save_supabase(self, data: bytes, key: str, content_type: str) -> str:
        url = f"{self.base}/storage/v1/object/{self.bucket}/{key}"
        headers = {
            "Authorization": f"Bearer {self.key}",
            "Content-Type": content_type or "application/octet-stream",
            "x-upsert": "true",
        }
        with httpx.Client(timeout=60.0) as client:
            resp = client.post(url, content=data, headers=headers)
            resp.raise_for_status()
        return f"{self.base}/storage/v1/object/public/{self.bucket}/{key}"

    def _delete_supabase(self, key: str) -> None:
        url = f"{self.base}/storage/v1/object/{self.bucket}/{key}"
        headers = {"Authorization": f"Bearer {self.key}"}
        with httpx.Client(timeout=30.0) as client:
            client.delete(url, headers=headers)
