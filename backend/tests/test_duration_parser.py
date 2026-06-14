import pytest

from app.services.duration_parser import parse_duration_seconds


@pytest.mark.parametrize(
    "text,expected",
    [
        ("2 saat çalışacağım", 7200),
        ("1 saat odaklan", 3600),
        ("yarım saat oku", 1800),
        ("yarim saat oku", 1800),
        ("bir buçuk saat çalış", 5400),
        ("90 dakika matematik", 5400),
        ("45 dk okuma", 2700),
        ("2 saat 30 dakika algoritma", 9000),
        ("2 hours of study", 7200),
        ("1 hour 30 minutes focus", 5400),
        ("90 minutes reading", 5400),
        ("Tomorrow 2 saat algoritma çalışacağım", 7200),
        ("for 15 minutes focus", 900),
        ("for 45 minutes reading", 2700),
        ("Tomorrow drink coffee at 10.00 for 15 minutes", 900),
    ],
)
def test_parse_duration_seconds(text, expected):
    assert parse_duration_seconds(text) == expected


def test_parse_duration_none_when_missing():
    assert parse_duration_seconds("Tomorrow study algorithms") is None
