"""Deterministic date/time extraction from natural language (TR + EN)."""

from __future__ import annotations

import re
import unicodedata
from dataclasses import dataclass
from datetime import date, datetime, timedelta
from typing import Optional
from zoneinfo import ZoneInfo

_WEEKDAYS_EN = {
    "monday": 0,
    "tuesday": 1,
    "wednesday": 2,
    "thursday": 3,
    "friday": 4,
    "saturday": 5,
    "sunday": 6,
}

_WEEKDAYS_TR = {
    "pazartesi": 0,
    "salı": 1,
    "sali": 1,
    "çarşamba": 2,
    "carsamba": 2,
    "perşembe": 3,
    "persembe": 3,
    "cuma": 4,
    "cumartesi": 5,
    "pazar": 6,
}


@dataclass
class ParsedSchedule:
    start: datetime
    found_date: bool
    found_time: bool


def _normalize_text(text: str) -> str:
    lowered = text.lower()
    normalized = unicodedata.normalize("NFKD", lowered)
    stripped = "".join(ch for ch in normalized if not unicodedata.combining(ch))
    return stripped.replace("’", "'").replace("‘", "'")


def _next_weekday(from_day: date, weekday: int) -> date:
    days_ahead = (weekday - from_day.weekday()) % 7
    if days_ahead == 0:
        days_ahead = 7
    return from_day + timedelta(days=days_ahead)


def _parse_clock(hour: int, minute: int, meridiem: Optional[str]) -> tuple[int, int]:
    if meridiem == "pm" and hour != 12:
        hour += 12
    elif meridiem == "am" and hour == 12:
        hour = 0
    hour = max(0, min(hour, 23))
    minute = max(0, min(minute, 59))
    return hour, minute


def _resolve_day(text: str, base_day: date) -> tuple[date, bool]:
    if re.search(r"\btomorrow\b|\byarin\b|\byarın\b", text):
        return base_day + timedelta(days=1), True
    if re.search(r"\btoday\b|\bbugun\b|\bbugün\b", text):
        return base_day, True

    m = re.search(r"\bnext\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b", text)
    if m:
        wd = _WEEKDAYS_EN[m.group(1)]
        return _next_weekday(base_day, wd), True

    for name, wd in _WEEKDAYS_TR.items():
        if re.search(rf"\b{name}\b", text):
            target = _next_weekday(base_day, wd)
            if target == base_day + timedelta(days=0) and base_day.weekday() == wd:
                target = base_day
            elif base_day.weekday() != wd:
                target = _next_weekday(base_day, wd)
            return target, True

    for name, wd in _WEEKDAYS_EN.items():
        if re.search(rf"\b{name}\b", text):
            if base_day.weekday() == wd:
                return base_day, True
            return _next_weekday(base_day, wd), True

    return base_day, False


def _parse_time_of_day(text: str) -> Optional[tuple[int, int]]:
    # English: at 10 am / at 10 pm
    m = re.search(r"\bat\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b", text)
    if m:
        hour = int(m.group(1))
        minute = int(m.group(2) or 0)
        return _parse_clock(hour, minute, m.group(3))

    # tomorrow at 10.00 / at 10:00 / tomorrow 10.00
    m = re.search(
        r"(?:\bat\s+)?(\d{1,2})[.:](\d{2})(?:\s*(?:am|pm))?(?:\s*(?:'da|'de|da|de))?\b",
        text,
    )
    if m:
        hour = int(m.group(1))
        minute = int(m.group(2))
        meridiem = None
        ap = re.search(rf"\b{hour}[.:]{minute:02d}\s*(am|pm)\b", text)
        if ap:
            meridiem = ap.group(1)
        if 0 <= hour <= 23 and 0 <= minute <= 59:
            return _parse_clock(hour, minute, meridiem)

    # at 10 / tomorrow at 10 (avoid matching duration counts like "for 15")
    m = re.search(r"\b(?:at|saat)\s+(\d{1,2})(?!\s*(?:minutes?|mins?|dakika|dk|hours?|saat))\b", text)
    if m:
        hour = int(m.group(1))
        if 0 <= hour <= 23:
            return hour, 0

    # Turkish: yarın 10'da / 10.00'da / 10:00'da
    m = re.search(r"\b(\d{1,2})(?:[.:](\d{2}))?\s*(?:'da|'de|da|de)\b", text)
    if m:
        hour = int(m.group(1))
        minute = int(m.group(2) or 0)
        if 0 <= hour <= 23 and 0 <= minute <= 59:
            return hour, minute

    # saat 10 / saat 14:30
    m = re.search(r"\bsaat\s+(\d{1,2})(?::(\d{2}))?\b", text)
    if m:
        hour = int(m.group(1))
        minute = int(m.group(2) or 0)
        if 0 <= hour <= 23 and 0 <= minute <= 59:
            return hour, minute

    return None


def parse_scheduled_start(
    text: str,
    timezone: str = "Europe/Istanbul",
    *,
    now: Optional[datetime] = None,
) -> Optional[ParsedSchedule]:
    """
    Extract scheduled start datetime from user text.
    Returns None when no date or time cue is found.
    """
    if not text or not text.strip():
        return None

    norm = _normalize_text(text)
    tz = ZoneInfo(timezone)
    now = now or datetime.now(tz)
    day, found_date = _resolve_day(norm, now.date())
    clock = _parse_time_of_day(norm)

    if not found_date and clock is None:
        return None

    hour, minute = clock if clock else (now.hour, now.minute)
    found_time = clock is not None

    if not found_date and not found_time:
        return None

    start = datetime.combine(day, datetime.min.time().replace(hour=hour, minute=minute), tzinfo=tz)
    if found_date and not found_time and start < now - timedelta(hours=1):
        start = start  # keep explicit today
    elif not found_date and found_time and start < now - timedelta(minutes=30):
        start = start + timedelta(days=1)

    return ParsedSchedule(start=start, found_date=found_date, found_time=found_time)


def apply_time_override(
    text: str,
    *,
    start: datetime,
    timezone: str = "Europe/Istanbul",
) -> tuple[datetime, bool]:
    """If text contains explicit schedule, return overridden start and whether time was found."""
    parsed = parse_scheduled_start(text, timezone, now=start.astimezone(ZoneInfo(timezone)))
    if parsed is None:
        return start, False
    return parsed.start, parsed.found_time or parsed.found_date
