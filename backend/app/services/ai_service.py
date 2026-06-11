"""AI writing enhancement via OpenRouter.

Improves grammar/spelling/punctuation/formatting only. Preserves meaning, tone,
and the author's voice — never adds, removes, or summarizes content.
"""
import httpx

from app.config import settings

SYSTEM_PROMPT = (
    "You are a careful copy editor for a personal journal. Improve ONLY the "
    "grammar, spelling, punctuation, and light formatting of the entry. "
    "Preserve the author's exact meaning, tone, and voice. Do NOT add new ideas, "
    "do NOT remove content, do NOT summarize, do NOT change style or rephrase for "
    "flair. Return ONLY the corrected text, with no preamble, quotes, or commentary."
)


class AIEnhancementError(Exception):
    pass


class AIService:
    def __init__(self) -> None:
        self.enabled = settings.ai_enabled
        self.model = settings.OPENROUTER_MODEL
        self.base_url = settings.OPENROUTER_BASE_URL.rstrip("/")
        self.api_key = settings.OPENROUTER_API_KEY

    def enhance(self, text: str) -> str:
        if not text or not text.strip():
            return text
        if not self.enabled:
            raise AIEnhancementError("AI enhancement is not configured")

        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": text},
            ],
            "temperature": 0.2,
        }
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            # OpenRouter recommends these for attribution; harmless if unused.
            "HTTP-Referer": settings.FRONTEND_URL,
            "X-Title": settings.PROJECT_NAME,
        }
        try:
            with httpx.Client(timeout=60.0) as client:
                resp = client.post(
                    f"{self.base_url}/chat/completions", json=payload, headers=headers
                )
                resp.raise_for_status()
                data = resp.json()
            content = data["choices"][0]["message"]["content"]
        except (httpx.HTTPError, KeyError, IndexError, ValueError) as exc:
            raise AIEnhancementError(str(exc)) from exc

        cleaned = content.strip()
        return cleaned or text
