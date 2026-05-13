from __future__ import annotations

import copy
import json
import threading
from pathlib import Path
from typing import Any, Callable, TypeVar

BACKEND_ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = BACKEND_ROOT / "data"
STATE_FILE = DATA_DIR / "state.json"

_lock = threading.Lock()

T = TypeVar("T")


def default_state() -> dict[str, Any]:
    return {
        "tasks": [],
        "inventory": {
            "total_xp": 0,
            "level": 0,
            "resources": {"bricks": 0, "glass": 0, "roof_tiles": 0},
            "unlocked_assets": [],
        },
        "grid": {
            "grid_id": "main_home",
            "size": 5,
            "cells": [],
        },
    }


def _merge_defaults(raw: dict[str, Any]) -> dict[str, Any]:
    base = default_state()
    if not isinstance(raw, dict):
        return base
    out = copy.deepcopy(base)
    if isinstance(raw.get("tasks"), list):
        out["tasks"] = raw["tasks"]
    inv = raw.get("inventory")
    if isinstance(inv, dict):
        for k in ("total_xp", "level"):
            if k in inv and isinstance(inv[k], int):
                out["inventory"][k] = inv[k]
        res = inv.get("resources")
        if isinstance(res, dict):
            for rk in ("bricks", "glass", "roof_tiles"):
                if rk in res and isinstance(res[rk], int):
                    out["inventory"]["resources"][rk] = res[rk]
        ua = inv.get("unlocked_assets")
        if isinstance(ua, list):
            out["inventory"]["unlocked_assets"] = [str(x) for x in ua]
    grid = raw.get("grid")
    if isinstance(grid, dict):
        if isinstance(grid.get("cells"), list):
            out["grid"]["cells"] = grid["cells"]
        if isinstance(grid.get("grid_id"), str):
            out["grid"]["grid_id"] = grid["grid_id"]
        if isinstance(grid.get("size"), int):
            out["grid"]["size"] = grid["size"]
    return out


def _load_unlocked() -> dict[str, Any]:
    if not STATE_FILE.exists():
        return default_state()
    try:
        with STATE_FILE.open(encoding="utf-8") as f:
            raw = json.load(f)
        return _merge_defaults(raw)
    except (json.JSONDecodeError, OSError, TypeError):
        return default_state()


def _save_unlocked(state: dict[str, Any]) -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    tmp = STATE_FILE.with_suffix(".json.tmp")
    with tmp.open("w", encoding="utf-8") as f:
        json.dump(state, f, indent=2, default=str)
    tmp.replace(STATE_FILE)


def mutate_state(mutator: Callable[[dict[str, Any]], T]) -> T:
    """Load state, run mutator (mutates dict in place), persist, return mutator result."""
    with _lock:
        state = _load_unlocked()
        result = mutator(state)
        _save_unlocked(state)
        return result


def read_state() -> dict[str, Any]:
    with _lock:
        return copy.deepcopy(_load_unlocked())
