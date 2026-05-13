"""Google Calendar template URL (no OAuth, no calendar read)."""

from __future__ import annotations

from datetime import datetime
from urllib.parse import quote
from zoneinfo import ZoneInfo

from dateutil import parser as date_parser

IST = ZoneInfo("Europe/Istanbul")


def _ensure_tz(dt: datetime, default_tz: str) -> datetime:
    if dt.tzinfo is not None:
        return dt
    tz = ZoneInfo(default_tz) if default_tz else IST
    return dt.replace(tzinfo=tz)


def to_utc_google_compact(dt: datetime, assume_tz: str = "Europe/Istanbul") -> str:
    """Format as YYYYMMDDTHHMMSSZ in UTC."""
    aware = _ensure_tz(dt, assume_tz)
    utc = aware.astimezone(ZoneInfo("UTC"))
    return utc.strftime("%Y%m%dT%H%M%SZ")


def build_template_url(
    title: str,
    start: datetime,
    end: datetime,
    description: str = "",
    assume_tz: str = "Europe/Istanbul",
) -> str:
    start_s = to_utc_google_compact(start, assume_tz)
    end_s = to_utc_google_compact(end, assume_tz)
    dates = f"{start_s}/{end_s}"
    base = "https://calendar.google.com/calendar/render?action=TEMPLATE"
    return (
        f"{base}&text={quote(title)}&dates={quote(dates, safe='/')}"
        f"&details={quote(description)}"
    )


def parse_iso_datetime(value: str | datetime, assume_tz: str = "Europe/Istanbul") -> datetime:
    if isinstance(value, datetime):
        return _ensure_tz(value, assume_tz)
    dt = date_parser.isoparse(value)
    return _ensure_tz(dt, assume_tz)
