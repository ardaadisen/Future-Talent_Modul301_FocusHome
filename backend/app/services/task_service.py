"""Task CRUD and lifecycle — scoped to authenticated user buckets."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Any

from app.errors import AppError
from app.schemas import (
    InventoryObject,
    ManualTaskCreate,
    TaskCompleteResponse,
    TaskFromAIRequest,
    TaskObject,
    TaskSource,
    TaskStatus,
)
from app.services import ai_service, reward_service
from app.user_scope import mutate_user_bucket, task_belongs_to_user


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _find_task_index(tasks: list[dict[str, Any]], task_id: str) -> int:
    for i, t in enumerate(tasks):
        if t.get("id") == task_id:
            return i
    return -1


def create_manual(user_id: str, payload: ManualTaskCreate) -> TaskObject:
    def mutator(bucket: dict[str, Any]) -> TaskObject:
        tid = str(uuid.uuid4())
        row: dict[str, Any] = {
            "id": tid,
            "user_id": user_id,
            "title": payload.title[:50],
            "preset_duration": int(payload.preset_duration),
            "actual_duration_seconds": 0,
            "difficulty_level": payload.difficulty_level.value,
            "status": TaskStatus.PENDING.value,
            "created_at": _now_iso(),
            "completed_at": None,
            "source": TaskSource.MANUAL.value,
            "calendar_url": payload.calendar_url,
            "scheduled_start_at": payload.scheduled_start_at.isoformat() if payload.scheduled_start_at else None,
            "scheduled_end_at": payload.scheduled_end_at.isoformat() if payload.scheduled_end_at else None,
            "description": payload.description,
            "reward_claimed": False,
        }
        bucket.setdefault("tasks", []).append(row)
        return TaskObject.model_validate(row)

    return mutate_user_bucket(user_id, mutator)


def create_from_ai(user_id: str, payload: TaskFromAIRequest) -> TaskObject:
    delta_seconds = max(
        int((payload.endDateTime - payload.startDateTime).total_seconds()),
        int(payload.durationMinutes) * 60,
        60,
    )
    preset = ai_service.nearest_preset_duration(max(1, int(round(delta_seconds / 60))))

    def mutator(bucket: dict[str, Any]) -> TaskObject:
        tid = str(uuid.uuid4())
        row: dict[str, Any] = {
            "id": tid,
            "user_id": user_id,
            "title": payload.title[:50],
            "preset_duration": preset,
            "actual_duration_seconds": 0,
            "difficulty_level": payload.difficulty.value,
            "status": TaskStatus.PENDING.value,
            "created_at": _now_iso(),
            "completed_at": None,
            "source": TaskSource.AI.value,
            "calendar_url": payload.calendarUrl,
            "scheduled_start_at": payload.startDateTime.isoformat(),
            "scheduled_end_at": payload.endDateTime.isoformat(),
            "description": payload.description or None,
            "reward_claimed": False,
        }
        bucket.setdefault("tasks", []).append(row)
        return TaskObject.model_validate(row)

    return mutate_user_bucket(user_id, mutator)


def list_tasks(user_id: str) -> list[TaskObject]:
    from app.user_scope import read_user_bucket

    bucket = read_user_bucket(user_id)
    return [TaskObject.model_validate(t) for t in bucket.get("tasks", [])]


def get_task(user_id: str, task_id: str) -> TaskObject:
    from app.user_scope import read_user_bucket

    bucket = read_user_bucket(user_id)
    idx = _find_task_index(bucket.get("tasks", []), task_id)
    if idx < 0:
        raise AppError(404, "Task not found")
    task = bucket["tasks"][idx]
    if not task_belongs_to_user(task, user_id):
        raise AppError(403, "Forbidden")
    return TaskObject.model_validate(task)


def start_task(user_id: str, task_id: str) -> TaskObject:
    def mutator(bucket: dict[str, Any]) -> TaskObject:
        tasks = bucket.setdefault("tasks", [])
        idx = _find_task_index(tasks, task_id)
        if idx < 0:
            raise AppError(404, "Task not found")
        t = tasks[idx]
        if not task_belongs_to_user(t, user_id):
            raise AppError(403, "Forbidden")
        if t["status"] != TaskStatus.PENDING.value:
            raise AppError(400, "Only PENDING tasks can be started")
        t["status"] = TaskStatus.ACTIVE.value
        return TaskObject.model_validate(t)

    return mutate_user_bucket(user_id, mutator)


def abandon_task(user_id: str, task_id: str) -> TaskObject:
    def mutator(bucket: dict[str, Any]) -> TaskObject:
        tasks = bucket.setdefault("tasks", [])
        idx = _find_task_index(tasks, task_id)
        if idx < 0:
            raise AppError(404, "Task not found")
        t = tasks[idx]
        if not task_belongs_to_user(t, user_id):
            raise AppError(403, "Forbidden")
        if t["status"] not in (TaskStatus.PENDING.value, TaskStatus.ACTIVE.value):
            raise AppError(400, "Only PENDING or ACTIVE tasks can be abandoned")
        t["status"] = TaskStatus.ABANDONED.value
        return TaskObject.model_validate(t)

    return mutate_user_bucket(user_id, mutator)


def complete_task(user_id: str, task_id: str) -> TaskCompleteResponse:
    def mutator(bucket: dict[str, Any]) -> TaskCompleteResponse:
        tasks = bucket.setdefault("tasks", [])
        idx = _find_task_index(tasks, task_id)
        if idx < 0:
            raise AppError(404, "Task not found")
        t = tasks[idx]
        if not task_belongs_to_user(t, user_id):
            raise AppError(403, "Forbidden")
        inv = bucket.setdefault("inventory", {})

        if t["status"] == TaskStatus.COMPLETED.value:
            return TaskCompleteResponse(
                task=TaskObject.model_validate(t),
                inventory=InventoryObject.model_validate(inv),
            )

        if t["status"] not in (TaskStatus.PENDING.value, TaskStatus.ACTIVE.value):
            raise AppError(400, "Task cannot be completed from this status")

        preset = int(t["preset_duration"])
        t["status"] = TaskStatus.COMPLETED.value
        t["completed_at"] = _now_iso()
        t["actual_duration_seconds"] = preset * 60

        if not t.get("reward_claimed"):
            reward_service.apply_completion_reward(inv, str(t["difficulty_level"]))
            t["reward_claimed"] = True

        return TaskCompleteResponse(
            task=TaskObject.model_validate(t),
            inventory=InventoryObject.model_validate(inv),
        )

    return mutate_user_bucket(user_id, mutator)


def delete_task(user_id: str, task_id: str) -> None:
    def mutator(bucket: dict[str, Any]) -> None:
        tasks = bucket.setdefault("tasks", [])
        idx = _find_task_index(tasks, task_id)
        if idx < 0:
            raise AppError(404, "Task not found")
        t = tasks[idx]
        if not task_belongs_to_user(t, user_id):
            raise AppError(403, "Forbidden")
        if t["status"] not in (TaskStatus.PENDING.value, TaskStatus.ABANDONED.value):
            raise AppError(400, "Only PENDING or ABANDONED tasks can be deleted")
        tasks.pop(idx)

    mutate_user_bucket(user_id, mutator)
