import os

import pytest


@pytest.fixture(autouse=True)
def isolated_state(tmp_path, monkeypatch):
    """Use a fresh JSON state file per test with mock auth enabled."""
    monkeypatch.setattr("app.storage.DATA_DIR", tmp_path)
    monkeypatch.setattr("app.storage.STATE_FILE", tmp_path / "state.json")
    monkeypatch.setenv("AUTH_MODE", "mock")
    monkeypatch.setenv("APP_ENV", "development")
    monkeypatch.delenv("SUPABASE_JWT_SECRET", raising=False)
    monkeypatch.delenv("SUPABASE_URL", raising=False)
    monkeypatch.delenv("SUPABASE_SERVICE_ROLE_KEY", raising=False)
    monkeypatch.delenv("DATABASE_URL", raising=False)
    yield
