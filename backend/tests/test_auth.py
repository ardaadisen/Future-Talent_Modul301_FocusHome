from datetime import datetime, timedelta, timezone

import jwt
from fastapi.testclient import TestClient

from main import app
from tests.auth_helpers import TEST_PASSWORD, register_and_login

client = TestClient(app)


def test_wrong_password_fails():
    email = "wrong-pass@example.com"
    register_and_login(client, email)
    r = client.post("/api/auth/login", json={"email": email, "password": "WrongPass1!"})
    assert r.status_code == 401


def test_nonexistent_user_fails():
    r = client.post(
        "/api/auth/login",
        json={"email": "missing@example.com", "password": TEST_PASSWORD},
    )
    assert r.status_code == 401


def test_weak_password_rejected_on_register():
    r = client.post(
        "/api/auth/register",
        json={"email": "weak@example.com", "password": "short"},
    )
    assert r.status_code == 400


def test_registered_user_can_sign_in():
    email = "good-user@example.com"
    headers = register_and_login(client, email)
    me = client.get("/api/auth/me", headers=headers)
    assert me.status_code == 200
    assert me.json()["authenticated"] is True
    assert me.json()["email"] == email


def test_user_a_cannot_see_user_b_tasks():
    headers_a = register_and_login(client, "isolate-a@example.com")
    headers_b = register_and_login(client, "isolate-b@example.com")

    created = client.post(
        "/api/tasks/manual",
        headers=headers_a,
        json={"title": "Secret A", "preset_duration": 15, "difficulty_level": "EASY"},
    )
    task_id = created.json()["id"]

    listed_b = client.get("/api/tasks", headers=headers_b).json()
    assert all(t["id"] != task_id for t in listed_b)

    get_b = client.get(f"/api/tasks/{task_id}", headers=headers_b)
    assert get_b.status_code == 404


def test_supabase_jwt_auth(monkeypatch):
    secret = "test-jwt-secret-for-pytest"
    monkeypatch.setenv("AUTH_MODE", "supabase")
    monkeypatch.setenv("SUPABASE_JWT_SECRET", secret)

    user_id = "11111111-2222-3333-4444-555555555555"
    exp = datetime.now(timezone.utc) + timedelta(hours=1)
    token = jwt.encode(
        {"sub": user_id, "email": "jwt-user@example.com", "aud": "authenticated", "exp": exp},
        secret,
        algorithm="HS256",
    )
    headers = {"Authorization": f"Bearer {token}"}

    r = client.get("/api/tasks", headers=headers)
    assert r.status_code == 200
    assert r.json() == []

    me = client.get("/api/auth/me", headers=headers)
    assert me.json()["authenticated"] is True
    assert me.json()["userId"] == user_id

    monkeypatch.setenv("AUTH_MODE", "mock")
