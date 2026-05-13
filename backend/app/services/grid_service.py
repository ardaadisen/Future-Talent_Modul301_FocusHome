"""5x5 home grid placement rules."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Optional

from app.errors import AppError
from app.schemas import GridMapObject, GridPlaceRequest
from app.storage import mutate_state, read_state


def _cell_index(cells: list[dict[str, Any]], x: int, y: int) -> int:
    for i, c in enumerate(cells):
        if int(c.get("x", -1)) == x and int(c.get("y", -1)) == y:
            return i
    return -1


def get_grid() -> GridMapObject:
    state = read_state()
    return GridMapObject.model_validate(state.get("grid", {}))


def place_on_grid(payload: GridPlaceRequest) -> GridMapObject:
    def mutator(state: dict[str, Any]) -> GridMapObject:
        grid = state.setdefault("grid", {"grid_id": "main_home", "size": 5, "cells": []})
        cells: list[dict[str, Any]] = grid.setdefault("cells", [])
        inv = state.setdefault("inventory", {})
        res = inv.setdefault("resources", {"bricks": 0, "glass": 0, "roof_tiles": 0})

        if _cell_index(cells, payload.x, payload.y) >= 0:
            raise AppError(409, "Cell already occupied")

        if payload.resource_cost is not None:
            rc = payload.resource_cost
            for key in ("bricks", "glass", "roof_tiles"):
                need = int(getattr(rc, key))
                have = int(res.get(key, 0))
                if have < need:
                    raise AppError(400, f"Not enough {key}")

        if payload.resource_cost is not None:
            rc = payload.resource_cost
            res["bricks"] = int(res.get("bricks", 0)) - int(rc.bricks)
            res["glass"] = int(res.get("glass", 0)) - int(rc.glass)
            res["roof_tiles"] = int(res.get("roof_tiles", 0)) - int(rc.roof_tiles)

        placed_at = datetime.now(timezone.utc).isoformat()
        cells.append(
            {
                "x": payload.x,
                "y": payload.y,
                "asset_id": payload.asset_id,
                "rotation": int(payload.rotation),
                "placed_at": placed_at,
            }
        )
        return GridMapObject.model_validate(grid)

    return mutate_state(mutator)


def remove_cell(x: int, y: int) -> GridMapObject:
    if x < 0 or x > 4 or y < 0 or y > 4:
        raise AppError(400, "Coordinates out of range")

    def mutator(state: dict[str, Any]) -> GridMapObject:
        grid = state.setdefault("grid", {"grid_id": "main_home", "size": 5, "cells": []})
        cells: list[dict[str, Any]] = grid.setdefault("cells", [])
        idx = _cell_index(cells, x, y)
        if idx < 0:
            raise AppError(404, "No placement at this cell")
        cells.pop(idx)
        return GridMapObject.model_validate(grid)

    return mutate_state(mutator)
