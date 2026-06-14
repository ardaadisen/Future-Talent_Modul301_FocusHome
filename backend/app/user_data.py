"""Per-user game data buckets inside backend state."""

from __future__ import annotations

import copy
from typing import Any

from app.storage import default_state


def default_user_bucket(user_id: str) -> dict[str, Any]:
    base = default_state()
    return {
        "user_id": user_id,
        "tasks": [],
        "inventory": copy.deepcopy(base["inventory"]),
        "grid": copy.deepcopy(base["grid"]),
        "profile": {
            "userId": user_id,
            "displayName": "FocusHome User",
        },
        "preferences": {
            "userId": user_id,
            "language": "en",
            "theme": "cozy",
            "defaultFocusDurationSeconds": 1500,
            "calendarEnabled": True,
            "reducedMotion": False,
        },
        "active_home": None,
        "completed_homes": [],
        "unlocked_items": [],
        "decoration_placements": [],
        "activity_history": [],
    }


def ensure_user_bucket(state: dict[str, Any], user_id: str) -> dict[str, Any]:
    users = state.setdefault("users", {})
    if user_id not in users:
        users[user_id] = default_user_bucket(user_id)
    return users[user_id]
