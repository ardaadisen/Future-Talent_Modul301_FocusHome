"""Authentication — Supabase JWT (production) or development mock (AUTH_MODE=mock only)."""

from __future__ import annotations

import hashlib
import logging
import re
import secrets
from typing import Any, Optional

import jwt

from app.config import (
    is_mock_auth_enabled,
    is_supabase_auth,
    jwt_verification_configured,
    supabase_jwt_secret,
    supabase_url,
)
from app.database import is_cloud_db_configured
from app.errors import AppError
from app.storage import mutate_state, read_state
from app.user_data import ensure_user_bucket

logger = logging.getLogger("focushome.auth")

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


def _jwt_issuer() -> Optional[str]:
    base = supabase_url()
    if not base:
        return None
    return f"{base.rstrip('/')}/auth/v1"


def _decode_supabase_jwt(token: str) -> tuple[Optional[dict[str, Any]], str]:
    if not jwt_verification_configured():
        return None, "jwt_secret_missing"

    if not supabase_jwt_secret() and not supabase_url():
        return None, "jwt_secret_missing"

    try:
        header = jwt.get_unverified_header(token)
    except jwt.PyJWTError:
        return None, "invalid_token"

    issuer = _jwt_issuer()
    decode_options = {"require": ["sub", "exp"]}
    algorithm = str(header.get("alg") or "")

    # Supabase access tokens are usually ES256/RS256 — verify via JWKS first.
    if supabase_url() and algorithm in ("RS256", "ES256", "EdDSA"):
        payload, reason = _decode_with_jwks(token, issuer, decode_options)
        if payload:
            return payload, "ok"
        if reason == "expired_token":
            return None, "expired_token"

    secret = supabase_jwt_secret()
    if secret and algorithm == "HS256":
        payload, reason = _decode_with_hs256(token, secret, issuer, decode_options)
        if payload:
            return payload, "ok"
        if reason == "expired_token":
            return None, "expired_token"

    # Fallback: try the other method when alg was unknown or first method failed.
    if supabase_url():
        payload, reason = _decode_with_jwks(token, issuer, decode_options)
        if payload:
            return payload, "ok"
        if reason == "expired_token":
            return None, "expired_token"

    if secret:
        payload, reason = _decode_with_hs256(token, secret, issuer, decode_options)
        if payload:
            return payload, "ok"
        return None, reason

    return None, "invalid_token"


def _decode_with_hs256(
    token: str,
    secret: str,
    issuer: Optional[str],
    decode_options: dict[str, Any],
) -> tuple[Optional[dict[str, Any]], str]:
    attempts = [False, True] if issuer else [False]
    last_reason = "invalid_token"
    for verify_iss in attempts:
        try:
            kwargs: dict[str, Any] = {
                "algorithms": ["HS256"],
                "audience": "authenticated",
                "leeway": 30,
                "options": {**decode_options, "verify_iss": verify_iss},
            }
            if verify_iss and issuer:
                kwargs["issuer"] = issuer
            payload = jwt.decode(token, secret, **kwargs)
            return payload, "ok"
        except jwt.ExpiredSignatureError:
            return None, "expired_token"
        except jwt.PyJWTError:
            last_reason = "invalid_token"
    return None, last_reason


def _decode_with_jwks(
    token: str,
    issuer: Optional[str],
    decode_options: dict[str, Any],
) -> tuple[Optional[dict[str, Any]], str]:
    base_url = supabase_url()
    if not base_url:
        return None, "jwt_secret_missing"

    try:
        from jwt import PyJWKClient

        jwk_client = PyJWKClient(f"{base_url}/auth/v1/.well-known/jwks.json", cache_keys=True)
        signing_key = jwk_client.get_signing_key_from_jwt(token)
    except jwt.PyJWTError:
        return None, "invalid_token"
    except ImportError:
        logger.error("cryptography package missing — cannot verify Supabase ES256 JWTs")
        return None, "invalid_token"
    except Exception:
        logger.debug("JWKS client error", exc_info=True)
        return None, "invalid_token"

    attempts = [False, True] if issuer else [False]
    last_reason = "invalid_token"
    for verify_iss in attempts:
        try:
            kwargs: dict[str, Any] = {
                "algorithms": ["RS256", "ES256", "EdDSA"],
                "audience": "authenticated",
                "leeway": 30,
                "options": {**decode_options, "verify_iss": verify_iss},
            }
            if verify_iss and issuer:
                kwargs["issuer"] = issuer
            payload = jwt.decode(token, signing_key.key, **kwargs)
            return payload, "ok"
        except jwt.ExpiredSignatureError:
            return None, "expired_token"
        except jwt.PyJWTError:
            last_reason = "invalid_token"
    return None, last_reason


def log_auth_rejection(*, header_present: bool, reason: str, decode_attempted: bool | None = None) -> None:
    from app.config import jwt_verification_configured

    attempted = (
        decode_attempted
        if decode_attempted is not None
        else jwt_verification_configured() and header_present
    )
    logger.warning(
        "Auth rejected header_present=%s decode_attempted=%s reason=%s",
        header_present,
        attempted,
        reason,
    )


def resolve_user_with_reason(token: Optional[str]) -> tuple[Optional[dict[str, Any]], str]:
    if not token:
        return None, "missing_header"
    token = token.strip()

    state = read_state()
    if token in state.get("revoked_tokens", []):
        return None, "invalid_token"

    if jwt_verification_configured():
        payload, reason = _decode_supabase_jwt(token)
        if not payload:
            return None, reason
        user_id = str(payload.get("sub") or "").strip()
        if not user_id:
            return None, "invalid_token"
        email = payload.get("email")
        user = _finalize_supabase_user(user_id, email)
        return user, "ok"

    if is_mock_auth_enabled():
        if token.startswith("dev-user-"):
            user_id = token.replace("dev-", "", 1)
            return (
                {"userId": user_id, "email": _mock_email_for_user(state, user_id), "mode": "mock"},
                "ok",
            )
        if token.startswith("dev-"):
            user_id = token[4:]
            return (
                {"userId": user_id, "email": _mock_email_for_user(state, user_id), "mode": "mock"},
                "ok",
            )

    if is_supabase_auth():
        return None, "jwt_secret_missing" if not jwt_verification_configured() else "invalid_token"

    return None, "invalid_token"


def _finalize_supabase_user(user_id: str, email: Any) -> dict[str, Any]:
    if is_cloud_db_configured():
        from app.user_scope import ensure_user_data

        ensure_user_data(user_id, email=str(email) if email else None)
    else:
        def ensure_bucket(state: dict[str, Any]) -> bool:
            ensure_user_bucket(state, user_id)
            return True

        mutate_state(ensure_bucket)
    logger.info("Authenticated user_id=%s via Supabase JWT", user_id)
    return {
        "userId": user_id,
        "email": email,
        "mode": "supabase",
    }


def _verify_supabase_jwt(token: str) -> Optional[dict[str, Any]]:
    payload, reason = _decode_supabase_jwt(token)
    if not payload:
        return None

    user_id = str(payload.get("sub") or "").strip()
    if not user_id:
        return None
    email = payload.get("email")
    return _finalize_supabase_user(user_id, email)


def _mock_email_for_user(state: dict[str, Any], user_id: str) -> Optional[str]:
    table = state.get("mock_auth_users", {})
    if not isinstance(table, dict):
        return None
    for email, record in table.items():
        if isinstance(record, dict) and record.get("user_id") == user_id:
            return email
    return None


def resolve_user_from_token(token: Optional[str]) -> Optional[dict[str, Any]]:
    user, _reason = resolve_user_with_reason(token)
    return user
