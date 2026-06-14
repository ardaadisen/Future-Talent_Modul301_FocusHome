import pytest
from datetime import datetime
from zoneinfo import ZoneInfo

from app.services.time_parser import parse_scheduled_start


TZ = "Europe/Istanbul"


def _hour(result) -> int:
    return result.start.astimezone(ZoneInfo(TZ)).hour


def _minute(result) -> int:
    return result.start.astimezone(ZoneInfo(TZ)).minute


def _day_offset(result, now: datetime) -> int:
    start_day = result.start.astimezone(ZoneInfo(TZ)).date()
    return (start_day - now.date()).days


@pytest.mark.parametrize(
    "text,hour,minute,day_offset",
    [
        ("Tomorrow drink coffee at 10.00 for 15 minutes", 10, 0, 1),
        ("tomorrow at 10:00 study", 10, 0, 1),
        ("tomorrow 10.00 focus", 10, 0, 1),
        ("tomorrow 10:00 focus", 10, 0, 1),
        ("today at 14:30 reading", 14, 30, 0),
        ("at 10 am workout", 10, 0, 0),
        ("at 10 pm workout", 22, 0, 0),
    ],
)
def test_english_time_parsing(text, hour, minute, day_offset):
    now = datetime(2026, 5, 25, 8, 0, tzinfo=ZoneInfo(TZ))
    result = parse_scheduled_start(text, TZ, now=now)
    assert result is not None
    assert result.found_time
    assert _hour(result) == hour
    assert _minute(result) == minute
    assert _day_offset(result, now) == day_offset


@pytest.mark.parametrize(
    "text,hour,minute,day_offset",
    [
        ("yarın saat 10 algoritma", 10, 0, 1),
        ("yarın 10'da kahve", 10, 0, 1),
        ("yarın 10.00'da kahve", 10, 0, 1),
        ("yarın 10:00'da kahve", 10, 0, 1),
        ("bugün saat 14:30 okuma", 14, 30, 0),
        ("pazartesi saat 9 çalışma", 9, 0, None),
    ],
)
def test_turkish_time_parsing(text, hour, minute, day_offset):
    now = datetime(2026, 5, 25, 8, 0, tzinfo=ZoneInfo(TZ))  # Monday
    result = parse_scheduled_start(text, TZ, now=now)
    assert result is not None
    assert result.found_time
    assert _hour(result) == hour
    assert _minute(result) == minute
    if day_offset is not None:
        assert _day_offset(result, now) == day_offset
