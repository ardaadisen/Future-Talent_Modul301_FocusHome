"""Authentication — Supabase JWT (production) or development mock (AUTH_MODE=mock only)."""

from __future__ import annotations

import hashlib
import re
import secrets
from typing import Any, Optional

import jwt

from app.config import (
    is_mock_auth_enabled,
    is_supabase_auth,
    jwt_verification_configured,
    supabase_jwt_secret,
)
from app.errors import AppError
from app.storage import mutate_state, read_state
from app.user_data import ensure_user_bucket

_EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
_PASSWORD_SPECIAL = re.compile(r"[^A-Za-z0-9]")
_MOCK_SALT = b"focushome-mock-auth-v1"


def validate_email(email: str) -> str:
    value = email.strip().lower()
    if not _EMAIL_RE.match(value):
        raise AppError(400, "Invalid email address.")
    return value


def validate_register_password(password: str) -> None:
    if len(password) < 8:
        raise AppError(400, "Password must be at least 8 characters.")
    if not re.search(r"[A-Z]", password):
        raise AppError(400, "Password must include at least one uppercase letter.")
    if not re.search(r"[a-z]", password):
        raise AppError(400, "Password must include at least one lowercase letter.")
    if not re.search(r"\d", password):
        raise AppError(400, "Password must include at least one number.")
    if not _PASSWORD_SPECIAL.search(password):
        raise AppError(400, "Password must include at least one special character.")


def _hash_password(password: str) -> str:
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), _MOCK_SALT, 120_000)
    return digest.hex()


def _mock_token(user_id: str) -> str:
    return f"dev-{user_id}"


def _unrevoke_token_in_state(state: dict[str, Any], token: str) -> None:
    revoked = state.setdefault("revoked_tokens", [])
    if token in revoked:
        revoked.remove(token)


def _verify_password(password: str, password_hash: str) -> bool:
    candidate = _hash_password(password)
    return secrets.compare_digest(candidate, password_hash)


def _dev_user_id(email: str) -> str:
    digest = hashlib.sha256(email.strip().lower().encode("utf-8")).hexdigest()[:32]
    return f"user-{digest}"


def _ensure_mock_auth_table(state: dict[str, Any]) -> dict[str, Any]:
    table = state.setdefault("mock_auth_users", {})
    if not isinstance(table, dict):
        state["mock_auth_users"] = {}
        table = state["mock_auth_users"]
    return table


def _mock_register(email: str, password: str) -> dict[str, Any]:
    validate_register_password(password)
    email = validate_email(email)

    def mutator(state: dict[str, Any]) -> dict[str, Any]:
        table = _ensure_mock_auth_table(state)
        if email in table:
            raise AppError(409, "An account with this email already exists.")
        user_id = _dev_user_id(email)
        table[email] = {"user_id": user_id, "password_hash": _hash_password(password)}
        ensure_user_bucket(state, user_id)
        token = _mock_token(user_id)
        _unrevoke_token_in_state(state, token)
        return {
            "userId": user_id,
            "email": email,
            "token": token,
            "mode": "mock",
        }

    return mutate_state(mutator)


def _mock_login(email: str, password: str) -> dict[str, Any]:
    email = validate_email(email)
    if not password:
        raise AppError(401, "Invalid credentials.")

    state = read_state()
    table = state.get("mock_auth_users", {})
    record = table.get(email)
    if not record or not _verify_password(password, record.get("password_hash", "")):
        raise AppError(401, "Invalid credentials.")

    user_id = record["user_id"]

    def ensure_bucket(state: dict[str, Any]) -> bool:
        ensure_user_bucket(state, user_id)
        _unrevoke_token_in_state(state, _mock_token(user_id))
        return True

    mutate_state(ensure_bucket)
    return {
        "userId": user_id,
        "email": email,
        "token": _mock_token(user_id),
        "mode": "mock",
    }


def register(email: str, password: str) -> dict[str, Any]:
    if is_supabase_auth():
        raise AppError(
            403,
            "Registration is handled by Supabase Auth on the client. Use the app sign-up form.",
        )
    if not is_mock_auth_enabled():
        raise AppError(403, "Mock authentication is disabled.")
    return _mock_register(email, password)


def login(email: str, password: str) -> dict[str, Any]:
    if is_supabase_auth():
        raise AppError(
            403,
            "Login is handled by Supabase Auth on the client. Use the app sign-in form.",
        )
    if not is_mock_auth_enabled():
        raise AppError(403, "Mock authentication is disabled.")
    return _mock_login(email, password)


def _verify_supabase_jwt(token: str) -> Optional[dict[str, Any]]:
    if not jwt_verification_configured():
        return None
    try:
        payload = jwt.decode(
            token,
            supabase_jwt_secret(),
            algorithms=["HS256"],
            audience="authenticated",
            options={"require": ["sub", "exp"]},
        )
    except jwt.PyJWTError:
        return None

    user_id = str(payload.get("sub") or "").strip()
    if not user_id:
        return None
    email = payload.get("email")

    def ensure_bucket(state: dict[str, Any]) -> bool:
        ensure_user_bucket(state, user_id)
        return True

    mutate_state(ensure_bucket)
    return {
        "userId": user_id,
        "email": email,
        "mode": "supabase",
    }


def _mock_email_for_user(state: dict[str, Any], user_id: str) -> Optional[str]:
    table = state.get("mock_auth_users", {})
    if not isinstance(table, dict):
        return None
    for email, record in table.items():
        if isinstance(record, dict) and record.get("user_id") == user_id:
            return email
    return None


def resolve_user_from_token(token: Optional[str]) -> Optional[dict[str, Any]]:
    if not token:
        return None
    token = token.strip()

    state = read_state()
    if token in state.get("revoked_tokens", []):
        return None

    if is_supabase_auth():
        return _verify_supabase_jwt(token)

    if token.startswith("dev-user-"):
        user_id = token.replace("dev-", "", 1)
        return {"userId": user_id, "email": _mock_email_for_user(state, user_id), "mode": "mock"}
    if token.startswith("dev-"):
        user_id = token[4:]
        return {"userId": user_id, "email": _mock_email_for_user(state, user_id), "mode": "mock"}

    if is_mock_auth_enabled():
        supabase_user = _verify_supabase_jwt(token)
        if supabase_user:
            return supabase_user

    return None
