"""User-scoped home/profile sync."""

from __future__ import annotations

from typing import Any

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


def _merge_tasks(existing: list[dict[str, Any]], incoming: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Idempotent merge — skip tasks whose ids already exist (migration safety)."""
    seen = {t.get("id") for t in existing if t.get("id")}
    merged = list(existing)
    for task in incoming:
        if not isinstance(task, dict):
            continue
        tid = task.get("id")
        if tid and tid in seen:
            continue
        merged.append(task)
        if tid:
            seen.add(tid)
    return merged


def _coerce_list(value: Any) -> list[Any]:
    return value if isinstance(value, list) else []


def _normalize_sync_payload(payload: dict[str, Any]) -> dict[str, Any]:
    """Map frontend sync payload keys and tolerate missing optional sections."""
    normalized: dict[str, Any] = {}

    profile = payload.get("profile")
    if profile is None and payload.get("userProfile") is not None:
        profile = payload.get("userProfile")
    if isinstance(profile, dict):
        normalized["profile"] = profile

    preferences = payload.get("preferences")
    if preferences is None and payload.get("userPreferences") is not None:
        preferences = payload.get("userPreferences")
    if isinstance(preferences, dict):
        normalized["preferences"] = preferences

    if payload.get("activeHome") is not None:
        normalized["activeHome"] = payload["activeHome"]

    normalized["completedHomes"] = _coerce_list(payload.get("completedHomes"))
    normalized["unlockedItems"] = _coerce_list(payload.get("unlockedItems"))
    normalized["decorationPlacements"] = _coerce_list(payload.get("decorationPlacements"))

    activity = payload.get("activityHistory")
    if activity is None:
        activity = payload.get("activityEvents")
    normalized["activityHistory"] = _coerce_list(activity)

    if isinstance(payload.get("inventory"), dict):
        normalized["inventory"] = payload["inventory"]

    if isinstance(payload.get("grid"), dict):
        normalized["grid"] = payload["grid"]

    normalized["tasks"] = _coerce_list(payload.get("tasks"))

    return normalized


def update_user_state(user_id: str, payload: dict[str, Any]) -> dict[str, Any]:
    sync_payload = _normalize_sync_payload(payload)
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
            if api_key not in sync_payload:
                continue
            value = sync_payload[api_key]
            if api_key == "tasks":
                bucket["tasks"] = _merge_tasks(bucket.get("tasks") or [], value)
            elif api_key in ("completedHomes", "unlockedItems", "decorationPlacements", "activityHistory"):
                bucket[bucket_key] = _coerce_list(value)
            elif value is not None:
                bucket[bucket_key] = value
        return get_user_state(user_id)

    return mutate_user_bucket(user_id, mutator)


def get_inventory(user_id: str) -> dict[str, Any]:
    bucket = read_user_bucket(user_id)
    return dict(bucket.get("inventory", {}))
