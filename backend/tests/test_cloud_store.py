"""Tests for Postgres cloud_store JSONB serialization."""

from psycopg.types.json import Jsonb

from app.repositories import cloud_store


def test_jsonb_list_wraps_python_list():
    wrapped = cloud_store._jsonb_list([{"x": 1}])
    assert isinstance(wrapped, Jsonb)


def test_jsonb_object_wraps_python_dict():
    wrapped = cloud_store._jsonb_object({"tier": "starter"})
    assert isinstance(wrapped, Jsonb)


def test_task_bucket_to_row_normalizes_local_fields():
    row = cloud_store._task_bucket_to_row(
        {
            "id": "task-1",
            "title": "Study",
            "durationMinutes": 30,
            "difficulty": "easy",
            "status": "pending",
            "source": "MANUAL",
        },
        "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
    )
    assert row["duration_seconds"] == 1800
    assert row["difficulty"] == "EASY"
    assert row["status"] == "PENDING"


def test_normalize_sync_payload_tolerates_empty_sections():
    from app.services.user_service import _normalize_sync_payload

    payload = _normalize_sync_payload(
        {
            "tasks": [],
            "completedHomes": [],
            "decorationPlacements": [],
            "inventory": {"total_xp": 0, "resources": {}},
            "grid": {"cells": []},
        }
    )
    assert payload["tasks"] == []
    assert payload["completedHomes"] == []
