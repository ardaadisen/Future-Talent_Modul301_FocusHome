"""XP / bricks rewards and level calculation."""

from __future__ import annotations

import math
from typing import Any

from app.schemas import Difficulty

_REWARDS: dict[str, dict[str, int]] = {
    Difficulty.EASY.value: {"bricks": 2, "xp": 20},
    Difficulty.MEDIUM.value: {"bricks": 5, "xp": 50},
    Difficulty.HARD.value: {"bricks": 10, "xp": 100},
}


def compute_level(total_xp: int) -> int:
    if total_xp < 0:
        total_xp = 0
    return int(math.floor(math.sqrt(total_xp / 100)))


def apply_completion_reward(inventory: dict[str, Any], difficulty: str) -> None:
    """Mutates inventory dict in place (bricks + XP + level)."""
    key = difficulty.upper()
    pack = _REWARDS.get(key)
    if not pack:
        return
    inv_res = inventory.setdefault("resources", {"bricks": 0, "glass": 0, "roof_tiles": 0})
    inv_res["bricks"] = int(inv_res.get("bricks", 0)) + int(pack["bricks"])
    inventory["total_xp"] = int(inventory.get("total_xp", 0)) + int(pack["xp"])
    inventory["level"] = compute_level(int(inventory["total_xp"]))
