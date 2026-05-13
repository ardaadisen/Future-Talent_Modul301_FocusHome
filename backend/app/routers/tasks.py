from fastapi import APIRouter

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
def create_manual(body: ManualTaskCreate) -> TaskObject:
    return task_service.create_manual(body)


@router.post("/from-ai", response_model=TaskObject)
def create_from_ai(body: TaskFromAIRequest) -> TaskObject:
    return task_service.create_from_ai(body)


@router.get("", response_model=list[TaskObject])
def list_tasks() -> list[TaskObject]:
    return task_service.list_tasks()


@router.get("/{task_id}", response_model=TaskObject)
def get_task(task_id: str) -> TaskObject:
    return task_service.get_task(task_id)


@router.patch("/{task_id}/start", response_model=TaskObject)
def start_task(task_id: str) -> TaskObject:
    return task_service.start_task(task_id)


@router.patch("/{task_id}/complete", response_model=TaskCompleteResponse)
def complete_task(task_id: str) -> TaskCompleteResponse:
    return task_service.complete_task(task_id)


@router.patch("/{task_id}/abandon", response_model=TaskObject)
def abandon_task(task_id: str) -> TaskObject:
    return task_service.abandon_task(task_id)


@router.delete("/{task_id}", response_model=DeleteSuccessResponse)
def delete_task(task_id: str) -> DeleteSuccessResponse:
    task_service.delete_task(task_id)
    return DeleteSuccessResponse(success=True, detail="deleted")
