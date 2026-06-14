"""Tests for idempotent task merge during cloud migration."""

from app.services.user_service import _merge_tasks


def test_merge_tasks_skips_duplicate_ids():
    existing = [{"id": "a", "title": "One"}]
    incoming = [{"id": "a", "title": "Dup"}, {"id": "b", "title": "Two"}]
    merged = _merge_tasks(existing, incoming)
    assert len(merged) == 2
    assert merged[0]["title"] == "One"
    assert merged[1]["id"] == "b"
