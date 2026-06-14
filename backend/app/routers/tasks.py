from typing import Any, Optional

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field

from app.deps import get_current_user
from app.schemas import (
    DeleteSuccessResponse,
    ManualTaskCreate,
    TaskCompleteResponse,
    TaskFromAIRequest,
    TaskObject,
)
from app.services import task_service

router = APIRouter(prefix="/api/tasks", tags=["tasks"])


@router.post("/manual", response_model=TaskObject)
def create_manual(body: ManualTaskCreate, current_user: dict = Depends(get_current_user)) -> TaskObject:
    return task_service.create_manual(current_user["userId"], body)


@router.post("/from-ai", response_model=TaskObject)
def create_from_ai(body: TaskFromAIRequest, current_user: dict = Depends(get_current_user)) -> TaskObject:
    return task_service.create_from_ai(current_user["userId"], body)


@router.get("", response_model=list[TaskObject])
def list_tasks(current_user: dict = Depends(get_current_user)) -> list[TaskObject]:
    return task_service.list_tasks(current_user["userId"])


@router.get("/{task_id}", response_model=TaskObject)
def get_task(task_id: str, current_user: dict = Depends(get_current_user)) -> TaskObject:
    return task_service.get_task(current_user["userId"], task_id)


@router.patch("/{task_id}/start", response_model=TaskObject)
def start_task(task_id: str, current_user: dict = Depends(get_current_user)) -> TaskObject:
    return task_service.start_task(current_user["userId"], task_id)


@router.patch("/{task_id}/complete", response_model=TaskCompleteResponse)
def complete_task(task_id: str, current_user: dict = Depends(get_current_user)) -> TaskCompleteResponse:
    return task_service.complete_task(current_user["userId"], task_id)


@router.patch("/{task_id}/abandon", response_model=TaskObject)
def abandon_task(task_id: str, current_user: dict = Depends(get_current_user)) -> TaskObject:
    return task_service.abandon_task(current_user["userId"], task_id)


@router.delete("/{task_id}", response_model=DeleteSuccessResponse)
def delete_task(task_id: str, current_user: dict = Depends(get_current_user)) -> DeleteSuccessResponse:
    task_service.delete_task(current_user["userId"], task_id)
    return DeleteSuccessResponse(success=True, detail="deleted")
