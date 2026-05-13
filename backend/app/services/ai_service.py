"""Natural-language task parsing: optional OpenAI (httpx), deterministic fallback."""

from __future__ import annotations

import json
import os
import re
from datetime import datetime, timedelta
from hashlib import sha256
from typing import Any, Optional

import httpx
from dateutil import parser as date_parser
from zoneinfo import ZoneInfo

from app.schemas import AIParsedTaskObject, Difficulty
from app.services import calendar_service

ALLOWED_MINUTES = (15, 30, 45, 60)


def nearest_preset_duration(minutes: int) -> int:
    return min(ALLOWED_MINUTES, key=lambda m: abs(m - minutes))


def _fallback_confidence(text: str) -> float:
    h = int(sha256(text.encode("utf-8")).hexdigest()[:8], 16)
    return 0.55 + (h % 21) / 100.0


def _infer_duration_minutes(text: str) -> int:
    low = text.lower()
    if re.search(r"\b1\s*hour\b", low) or "bir saat" in low or re.search(r"\b60\s*(min|minutes|mins|dakika)?\b", low):
        return 60
    m = re.search(r"\b(15|30|45|60)\s*(min|minutes|mins|dk|dakika)?\b", low)
    if m:
        return int(m.group(1))
    m2 = re.search(r"\b(\d{1,2})\s*(min|minutes|mins|dakika|dk)\b", low)
    if m2:
        return nearest_preset_duration(int(m2.group(1)))
    return 30


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
    # Prefer clause after "will" / "going to"
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


def _parse_hour_from_text(text: str) -> Optional[int]:
    low = text.lower()
    m = re.search(r"\b(\d{1,2})\s*(pm|am)\b", low)
    if m:
        h = int(m.group(1))
        ap = m.group(2)
        if ap == "pm" and h != 12:
            h += 12
        if ap == "am" and h == 12:
            h = 0
        return h
    m24 = re.search(r"\b(\d{1,2}):(\d{2})\b", low)
    if m24:
        return int(m24.group(1))
    m_saat = re.search(r"saat\s*(\d{1,2})", low)
    if m_saat:
        return int(m_saat.group(1))
    return None


def _fallback_parse(text: str, timezone: str = "Europe/Istanbul") -> AIParsedTaskObject:
    tz = ZoneInfo(timezone)
    now = datetime.now(tz)
    low = text.lower()
    day = now.date()
    if "tomorrow" in low or "yarın" in low or "yarin" in low:
        day = day + timedelta(days=1)

    hour = _parse_hour_from_text(text)
    if hour is None:
        hour = 15
    start = datetime.combine(day, datetime.min.time().replace(hour=hour), tzinfo=tz)
    if start < now - timedelta(hours=2):
        start = start + timedelta(days=1)

    minutes = _infer_duration_minutes(text)
    minutes = nearest_preset_duration(minutes)
    end = start + timedelta(minutes=minutes)
    diff = _infer_difficulty(text)
    title = _infer_title(text)
    desc = f"Focus session derived from your plan."
    conf = _fallback_confidence(text)
    cal_eligible = True
    cal_url = calendar_service.build_template_url(title, start, end, desc)
    return AIParsedTaskObject(
        title=title,
        startDateTime=start,
        endDateTime=end,
        durationMinutes=minutes,
        difficulty=diff,
        description=desc,
        confidence=conf,
        calendarEligible=cal_eligible,
        calendarUrl=cal_url,
    )


def _normalize_ai_dict(data: dict[str, Any], timezone: str) -> AIParsedTaskObject:
    title = str(data.get("title") or "Focus Session")[:200]
    diff_raw = str(data.get("difficulty", "MEDIUM")).upper()
    if diff_raw not in ("EASY", "MEDIUM", "HARD"):
        diff_raw = "MEDIUM"
    diff = Difficulty(diff_raw)
    dm = int(data.get("durationMinutes") or 30)
    dm = nearest_preset_duration(dm)
    start = calendar_service.parse_iso_datetime(str(data.get("startDateTime")), timezone)
    end = calendar_service.parse_iso_datetime(str(data.get("endDateTime")), timezone)
    if end <= start:
        end = start + timedelta(minutes=dm)
    desc = str(data.get("description") or "")[:500]
    conf = float(data.get("confidence") or 0.75)
    conf = max(0.0, min(1.0, conf))
    cal_eligible = bool(data.get("calendarEligible", True))
    cal_url = data.get("calendarUrl")
    if cal_url is not None:
        cal_url = str(cal_url)
    if cal_eligible and not cal_url:
        cal_url = calendar_service.build_template_url(title[:80], start, end, desc)
    return AIParsedTaskObject(
        title=title[:50],
        startDateTime=start,
        endDateTime=end,
        durationMinutes=dm,
        difficulty=diff,
        description=desc or "Focus session",
        confidence=conf,
        calendarEligible=cal_eligible,
        calendarUrl=cal_url,
    )


def _openai_parse(text: str, timezone: str) -> Optional[AIParsedTaskObject]:
    key = (os.getenv("OPENAI_API_KEY") or "").strip()
    provider = (os.getenv("AI_PROVIDER") or "openai").strip().lower()
    if not key or provider != "openai":
        return None

    system = (
        "You extract a single focus task from user text. Reply with JSON only, no markdown. "
        "Fields: title (max 50 chars), startDateTime, endDateTime as ISO-8601 with timezone offset, "
        "durationMinutes one of 15,30,45,60, difficulty EASY|MEDIUM|HARD, description string, "
        "confidence number 0-1, calendarEligible boolean. "
        "Use the user's timezone for interpreting relative times when needed."
    )
    user = json.dumps({"text": text, "timezone": timezone})
    try:
        with httpx.Client(timeout=30.0) as client:
            r = client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
                json={
                    "model": os.getenv("OPENAI_MODEL", "gpt-4o-mini"),
                    "temperature": 0.2,
                    "messages": [
                        {"role": "system", "content": system},
                        {"role": "user", "content": user},
                    ],
                },
            )
            r.raise_for_status()
            payload = r.json()
            content = payload["choices"][0]["message"]["content"]
    except Exception:
        return None

    try:
        data = json.loads(content)
    except json.JSONDecodeError:
        m = re.search(r"\{[\s\S]*\}", content)
        if not m:
            return None
        try:
            data = json.loads(m.group(0))
        except json.JSONDecodeError:
            return None

    try:
        return _normalize_ai_dict(data, timezone)
    except Exception:
        return None


def parse_task_text(text: str, timezone: str = "Europe/Istanbul") -> AIParsedTaskObject:
    ai = _openai_parse(text, timezone)
    if ai is not None:
        return ai
    return _fallback_parse(text, timezone)
