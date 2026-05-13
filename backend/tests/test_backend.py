from fastapi.testclient import TestClient

from main import app

client = TestClient(app)


def test_list_tasks_empty_by_default():
    r = client.get("/api/tasks")
    assert r.status_code == 200
    assert r.json() == []


def test_health():
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json() == {"status": "ok", "service": "focushome-backend"}


def test_api_main():
    r = client.get("/api/main")
    assert r.status_code == 200
    data = r.json()
    assert data["app"] == "FocusHome"
    assert data["version"] == "0.1.0"


def test_parse_task_structure():
    r = client.post(
        "/api/ai/parse-task",
        json={"text": "Tomorrow at 3 PM I will study algorithms for 45 minutes.", "timezone": "Europe/Istanbul"},
    )
    assert r.status_code == 200
    data = r.json()
    for key in (
        "title",
        "startDateTime",
        "endDateTime",
        "durationMinutes",
        "difficulty",
        "description",
        "confidence",
        "calendarEligible",
    ):
        assert key in data
    assert data["durationMinutes"] in (15, 30, 45, 60)
    assert data["difficulty"] in ("EASY", "MEDIUM", "HARD")


def test_manual_task_and_complete_rewards_once():
    r = client.post(
        "/api/tasks/manual",
        json={
            "title": "Test Task",
            "preset_duration": 30,
            "difficulty_level": "MEDIUM",
            "description": "d",
        },
    )
    assert r.status_code == 200
    tid = r.json()["id"]

    client.patch(f"/api/tasks/{tid}/start")
    inv1 = client.patch(f"/api/tasks/{tid}/complete").json()["inventory"]
    assert inv1["resources"]["bricks"] == 5
    assert inv1["total_xp"] == 50

    inv2 = client.patch(f"/api/tasks/{tid}/complete").json()["inventory"]
    assert inv2["resources"]["bricks"] == 5
    assert inv2["total_xp"] == 50


def test_grid_place_blocks_occupied():
    r1 = client.post(
        "/api/grid/place",
        json={"x": 0, "y": 0, "asset_id": "wall_v1", "rotation": 0},
    )
    assert r1.status_code == 200
    r2 = client.post(
        "/api/grid/place",
        json={"x": 0, "y": 0, "asset_id": "wall_v1", "rotation": 0},
    )
    assert r2.status_code == 409


def test_calendar_template_url():
    r = client.post(
        "/api/calendar/template-url",
        json={
            "title": "Finance Study",
            "startDateTime": "2026-05-14T10:00:00+03:00",
            "endDateTime": "2026-05-14T11:00:00+03:00",
            "description": "Focus session",
        },
    )
    assert r.status_code == 200
    url = r.json()["calendarUrl"]
    assert url.startswith("https://calendar.google.com/calendar/render?action=TEMPLATE")
    assert "dates=" in url
