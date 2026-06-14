"""Deterministic duration extraction from natural language (TR + EN)."""

from __future__ import annotations

import re
from typing import Optional

# Turkish number words
_TR_NUMBERS = {
    "bir": 1,
    "iki": 2,
    "üç": 3,
    "uc": 3,
    "dört": 4,
    "dort": 4,
    "beş": 5,
    "bes": 5,
    "altı": 6,
    "alti": 6,
    "yedi": 7,
    "sekiz": 8,
    "dokuz": 9,
    "on": 10,
    "yirmi": 20,
    "otuz": 30,
    "kırk": 40,
    "kirk": 40,
    "elli": 50,
    "altmış": 60,
    "altmis": 60,
    "yetmiş": 70,
    "yetmis": 70,
    "seksen": 80,
    "doksan": 90,
}


def _parse_tr_number(token: str) -> Optional[int]:
    token = token.strip().lower()
    if token.isdigit():
        return int(token)
    return _TR_NUMBERS.get(token)


def _hours_minutes_to_seconds(hours: float, minutes: float = 0) -> int:
    total = int(round(hours * 3600 + minutes * 60))
    return max(total, 60)


def parse_duration_seconds(text: str) -> Optional[int]:
    """
    Extract focus duration in seconds from user text.
    Returns None if no duration phrase is found.
    """
    if not text or not text.strip():
        return None

    low = text.lower().replace("½", " yarım ").replace("buçuk", " buçuk ")

    # English: for 15 minutes / for 45 mins
    m = re.search(r"\bfor\s+(\d+)\s*(?:minutes?|mins?)\b", low)
    if m:
        return max(int(m.group(1)) * 60, 60)

    # Turkish: yarım saat
    if re.search(r"\byarım\s+saat\b|\byarim\s+saat\b", low):
        return 1800

    # Turkish: bir buçuk saat / 1.5 saat
    m = re.search(r"(?:bir\s+buçuk|bir\s+bucuk|1[,.]5)\s*saat", low)
    if m:
        return 5400

    # Turkish: X saat Y dakika / X saat Y dk
    m = re.search(
        r"(?:(\d+|bir|iki|üç|uc|dört|dort|beş|bes|altı|alti|yedi|sekiz|dokuz|on|yirmi|otuz|kırk|kirk|elli)\s*)?"
        r"saat(?:ler)?(?:\s*(?:ve\s+)?(\d+|on|yirmi|otuz|kırk|kirk|elli|altmış|altmis)\s*(?:dakika|dk|minute|minutes|min))?",
        low,
    )
    if m and (m.group(0) and "saat" in m.group(0)):
        h_raw = m.group(1)
        hours = _parse_tr_number(h_raw) if h_raw else 1
        if hours is None and h_raw:
            hours = int(h_raw) if h_raw.isdigit() else 1
        if hours is None:
            hours = 1
        min_raw = m.group(2)
        minutes = 0
        if min_raw:
            minutes = _parse_tr_number(min_raw) or (int(min_raw) if min_raw.isdigit() else 0)
        # Avoid matching bare "saat 3" time-of-day — require duration context
        if re.search(r"\b(\d+|bir|iki|üç|uc|dört|dort|beş|bes)\s+saat\b", low) or re.search(
            r"\bfor\s+\d+\s+hours?\b", low
        ) or "dakika" in (m.group(0) or "") or "dk" in (m.group(0) or ""):
            return _hours_minutes_to_seconds(hours, minutes)

    # Explicit: 2 saat, 2 saat 30 dakika
    m = re.search(
        r"\b(\d+)\s*saat(?:ler)?(?:\s*(?:ve\s+)?(\d+)\s*(?:dakika|dk))?",
        low,
    )
    if m:
        hours = int(m.group(1))
        minutes = int(m.group(2)) if m.group(2) else 0
        return _hours_minutes_to_seconds(hours, minutes)

    m = re.search(
        r"\b(bir|iki|üç|uc|dört|dort|beş|bes|altı|alti|yedi|sekiz|dokuz|on)\s+saat(?:\s*(?:ve\s+)?(\d+|yarım|yarim|buçuk|bucuk)\s*(?:dakika|dk))?",
        low,
    )
    if m:
        hours = _parse_tr_number(m.group(1)) or 1
        extra = m.group(2)
        minutes = 0
        if extra in ("yarım", "yarim", "buçuk", "bucuk"):
            minutes = 30
        elif extra:
            minutes = int(extra) if extra.isdigit() else (_parse_tr_number(extra) or 0)
        return _hours_minutes_to_seconds(hours, minutes)

    # Turkish minutes only: 90 dakika, 45 dk
    m = re.search(r"\b(\d+)\s*(?:dakika|dk)\b", low)
    if m:
        return max(int(m.group(1)) * 60, 60)

    m = re.search(
        r"\b(bir|iki|üç|uc|dört|dort|beş|bes|altı|alti|yedi|sekiz|dokuz|on|yirmi|otuz|kırk|kirk|elli|altmış|altmis|doksan)\s*(?:dakika|dk)\b",
        low,
    )
    if m:
        val = _parse_tr_number(m.group(1))
        if val:
            return max(val * 60, 60)

    # English: 2 hours 30 minutes
    m = re.search(
        r"\b(\d+(?:\.\d+)?)\s*hours?(?:\s*(?:and\s+)?(\d+)\s*(?:minutes?|mins?))?",
        low,
    )
    if m:
        hours = float(m.group(1))
        minutes = int(m.group(2)) if m.group(2) else 0
        return _hours_minutes_to_seconds(hours, minutes)

    m = re.search(r"\b(\d+)\s*(?:minutes?|mins?)\b", low)
    if m:
        return max(int(m.group(1)) * 60, 60)

    m = re.search(r"\bhalf\s+an?\s+hour\b|\bhalf\s+hour\b", low)
    if m:
        return 1800

    m = re.search(r"\bone\s+and\s+a\s+half\s+hours?\b|\b1\.5\s+hours?\b", low)
    if m:
        return 5400

    # Legacy: 15/30/45/60 min patterns
    m = re.search(r"\b(15|30|45|60)\s*(?:min|minutes|mins|dk|dakika)?\b", low)
    if m:
        return int(m.group(1)) * 60

    m = re.search(r"\b(\d{1,3})\s*(?:min|minutes|mins|dk|dakika)\b", low)
    if m:
        return max(int(m.group(1)) * 60, 60)

    return None


def apply_duration_override(
    text: str,
    *,
    start,
    end,
    model_minutes: Optional[int] = None,
):
    """
    If text contains an explicit duration, recompute end datetime and minutes.
    Returns (end_datetime, duration_seconds, duration_minutes).
    """
    from datetime import timedelta

    parsed_seconds = parse_duration_seconds(text)
    if parsed_seconds is not None:
        end = start + timedelta(seconds=parsed_seconds)
        duration_seconds = parsed_seconds
    elif model_minutes is not None:
        duration_seconds = max(model_minutes * 60, 60)
        end = start + timedelta(seconds=duration_seconds)
    else:
        delta = end - start
        duration_seconds = max(int(delta.total_seconds()), 60)
    duration_minutes = max(1, int(round(duration_seconds / 60)))
    return end, duration_seconds, duration_minutes


def duration_display_seconds(seconds: int) -> int:
    """Preserve exact duration seconds for UI display."""
    return max(int(seconds), 1)
