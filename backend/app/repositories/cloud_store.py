"""Postgres persistence — maps user buckets to Supabase/Postgres tables."""

from __future__ import annotations

import logging
import uuid
from datetime import datetime, timezone
from typing import Any, Callable, Optional, TypeVar

from psycopg.types.json import Jsonb

from app.db.connection import db_connection
from app.user_data import default_user_bucket

logger = logging.getLogger("focushome.cloud_store")

T = TypeVar("T")

PRESET_MINUTES = (15, 30, 45, 60)


def _jsonb_object(value: Any) -> Jsonb:
    if isinstance(value, Jsonb):
        return value
    return Jsonb(value if isinstance(value, dict) else {})


def _jsonb_list(value: Any) -> Jsonb:
    if isinstance(value, Jsonb):
        return value
    return Jsonb(value if isinstance(value, list) else [])


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _parse_ts(value: Any) -> Optional[datetime]:
    if value is None:
        return None
    if isinstance(value, datetime):
        return value
    try:
        return datetime.fromisoformat(str(value).replace("Z", "+00:00"))
    except ValueError:
        return None


def _preset_from_seconds(seconds: int) -> int:
    minutes = max(1, int(round(seconds / 60)))
    return min(PRESET_MINUTES, key=lambda p: abs(p - minutes))


def _task_row_to_bucket(row: dict[str, Any], user_id: str) -> dict[str, Any]:
    duration = int(row.get("duration_seconds") or 1800)
    return {
        "id": row["id"],
        "user_id": user_id,
        "title": row["title"],
        "preset_duration": _preset_from_seconds(duration),
        "actual_duration_seconds": int(row.get("actual_duration_seconds") or 0),
        "difficulty_level": row["difficulty"],
        "status": row["status"],
        "created_at": (row.get("created_at") or _now()).isoformat(),
        "completed_at": row["completed_at"].isoformat() if row.get("completed_at") else None,
        "source": row.get("source") or "MANUAL",
        "calendar_url": row.get("calendar_url"),
        "scheduled_start_at": row["scheduled_start"].isoformat() if row.get("scheduled_start") else None,
        "scheduled_end_at": row["scheduled_end"].isoformat() if row.get("scheduled_end") else None,
        "description": row.get("description"),
        "reward_claimed": bool(row.get("reward_claimed")),
    }


def _task_bucket_to_row(task: dict[str, Any], user_id: str) -> dict[str, Any]:
    preset = int(task.get("preset_duration") or 0)
    if not preset and task.get("durationMinutes"):
        preset = int(task["durationMinutes"])
    if not preset and task.get("duration_seconds"):
        preset = _preset_from_seconds(int(task["duration_seconds"]))
    if preset not in PRESET_MINUTES:
        preset = _preset_from_seconds(preset * 60)
    duration_seconds = preset * 60
    difficulty = (
        task.get("difficulty_level")
        or task.get("difficulty")
        or "MEDIUM"
    )
    return {
        "id": str(task.get("id") or uuid.uuid4()),
        "user_id": user_id,
        "title": (task.get("title") or "Focus Session")[:50],
        "description": task.get("description"),
        "difficulty": str(difficulty).upper(),
        "duration_seconds": duration_seconds,
        "status": str(task.get("status") or "PENDING").upper(),
        "source": task.get("source") or "MANUAL",
        "scheduled_start": _parse_ts(task.get("scheduled_start_at") or task.get("scheduled_start")),
        "scheduled_end": _parse_ts(task.get("scheduled_end_at") or task.get("scheduled_end")),
        "reward_claimed": bool(task.get("reward_claimed")),
        "actual_duration_seconds": int(task.get("actual_duration_seconds") or 0),
        "calendar_url": task.get("calendar_url"),
        "created_at": _parse_ts(task.get("created_at")) or _now(),
        "updated_at": _now(),
        "completed_at": _parse_ts(task.get("completed_at")),
    }


def ensure_cloud_user(user_id: str, email: Optional[str] = None) -> None:
    """Create default profile, inventory, preferences, and active home rows."""
    with db_connection() as conn:
        conn.execute(
            """
            INSERT INTO user_profiles (user_id, email, display_name)
            VALUES (%s, %s, %s)
            ON CONFLICT (user_id) DO UPDATE SET
                email = COALESCE(EXCLUDED.email, user_profiles.email),
                updated_at = NOW()
            """,
            (user_id, email, "FocusHome User"),
        )
        conn.execute(
            """
            INSERT INTO inventories (user_id) VALUES (%s)
            ON CONFLICT (user_id) DO NOTHING
            """,
            (user_id,),
        )
        conn.execute(
            """
            INSERT INTO preferences (user_id) VALUES (%s)
            ON CONFLICT (user_id) DO NOTHING
            """,
            (user_id,),
        )
        conn.execute(
            """
            INSERT INTO active_homes (user_id, tier) VALUES (%s, 'starter')
            ON CONFLICT (user_id) DO NOTHING
            """,
            (user_id,),
        )


def load_user_bucket(user_id: str, email: Optional[str] = None) -> dict[str, Any]:
    ensure_cloud_user(user_id, email)
    bucket = default_user_bucket(user_id)

    with db_connection() as conn:
        profile = conn.execute(
            "SELECT * FROM user_profiles WHERE user_id = %s", (user_id,)
        ).fetchone()
        if profile:
            bucket["profile"] = {
                "userId": user_id,
                "displayName": profile.get("display_name") or "FocusHome User",
                "email": profile.get("email"),
            }

        inv = conn.execute(
            "SELECT * FROM inventories WHERE user_id = %s", (user_id,)
        ).fetchone()
        if inv:
            bucket["inventory"] = {
                "total_xp": int(inv.get("xp") or 0),
                "level": int(inv.get("level") or 0),
                "resources": {
                    "bricks": int(inv.get("bricks") or 0),
                    "glass": int(inv.get("glass") or 0),
                    "roof_tiles": int(inv.get("roof_tiles") or 0),
                },
                "unlocked_assets": inv.get("unlocked_assets") or [],
            }

        prefs = conn.execute(
            "SELECT * FROM preferences WHERE user_id = %s", (user_id,)
        ).fetchone()
        if prefs:
            bucket["preferences"] = {
                "userId": user_id,
                "language": prefs.get("language") or "en",
                "theme": prefs.get("theme") or "cozy",
                "defaultFocusDurationSeconds": int(prefs.get("default_duration_seconds") or 1500),
                "calendarEnabled": bool(prefs.get("calendar_enabled")),
                "reducedMotion": bool(prefs.get("reduced_motion")),
            }

        home = conn.execute(
            "SELECT * FROM active_homes WHERE user_id = %s", (user_id,)
        ).fetchone()
        if home:
            snapshot = home.get("home_snapshot") or {}
            if snapshot:
                bucket["active_home"] = snapshot
            else:
                bucket["active_home"] = {
                    "userId": user_id,
                    "currentTier": home.get("tier") or "starter",
                    "stackProgress": int(home.get("stack_count") or 0),
                    "decorationPlacements": home.get("decoration_placements") or [],
                }
            bucket["decoration_placements"] = home.get("decoration_placements") or []
            bucket["unlocked_items"] = home.get("owned_items") or []
            cells = home.get("grid_cells") or []
            bucket["grid"] = {
                "grid_id": "main_home",
                "size": 5,
                "cells": cells,
            }

        task_rows = conn.execute(
            "SELECT * FROM tasks WHERE user_id = %s ORDER BY created_at DESC",
            (user_id,),
        ).fetchall()
        bucket["tasks"] = [_task_row_to_bucket(r, user_id) for r in task_rows]

        completed = conn.execute(
            "SELECT * FROM completed_homes WHERE user_id = %s ORDER BY completed_at DESC",
            (user_id,),
        ).fetchall()
        bucket["completed_homes"] = [
            {
                "id": r["id"],
                **(r.get("snapshot") or {}),
                "tier": r.get("tier"),
                "completedAt": r["completed_at"].isoformat() if r.get("completed_at") else None,
            }
            for r in completed
        ]

        events = conn.execute(
            "SELECT * FROM activity_events WHERE user_id = %s ORDER BY created_at DESC LIMIT 200",
            (user_id,),
        ).fetchall()
        bucket["activity_history"] = [
            {
                "id": e["id"],
                "type": e["type"],
                "payload": e.get("payload") or {},
                "createdAt": e["created_at"].isoformat() if e.get("created_at") else None,
            }
            for e in events
        ]

    return bucket


def save_user_bucket(user_id: str, bucket: dict[str, Any], email: Optional[str] = None) -> None:
    ensure_cloud_user(user_id, email)

    profile = bucket.get("profile") or {}
    prefs = bucket.get("preferences") or {}
    inv = bucket.get("inventory") or {}
    resources = inv.get("resources") or {}
    grid = bucket.get("grid") or {}
    active_home = bucket.get("active_home")
    decoration_placements = bucket.get("decoration_placements") or []
    unlocked_items = bucket.get("unlocked_items") or []

    tier = "starter"
    stack_count = 0
    home_snapshot: dict[str, Any] = {}
    if isinstance(active_home, dict):
        home_snapshot = active_home
        tier = str(active_home.get("currentTier") or active_home.get("tier") or "starter")
        stack_count = int(active_home.get("stackProgress") or active_home.get("stack_count") or 0)
        if active_home.get("decorationPlacements"):
            decoration_placements = active_home["decorationPlacements"]

    try:
        with db_connection() as conn:
            conn.execute(
                """
                INSERT INTO user_profiles (user_id, email, display_name, updated_at)
                VALUES (%s, %s, %s, NOW())
                ON CONFLICT (user_id) DO UPDATE SET
                    email = COALESCE(EXCLUDED.email, user_profiles.email),
                    display_name = COALESCE(EXCLUDED.display_name, user_profiles.display_name),
                    updated_at = NOW()
                """,
                (user_id, profile.get("email") or email, profile.get("displayName")),
            )

            conn.execute(
                """
                INSERT INTO inventories (user_id, xp, level, bricks, glass, roof_tiles, unlocked_assets, updated_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, NOW())
                ON CONFLICT (user_id) DO UPDATE SET
                    xp = EXCLUDED.xp,
                    level = EXCLUDED.level,
                    bricks = EXCLUDED.bricks,
                    glass = EXCLUDED.glass,
                    roof_tiles = EXCLUDED.roof_tiles,
                    unlocked_assets = EXCLUDED.unlocked_assets,
                    updated_at = NOW()
                """,
                (
                    user_id,
                    int(inv.get("total_xp") or 0),
                    int(inv.get("level") or 0),
                    int(resources.get("bricks") or 0),
                    int(resources.get("glass") or 0),
                    int(resources.get("roof_tiles") or 0),
                    _jsonb_list(inv.get("unlocked_assets") or []),
                ),
            )

            conn.execute(
                """
                INSERT INTO preferences (
                    user_id, language, theme, default_duration_seconds,
                    calendar_enabled, reduced_motion, updated_at
                )
                VALUES (%s, %s, %s, %s, %s, %s, NOW())
                ON CONFLICT (user_id) DO UPDATE SET
                    language = EXCLUDED.language,
                    theme = EXCLUDED.theme,
                    default_duration_seconds = EXCLUDED.default_duration_seconds,
                    calendar_enabled = EXCLUDED.calendar_enabled,
                    reduced_motion = EXCLUDED.reduced_motion,
                    updated_at = NOW()
                """,
                (
                    user_id,
                    prefs.get("language") or "en",
                    prefs.get("theme") or "cozy",
                    int(prefs.get("defaultFocusDurationSeconds") or 1500),
                    bool(prefs.get("calendarEnabled", True)),
                    bool(prefs.get("reducedMotion", False)),
                ),
            )

            conn.execute(
                """
                INSERT INTO active_homes (
                    user_id, tier, stack_count, decoration_placements,
                    owned_items, grid_cells, home_snapshot, updated_at
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, NOW())
                ON CONFLICT (user_id) DO UPDATE SET
                    tier = EXCLUDED.tier,
                    stack_count = EXCLUDED.stack_count,
                    decoration_placements = EXCLUDED.decoration_placements,
                    owned_items = EXCLUDED.owned_items,
                    grid_cells = EXCLUDED.grid_cells,
                    home_snapshot = EXCLUDED.home_snapshot,
                    updated_at = NOW()
                """,
                (
                    user_id,
                    tier,
                    stack_count,
                    _jsonb_list(decoration_placements),
                    _jsonb_list(unlocked_items),
                    _jsonb_list(grid.get("cells") or []),
                    _jsonb_object(home_snapshot),
                ),
            )

            conn.execute("DELETE FROM tasks WHERE user_id = %s", (user_id,))
            for task in bucket.get("tasks") or []:
                if not isinstance(task, dict):
                    continue
                row = _task_bucket_to_row(task, user_id)
                conn.execute(
                    """
                    INSERT INTO tasks (
                        id, user_id, title, description, difficulty, duration_seconds,
                        status, source, scheduled_start, scheduled_end, reward_claimed,
                        actual_duration_seconds, calendar_url, created_at, updated_at, completed_at
                    ) VALUES (
                        %(id)s, %(user_id)s, %(title)s, %(description)s, %(difficulty)s, %(duration_seconds)s,
                        %(status)s, %(source)s, %(scheduled_start)s, %(scheduled_end)s, %(reward_claimed)s,
                        %(actual_duration_seconds)s, %(calendar_url)s, %(created_at)s, %(updated_at)s, %(completed_at)s
                    )
                    ON CONFLICT (id) DO UPDATE SET
                        title = EXCLUDED.title,
                        description = EXCLUDED.description,
                        difficulty = EXCLUDED.difficulty,
                        duration_seconds = EXCLUDED.duration_seconds,
                        status = EXCLUDED.status,
                        source = EXCLUDED.source,
                        scheduled_start = EXCLUDED.scheduled_start,
                        scheduled_end = EXCLUDED.scheduled_end,
                        reward_claimed = EXCLUDED.reward_claimed,
                        actual_duration_seconds = EXCLUDED.actual_duration_seconds,
                        calendar_url = EXCLUDED.calendar_url,
                        updated_at = EXCLUDED.updated_at,
                        completed_at = EXCLUDED.completed_at
                    """,
                    row,
                )

            conn.execute("DELETE FROM completed_homes WHERE user_id = %s", (user_id,))
            for ch in bucket.get("completed_homes") or []:
                if not isinstance(ch, dict):
                    continue
                ch_id = ch.get("id") or str(uuid.uuid4())
                snapshot = {k: v for k, v in ch.items() if k not in ("id", "tier", "completedAt", "currentTier")}
                conn.execute(
                    """
                    INSERT INTO completed_homes (id, user_id, tier, snapshot, completed_at)
                    VALUES (%s, %s, %s, %s, %s)
                    ON CONFLICT (id) DO NOTHING
                    """,
                    (
                        ch_id,
                        user_id,
                        str(ch.get("tier") or ch.get("currentTier") or "starter"),
                        _jsonb_object(snapshot),
                        _parse_ts(ch.get("completedAt")) or _now(),
                    ),
                )

            conn.execute("DELETE FROM activity_events WHERE user_id = %s", (user_id,))
            for ev in bucket.get("activity_history") or []:
                if not isinstance(ev, dict):
                    continue
                ev_id = ev.get("id") or str(uuid.uuid4())
                conn.execute(
                    """
                    INSERT INTO activity_events (id, user_id, type, payload, created_at)
                    VALUES (%s, %s, %s, %s, %s)
                    ON CONFLICT (id) DO NOTHING
                    """,
                    (
                        ev_id,
                        user_id,
                        ev.get("type") or "event",
                        _jsonb_object(ev.get("payload") or {}),
                        _parse_ts(ev.get("createdAt")) or _now(),
                    ),
                )
    except Exception as exc:
        logger.exception(
            "save_user_bucket failed user_id=%s method=save_user_bucket error=%s: %s",
            user_id,
            type(exc).__name__,
            exc,
        )
        raise


def mutate_user_bucket_pg(
    user_id: str,
    mutator: Callable[[dict[str, Any]], T],
    email: Optional[str] = None,
) -> T:
    bucket = load_user_bucket(user_id, email=email)
    result = mutator(bucket)
    save_user_bucket(user_id, bucket, email=email)
    return result


def delete_cloud_user(user_id: str) -> bool:
    with db_connection() as conn:
        cur = conn.execute("DELETE FROM user_profiles WHERE user_id = %s", (user_id,))
        return cur.rowcount > 0
