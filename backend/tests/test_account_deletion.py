from fastapi.testclient import TestClient

from app.storage import mutate_state
from app.user_data import ensure_user_bucket
from main import app
from tests.auth_helpers import TEST_PASSWORD, register_and_login

client = TestClient(app)


def test_delete_account_requires_auth():
    r = client.delete("/api/account")
    assert r.status_code == 401


def test_delete_account_removes_only_authenticated_user():
    headers_a = register_and_login(client, "user-a@example.com")
    headers_b = register_and_login(client, "user-b@example.com")
    user_a = client.get("/api/auth/me", headers=headers_a).json()["userId"]
    user_b = client.get("/api/auth/me", headers=headers_b).json()["userId"]

    def seed_user_b(state):
        ensure_user_bucket(state, user_b)
        state["users"][user_b]["profile"]["displayName"] = "User B Keep"
        return True

    mutate_state(seed_user_b)

    r = client.delete("/api/account", headers=headers_a)
    assert r.status_code == 200
    assert r.json()["ok"] is True
    assert r.json()["userId"] == user_a

    me_a = client.get("/api/auth/me", headers=headers_a)
    assert me_a.json()["authenticated"] is False

    def check_user_b(state):
        assert user_b in state.get("users", {})
        assert state["users"][user_b]["profile"]["displayName"] == "User B Keep"
        assert user_a not in state.get("users", {})
        return True

    mutate_state(check_user_b)


def test_delete_account_clears_user_tasks():
    headers = register_and_login(client, "owner@example.com")
    user_id = client.get("/api/auth/me", headers=headers).json()["userId"]

    create = client.post(
        "/api/tasks/manual",
        headers=headers,
        json={
            "title": "Owned",
            "preset_duration": 15,
            "difficulty_level": "EASY",
        },
    )
    assert create.status_code == 200

    r = client.delete("/api/account", headers=headers)
    assert r.status_code == 200

    login_again = client.post(
        "/api/auth/register",
        json={"email": "owner@example.com", "password": TEST_PASSWORD},
    )
    assert login_again.status_code == 200
    new_headers = {"Authorization": f"Bearer {login_again.json()['token']}"}
    tasks = client.get("/api/tasks", headers=new_headers).json()
    assert tasks == []
