"""Account deletion — user-scoped data removal and Supabase Auth cleanup."""

from __future__ import annotations

import logging
from typing import Any, Optional

import httpx

from app.config import supabase_configured, supabase_service_role_key, supabase_url
from app.errors import AppError
from app.storage import mutate_state
from app.user_data import ensure_user_bucket

logger = logging.getLogger("focushome.account")


def ensure_user_registered(user_id: str) -> None:
    def mutator(state: dict[str, Any]) -> bool:
        ensure_user_bucket(state, user_id)
        return True

    mutate_state(mutator)


def _delete_supabase_auth_user(user_id: str) -> None:
    """Delete auth user via Supabase Admin API (service role, backend-only)."""
    if not supabase_configured():
        return

    base = supabase_url()
    key = supabase_service_role_key()
    url = f"{base}/auth/v1/admin/users/{user_id}"
    try:
        with httpx.Client(timeout=30.0) as client:
            r = client.delete(url, headers={"Authorization": f"Bearer {key}", "apikey": key})
            if r.status_code not in (200, 204, 404):
                logger.warning("Supabase user delete returned %s: %s", r.status_code, r.text)
                raise AppError(502, "Could not delete auth account. Please try again later.")
    except httpx.HTTPError as exc:
        logger.exception("Supabase user delete failed")
        raise AppError(502, "Could not delete auth account. Please try again later.") from exc


def delete_user_account(user_id: str, *, email: Optional[str] = None, token: Optional[str] = None) -> dict[str, Any]:
    """Delete only the authenticated user's data bucket and revoke token."""

    def mutator(state: dict[str, Any]) -> dict[str, Any]:
        users = state.setdefault("users", {})
        had_bucket = user_id in users
        users.pop(user_id, None)

        mock_auth = state.get("mock_auth_users", {})
        if isinstance(mock_auth, dict):
            if email:
                mock_auth.pop(email.strip().lower(), None)
            for em, rec in list(mock_auth.items()):
                if isinstance(rec, dict) and rec.get("user_id") == user_id:
                    mock_auth.pop(em, None)

        if token:
            revoked = state.setdefault("revoked_tokens", [])
            if token not in revoked:
                revoked.append(token)

        return {
            "deleted": True,
            "userId": user_id,
            "removedUserBucket": had_bucket,
        }

    result = mutate_state(mutator)

    try:
        _delete_supabase_auth_user(user_id)
    except AppError:
        raise

    logger.info("Deleted account user_id=%s bucket=%s", user_id, result.get("removedUserBucket"))
    return result
