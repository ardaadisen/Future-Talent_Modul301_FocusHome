"""One-off Gemini env diagnostic — never prints API keys."""
from __future__ import annotations

import os
import sys
from pathlib import Path

import httpx

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from app.config import backend_env_file  # noqa: E402
from app.services.ai_service import parse_task_text, log_ai_startup_config  # noqa: E402

import logging

logging.basicConfig(level=logging.INFO)


def main() -> None:
    key = (os.getenv("GEMINI_API_KEY") or "").strip()
    model = (os.getenv("GEMINI_MODEL") or "gemini-2.5-flash-lite").strip()

    print(f"env_file={backend_env_file()}")
    log_ai_startup_config()

    if not key:
        print("gemini_probe=skipped (no key)")
        return

    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
    payload = {
        "contents": [{"parts": [{"text": 'Reply with JSON only: {"title":"test"}'}]}],
        "generationConfig": {"temperature": 0.2},
    }
    try:
        r = httpx.post(
            url,
            headers={"x-goog-api-key": key, "Content-Type": "application/json"},
            json=payload,
            timeout=15.0,
        )
        print(f"gemini_probe_status={r.status_code}")
        if r.status_code >= 400:
            try:
                msg = r.json().get("error", {}).get("message", r.text[:200])
            except Exception:
                msg = r.text[:200]
            print(f"gemini_probe_message={msg[:240]}")
    except Exception as exc:
        print(f"gemini_probe_error={type(exc).__name__}: {exc}")

    text = "Yarın sabah 10.00 da yarım saat kahve iç."
    result = parse_task_text(text, "Europe/Istanbul")
    print(f"parse_task_source={result.source.value}")
    print(f"parse_task_durationSeconds={result.durationSeconds}")


if __name__ == "__main__":
    main()
