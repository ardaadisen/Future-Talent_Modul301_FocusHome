"""Helpers for per-user data buckets — JSON file or Postgres when DATABASE_URL is set."""

from __future__ import annotations

from typing import Any, Callable, TypeVar

from app.database import is_cloud_db_configured
from app.storage import mutate_state, read_state
from app.user_data import ensure_user_bucket

T = TypeVar("T")


def read_user_bucket(user_id: str) -> dict[str, Any]:
    if is_cloud_db_configured():
        from app.repositories.cloud_store import load_user_bucket

        return load_user_bucket(user_id)
    state = read_state()
    return ensure_user_bucket(state, user_id)


def mutate_user_bucket(user_id: str, mutator: Callable[[dict[str, Any]], T]) -> T:
    if is_cloud_db_configured():
        from app.repositories.cloud_store import mutate_user_bucket_pg

        return mutate_user_bucket_pg(user_id, mutator)

    def state_mutator(state: dict[str, Any]) -> T:
        bucket = ensure_user_bucket(state, user_id)
        return mutator(bucket)

    return mutate_state(state_mutator)


def ensure_user_data(user_id: str, email: str | None = None) -> None:
    """Ensure default rows exist for a signed-in user."""
    if is_cloud_db_configured():
        from app.repositories.cloud_store import ensure_cloud_user

        ensure_cloud_user(user_id, email=email)
        return

    def mutator(state: dict[str, Any]) -> bool:
        ensure_user_bucket(state, user_id)
        return True

    mutate_state(mutator)


def task_belongs_to_user(task: dict[str, Any], user_id: str) -> bool:
    owner = task.get("user_id")
    if owner is None:
        return True
    return owner == user_id
