from datetime import datetime
from zoneinfo import ZoneInfo

import pytest
from fastapi.testclient import TestClient

from main import app

client = TestClient(app)


def test_parse_source_heuristic_without_api_key(monkeypatch):
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)
    monkeypatch.setenv("AI_PROVIDER", "gemini")

    r = client.post(
        "/api/ai/parse-task",
        json={"text": "Tomorrow at 10.00 study for 15 minutes", "timezone": "Europe/Istanbul"},
    )
    assert r.status_code == 200
    data = r.json()
    assert data["source"] == "heuristic"
    assert data["fallbackReason"] == "missing_gemini_api_key"
    assert data["durationSeconds"] == 900
    start = datetime.fromisoformat(data["startDateTime"])
    local = start.astimezone(ZoneInfo("Europe/Istanbul"))
    assert local.hour == 10
    assert local.minute == 0


def test_parse_coffee_at_10_for_15_minutes():
    r = client.post(
        "/api/ai/parse-task",
        json={
            "text": "Tomorrow drink coffee at 10.00 for 15 minutes",
            "timezone": "Europe/Istanbul",
        },
    )
    assert r.status_code == 200
    data = r.json()
    assert data["source"] in ("heuristic", "mock", "gemini", "openai")
    assert data["durationSeconds"] == 900
    assert data["durationMinutes"] == 15
    start = datetime.fromisoformat(data["startDateTime"])
    local = start.astimezone(ZoneInfo("Europe/Istanbul"))
    assert local.hour == 10
    assert local.minute == 0


def test_parse_duration_for_minutes():
    r = client.post(
        "/api/ai/parse-task",
        json={"text": "Study for 45 minutes", "timezone": "Europe/Istanbul"},
    )
    assert r.status_code == 200
    data = r.json()
    assert data["durationSeconds"] == 2700


def test_heuristic_confidence_not_overstated():
    r = client.post(
        "/api/ai/parse-task",
        json={"text": "Tomorrow drink coffee at 10.00 for 15 minutes", "timezone": "Europe/Istanbul"},
    )
    data = r.json()
    if data["source"] == "heuristic":
        assert data["confidence"] <= 0.92
        assert data["confidence"] >= 0.7


def test_parse_turkish_coffee_half_hour(monkeypatch):
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)
    monkeypatch.setenv("AI_PROVIDER", "gemini")

    r = client.post(
        "/api/ai/parse-task",
        json={
            "text": "Yarın saat 10.00 da yarım saat kahve iç.",
            "timezone": "Europe/Istanbul",
        },
    )
    assert r.status_code == 200
    data = r.json()
    assert data["source"] == "heuristic"
    assert data["durationSeconds"] == 1800
    start = datetime.fromisoformat(data["startDateTime"])
    local = start.astimezone(ZoneInfo("Europe/Istanbul"))
    assert local.hour == 10
    assert local.minute == 0


def test_parse_invalid_gemini_falls_back_to_heuristic(monkeypatch):
    monkeypatch.setenv("AI_PROVIDER", "gemini")
    monkeypatch.setenv("GEMINI_API_KEY", "invalid-key-for-test")
    monkeypatch.setattr(
        "app.services.ai_service._gemini_parse",
        lambda *_a, **_k: (None, "gemini_unauthorized"),
    )

    r = client.post(
        "/api/ai/parse-task",
        json={"text": "Study for 30 minutes", "timezone": "Europe/Istanbul"},
    )
    assert r.status_code == 200
    data = r.json()
    assert data["source"] == "heuristic"
    assert data["fallbackReason"] == "gemini_unauthorized"
    assert data["durationSeconds"] == 1800


def test_parse_gemini_quota_returns_heuristic_with_reason(monkeypatch):
    monkeypatch.setenv("AI_PROVIDER", "gemini")
    monkeypatch.setenv("GEMINI_API_KEY", "test-key")
    monkeypatch.setattr(
        "app.services.ai_service._gemini_parse",
        lambda *_a, **_k: (None, "gemini_quota_exceeded"),
    )

    r = client.post(
        "/api/ai/parse-task",
        json={"text": "Study for 30 minutes", "timezone": "Europe/Istanbul"},
    )
    assert r.status_code == 200
    data = r.json()
    assert data["source"] == "heuristic"
    assert data["fallbackReason"] == "gemini_quota_exceeded"
    assert data["durationSeconds"] == 1800
