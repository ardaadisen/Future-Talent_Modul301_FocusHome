"""Shared auth helpers for backend tests."""

from fastapi.testclient import TestClient

TEST_PASSWORD = "Password1!"


def register_and_login(client: TestClient, email: str, password: str = TEST_PASSWORD) -> dict[str, str]:
    reg = client.post("/api/auth/register", json={"email": email, "password": password})
    assert reg.status_code == 200, reg.text
    login = client.post("/api/auth/login", json={"email": email, "password": password})
    assert login.status_code == 200, login.text
    token = login.json()["token"]
    return {"Authorization": f"Bearer {token}"}
