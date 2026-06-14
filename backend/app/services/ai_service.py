"""Natural-language task parsing: mock / OpenAI / Gemini with deterministic fallback."""

from __future__ import annotations

import json
import logging
import os
import re
from datetime import datetime, timedelta
from typing import Any, Optional

import httpx
from zoneinfo import ZoneInfo

from app.config import backend_env_file  # noqa: F401 — ensures backend/.env is loaded
from app.schemas import AIParsedTaskObject, Difficulty, ParseSource
from app.services import calendar_service
from app.services.duration_parser import apply_duration_override, parse_duration_seconds
from app.services.time_parser import apply_time_override, parse_scheduled_start

logger = logging.getLogger("focushome.ai")

ALLOWED_MINUTES = (15, 30, 45, 60)

_PARSE_SYSTEM = (
    "You extract a single focus task from user text. Reply with JSON only, no markdown. "
    "Fields: title (max 50 chars), startDateTime, endDateTime as ISO-8601 with timezone offset, "
    "durationMinutes as integer minutes (any positive value, e.g. 90 for 90 minutes), "
    "difficulty EASY|MEDIUM|HARD, description string, confidence number 0-1, calendarEligible boolean. "
    "Use the user's timezone for interpreting relative times when needed."
)


def nearest_preset_duration(minutes: int) -> int:
    return min(ALLOWED_MINUTES, key=lambda m: abs(m - minutes))


def _provider_name() -> str:
    return (os.getenv("AI_PROVIDER") or "gemini").strip().lower()


def _gemini_model_name() -> str:
    return (os.getenv("GEMINI_MODEL") or "gemini-2.5-flash-lite").strip()


def _has_gemini_key() -> bool:
    return bool((os.getenv("GEMINI_API_KEY") or "").strip())


def _has_openai_key() -> bool:
    return bool((os.getenv("OPENAI_API_KEY") or "").strip())


def _safe_api_error_body(response: httpx.Response) -> str:
    try:
        payload = response.json()
        err = payload.get("error") if isinstance(payload, dict) else None
        if isinstance(err, dict) and err.get("message"):
            return str(err["message"])[:240]
    except Exception:
        pass
    return (response.text or "")[:240]


def log_ai_startup_config() -> None:
    env_path = backend_env_file()
    provider = _provider_name()
    gemini = _has_gemini_key()
    openai = _has_openai_key()
    model = _gemini_model_name()
    logger.info("Loading env from: %s (exists=%s)", env_path, env_path.is_file())
    logger.info("AI_PROVIDER=%s", provider)
    logger.info("GEMINI_API_KEY present: %s", gemini)
    logger.info("GEMINI_MODEL=%s", model)
    logger.info("OPENAI_API_KEY present: %s", openai)
    if provider == "gemini" and not gemini:
        logger.warning("Gemini skipped at startup: missing GEMINI_API_KEY in backend/.env")
    elif provider == "openai" and not openai:
        logger.warning("OpenAI skipped at startup: missing OPENAI_API_KEY in backend/.env")
    elif provider not in ("mock", "openai", "gemini"):
        logger.warning("Unknown AI_PROVIDER=%r — will try Gemini then OpenAI then heuristic", provider)


def _infer_difficulty(text: str) -> Difficulty:
    low = text.lower()
    if re.search(r"\b(easy|kolay)\b", low):
        return Difficulty.EASY
    if re.search(r"\b(hard|zor)\b", low):
        return Difficulty.HARD
    if re.search(r"\b(medium|orta)\b", low):
        return Difficulty.MEDIUM
    return Difficulty.MEDIUM


def _infer_title(text: str) -> str:
    cleaned = " ".join(text.strip().split())
    if not cleaned:
        return "Focus Session"
    for marker in (" i will ", " i'll ", " going to ", " çalışacağım", " yapacağım"):
        idx = cleaned.lower().find(marker)
        if idx != -1:
            tail = cleaned[idx + len(marker) :].strip(" .")
            if tail:
                cleaned = tail
                break
    title = cleaned[:50].strip(" .")
    if len(title) < 3:
        title = "Focus Session"
    return title[:50]


def _heuristic_confidence(
    *,
    found_time: bool,
    found_date: bool,
    found_duration: bool,
) -> float:
    score = 0.58
    if found_duration:
        score += 0.12
    if found_time:
        score += 0.14
    if found_date:
        score += 0.06
    if found_time and found_duration:
        score += 0.08
    if found_time and found_date and found_duration:
        score += 0.04
    return min(max(score, 0.5), 0.92)


def _build_parsed(
    *,
    title: str,
    start: datetime,
    end: datetime,
    duration_seconds: int,
    duration_minutes: int,
    difficulty: Difficulty,
    description: str,
    confidence: float,
    source: ParseSource,
    calendar_eligible: bool = True,
) -> AIParsedTaskObject:
    cal_url = None
    if calendar_eligible:
        cal_url = calendar_service.build_template_url(title[:80], start, end, description)
    return AIParsedTaskObject(
        title=title[:50],
        startDateTime=start,
        endDateTime=end,
        durationSeconds=duration_seconds,
        durationMinutes=duration_minutes,
        difficulty=difficulty,
        description=description,
        confidence=confidence,
        calendarEligible=calendar_eligible,
        calendarUrl=cal_url,
        source=source,
    )


def _apply_deterministic_overrides(text: str, parsed: AIParsedTaskObject, timezone: str) -> AIParsedTaskObject:
    schedule = parse_scheduled_start(text, timezone)
    found_time = False
    found_date = False
    start = parsed.startDateTime

    if schedule is not None:
        start = schedule.start
        found_time = schedule.found_time
        found_date = schedule.found_date
    else:
        start, found_override = apply_time_override(text, start=start, timezone=timezone)
        found_time = found_override

    end, duration_seconds, duration_minutes = apply_duration_override(
        text,
        start=start,
        end=parsed.endDateTime,
        model_minutes=parsed.durationMinutes,
    )
    found_duration = parse_duration_seconds(text) is not None

    desc = parsed.description
    cal_url = parsed.calendarUrl
    if parsed.calendarEligible:
        cal_url = calendar_service.build_template_url(parsed.title[:80], start, end, desc)

    confidence = parsed.confidence
    if parsed.source in (ParseSource.HEURISTIC, ParseSource.MOCK):
        confidence = _heuristic_confidence(
            found_time=found_time,
            found_date=found_date,
            found_duration=found_duration,
        )

    return parsed.model_copy(
        update={
            "startDateTime": start,
            "endDateTime": end,
            "durationSeconds": duration_seconds,
            "durationMinutes": duration_minutes,
            "calendarUrl": cal_url,
            "confidence": confidence,
        }
    )


def _fallback_parse(text: str, timezone: str = "Europe/Istanbul", source: ParseSource = ParseSource.HEURISTIC) -> AIParsedTaskObject:
    tz = ZoneInfo(timezone)
    now = datetime.now(tz)

    schedule = parse_scheduled_start(text, timezone, now=now)
    if schedule is not None:
        start = schedule.start
        found_time = schedule.found_time
        found_date = schedule.found_date
    else:
        start = datetime.combine(now.date(), datetime.min.time().replace(hour=now.hour), tzinfo=tz)
        found_time = False
        found_date = False

    parsed_seconds = parse_duration_seconds(text)
    if parsed_seconds is not None:
        end = start + timedelta(seconds=parsed_seconds)
        duration_seconds = parsed_seconds
        duration_minutes = max(1, int(round(parsed_seconds / 60)))
        found_duration = True
    else:
        duration_minutes = 30
        duration_seconds = duration_minutes * 60
        end = start + timedelta(seconds=duration_seconds)
        found_duration = False

    diff = _infer_difficulty(text)
    title = _infer_title(text)
    desc = "Focus session derived from your plan."
    conf = _heuristic_confidence(
        found_time=found_time,
        found_date=found_date,
        found_duration=found_duration,
    )
    return _build_parsed(
        title=title,
        start=start,
        end=end,
        duration_seconds=duration_seconds,
        duration_minutes=duration_minutes,
        difficulty=diff,
        description=desc,
        confidence=conf,
        source=source,
    )


def _normalize_ai_dict(data: dict[str, Any], timezone: str, source: ParseSource) -> AIParsedTaskObject:
    title = str(data.get("title") or "Focus Session")[:200]
    diff_raw = str(data.get("difficulty", "MEDIUM")).upper()
    if diff_raw not in ("EASY", "MEDIUM", "HARD"):
        diff_raw = "MEDIUM"
    diff = Difficulty(diff_raw)
    dm = max(1, int(data.get("durationMinutes") or 30))
    start = calendar_service.parse_iso_datetime(str(data.get("startDateTime")), timezone)
    end = calendar_service.parse_iso_datetime(str(data.get("endDateTime")), timezone)
    if end <= start:
        end = start + timedelta(minutes=dm)
    duration_seconds = max(int((end - start).total_seconds()), dm * 60, 60)
    duration_minutes = max(1, int(round(duration_seconds / 60)))
    desc = str(data.get("description") or "")[:500]
    conf = float(data.get("confidence") or 0.75)
    conf = max(0.0, min(1.0, conf))
    cal_eligible = bool(data.get("calendarEligible", True))
    return _build_parsed(
        title=title,
        start=start,
        end=end,
        duration_seconds=duration_seconds,
        duration_minutes=duration_minutes,
        difficulty=diff,
        description=desc or "Focus session",
        confidence=conf,
        calendar_eligible=cal_eligible,
        source=source,
    )


def _extract_json_from_content(content: str) -> Optional[dict[str, Any]]:
    try:
        return json.loads(content)
    except json.JSONDecodeError:
        m = re.search(r"\{[\s\S]*\}", content)
        if not m:
            return None
        try:
            return json.loads(m.group(0))
        except json.JSONDecodeError:
            return None


def _ai_http_timeout() -> float:
    raw = (os.getenv("AI_HTTP_TIMEOUT_SECONDS") or "15").strip()
    try:
        return max(5.0, float(raw))
    except ValueError:
        return 15.0


def _openai_parse(text: str, timezone: str) -> tuple[Optional[AIParsedTaskObject], Optional[str]]:
    if not _has_openai_key():
        logger.warning("OpenAI parse skipped: missing OPENAI_API_KEY")
        return None, "missing_openai_api_key"

    user = json.dumps({"text": text, "timezone": timezone})
    timeout = _ai_http_timeout()
    model = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
    try:
        with httpx.Client(timeout=timeout) as client:
            r = client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {(os.getenv('OPENAI_API_KEY') or '').strip()}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": model,
                    "temperature": 0.2,
                    "messages": [
                        {"role": "system", "content": _PARSE_SYSTEM},
                        {"role": "user", "content": user},
                    ],
                },
            )
            r.raise_for_status()
            content = r.json()["choices"][0]["message"]["content"]
    except httpx.TimeoutException:
        logger.warning("OpenAI parse skipped: timeout after %.0fs (model=%s)", timeout, model)
        return None, "openai_timeout"
    except httpx.HTTPStatusError as exc:
        status = exc.response.status_code
        detail = _safe_api_error_body(exc.response)
        if status == 429:
            logger.warning("OpenAI parse skipped: quota exceeded (429, model=%s) — %s", model, detail)
            return None, "openai_quota_exceeded"
        if status in (401, 403):
            logger.warning("OpenAI parse skipped: unauthorized (HTTP %s, model=%s)", status, model)
            return None, "openai_unauthorized"
        logger.warning("OpenAI parse skipped: HTTP %s (model=%s) — %s", status, model, detail)
        return None, "openai_api_error"
    except Exception:
        logger.exception("OpenAI parse skipped: unexpected error (model=%s)", model)
        return None, "openai_api_error"

    data = _extract_json_from_content(content)
    if not data:
        logger.warning("OpenAI parse skipped: response was not valid JSON (model=%s)", model)
        return None, "openai_invalid_response"
    try:
        return _normalize_ai_dict(data, timezone, ParseSource.OPENAI), None
    except Exception:
        logger.warning("OpenAI parse skipped: could not normalize model JSON (model=%s)", model)
        return None, "openai_invalid_response"


def _gemini_parse(text: str, timezone: str) -> tuple[Optional[AIParsedTaskObject], Optional[str]]:
    if not _has_gemini_key():
        logger.warning("Gemini parse skipped: missing GEMINI_API_KEY")
        return None, "missing_gemini_api_key"

    model = _gemini_model_name()
    key = (os.getenv("GEMINI_API_KEY") or "").strip()
    user = json.dumps({"text": text, "timezone": timezone})
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
    timeout = _ai_http_timeout()
    # One attempt per parse click — no retries/backoff here.
    try:
        with httpx.Client(timeout=timeout) as client:
            r = client.post(
                url,
                headers={"x-goog-api-key": key, "Content-Type": "application/json"},
                json={
                    "contents": [{"parts": [{"text": _PARSE_SYSTEM}, {"text": user}]}],
                    "generationConfig": {"temperature": 0.2},
                },
            )
            r.raise_for_status()
            payload = r.json()
            parts = payload["candidates"][0]["content"]["parts"]
            content = parts[0].get("text", "")
    except httpx.TimeoutException:
        logger.warning("Gemini parse skipped: timeout after %.0fs (model=%s)", timeout, model)
        return None, "gemini_timeout"
    except httpx.HTTPStatusError as exc:
        status = exc.response.status_code
        detail = _safe_api_error_body(exc.response)
        if status == 429:
            logger.warning("Gemini parse skipped: quota exceeded (429, model=%s) — %s", model, detail)
            return None, "gemini_quota_exceeded"
        if status in (401, 403):
            logger.warning("Gemini parse skipped: unauthorized (HTTP %s, model=%s)", status, model)
            return None, "gemini_unauthorized"
        logger.warning("Gemini parse skipped: HTTP %s (model=%s) — %s", status, model, detail)
        return None, "gemini_api_error"
    except (KeyError, IndexError, TypeError):
        logger.warning("Gemini parse skipped: unexpected response shape (model=%s)", model)
        return None, "gemini_invalid_response"
    except Exception:
        logger.exception("Gemini parse skipped: unexpected error (model=%s)", model)
        return None, "gemini_api_error"

    data = _extract_json_from_content(content)
    if not data:
        logger.warning("Gemini parse skipped: response was not valid JSON (model=%s)", model)
        return None, "gemini_invalid_response"
    try:
        return _normalize_ai_dict(data, timezone, ParseSource.GEMINI), None
    except Exception:
        logger.warning("Gemini parse skipped: could not normalize model JSON (model=%s)", model)
        return None, "gemini_invalid_response"


def parse_task_text(text: str, timezone: str = "Europe/Istanbul") -> AIParsedTaskObject:
    provider = _provider_name()
    parsed: Optional[AIParsedTaskObject] = None
    source = ParseSource.HEURISTIC
    fallback_reason: Optional[str] = None

    logger.info("parse_task: provider=%s text_len=%d", provider, len(text.strip()))

    if provider == "mock":
        parsed = _fallback_parse(text, timezone, ParseSource.MOCK)
        source = ParseSource.MOCK
        logger.info("parse_task: using mock parser")
    elif provider == "openai":
        if not _has_openai_key():
            fallback_reason = "missing_openai_api_key"
            logger.warning("parse_task: skipped OpenAI — %s", fallback_reason)
            parsed = _fallback_parse(text, timezone, ParseSource.HEURISTIC)
        else:
            logger.info("parse_task: attempting OpenAI (one attempt, no retry)")
            parsed, ai_reason = _openai_parse(text, timezone)
            source = ParseSource.OPENAI if parsed else ParseSource.HEURISTIC
            if parsed is None:
                fallback_reason = ai_reason or "openai_api_error"
                parsed = _fallback_parse(text, timezone, ParseSource.HEURISTIC)
    elif provider == "gemini":
        if not _has_gemini_key():
            fallback_reason = "missing_gemini_api_key"
            logger.warning("parse_task: skipped Gemini — %s", fallback_reason)
            parsed = _fallback_parse(text, timezone, ParseSource.HEURISTIC)
        else:
            logger.info("parse_task: attempting Gemini model=%s (one attempt, no retry)", _gemini_model_name())
            parsed, ai_reason = _gemini_parse(text, timezone)
            source = ParseSource.GEMINI if parsed else ParseSource.HEURISTIC
            if parsed is None:
                fallback_reason = ai_reason or "gemini_api_error"
                parsed = _fallback_parse(text, timezone, ParseSource.HEURISTIC)
    else:
        fallback_reason = "invalid_ai_provider"
        logger.warning("parse_task: invalid provider=%r — trying Gemini then OpenAI once each", provider)
        parsed, gemini_reason = _gemini_parse(text, timezone)
        source = ParseSource.GEMINI if parsed else ParseSource.HEURISTIC
        if parsed is None:
            parsed, openai_reason = _openai_parse(text, timezone)
            source = ParseSource.OPENAI if parsed else ParseSource.HEURISTIC
            if parsed is None:
                fallback_reason = gemini_reason or openai_reason or "gemini_api_error"
                parsed = _fallback_parse(text, timezone, ParseSource.HEURISTIC)

    assert parsed is not None
    result = _apply_deterministic_overrides(text, parsed, timezone)
    if result.source != source and source in (ParseSource.GEMINI, ParseSource.OPENAI):
        result = result.model_copy(update={"source": source})
    elif parsed.source in (ParseSource.HEURISTIC, ParseSource.MOCK):
        result = result.model_copy(update={"source": parsed.source})

    if result.source == ParseSource.HEURISTIC and fallback_reason:
        result = result.model_copy(update={"fallbackReason": fallback_reason})
        logger.info(
            "parse_task: result source=heuristic fallbackReason=%s provider=%s",
            fallback_reason,
            provider,
        )
    else:
        logger.info("parse_task: result source=%s fallbackReason=none", result.source.value)

    return result
