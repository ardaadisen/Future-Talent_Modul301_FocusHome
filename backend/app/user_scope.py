"""Helpers for per-user data buckets inside JSON state."""

from __future__ import annotations

from typing import Any, Callable, TypeVar

from app.storage import mutate_state, read_state
from app.user_data import ensure_user_bucket

T = TypeVar("T")


def read_user_bucket(user_id: str) -> dict[str, Any]:
    state = read_state()
    return ensure_user_bucket(state, user_id)


def mutate_user_bucket(user_id: str, mutator: Callable[[dict[str, Any]], T]) -> T:
    def state_mutator(state: dict[str, Any]) -> T:
        bucket = ensure_user_bucket(state, user_id)
        return mutator(bucket)

    return mutate_state(state_mutator)


def task_belongs_to_user(task: dict[str, Any], user_id: str) -> bool:
    owner = task.get("user_id")
    if owner is None:
        return True
    return owner == user_id
