"""User-scoped home/profile sync via JSON buckets."""

from __future__ import annotations

from typing import Any, Optional

from app.user_scope import mutate_user_bucket, read_user_bucket


def get_user_state(user_id: str) -> dict[str, Any]:
    bucket = read_user_bucket(user_id)
    return {
        "userId": user_id,
        "profile": bucket.get("profile"),
        "preferences": bucket.get("preferences"),
        "activeHome": bucket.get("active_home"),
        "completedHomes": bucket.get("completed_homes", []),
        "unlockedItems": bucket.get("unlocked_items", []),
        "decorationPlacements": bucket.get("decoration_placements", []),
        "activityHistory": bucket.get("activity_history", []),
    }


def update_user_state(user_id: str, payload: dict[str, Any]) -> dict[str, Any]:
    allowed = {
        "profile": "profile",
        "preferences": "preferences",
        "activeHome": "active_home",
        "completedHomes": "completed_homes",
        "unlockedItems": "unlocked_items",
        "decorationPlacements": "decoration_placements",
        "activityHistory": "activity_history",
        "inventory": "inventory",
        "grid": "grid",
        "tasks": "tasks",
    }

    def mutator(bucket: dict[str, Any]) -> dict[str, Any]:
        for api_key, bucket_key in allowed.items():
            if api_key in payload and payload[api_key] is not None:
                bucket[bucket_key] = payload[api_key]
        return get_user_state(user_id)

    return mutate_user_bucket(user_id, mutator)


def get_inventory(user_id: str) -> dict[str, Any]:
    bucket = read_user_bucket(user_id)
    return dict(bucket.get("inventory", {}))
