import pytest


@pytest.fixture(autouse=True)
def isolated_state(tmp_path, monkeypatch):
    """Use a fresh JSON state file per test."""
    monkeypatch.setattr("app.storage.DATA_DIR", tmp_path)
    monkeypatch.setattr("app.storage.STATE_FILE", tmp_path / "state.json")
    yield
