from typing import Any, Optional

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field

from app.deps import get_current_user
from app.services import user_service

router = APIRouter(prefix="/api/user", tags=["user"])


class UserStateUpdate(BaseModel):
    profile: Optional[dict[str, Any]] = None
    preferences: Optional[dict[str, Any]] = None
    activeHome: Optional[Any] = None
    completedHomes: Optional[list[Any]] = None
    unlockedItems: Optional[list[Any]] = None
    decorationPlacements: Optional[list[Any]] = None
    activityHistory: Optional[list[Any]] = None
    inventory: Optional[dict[str, Any]] = None
    grid: Optional[dict[str, Any]] = None
    tasks: Optional[list[Any]] = None


@router.get("/state")
def get_user_state(current_user: dict = Depends(get_current_user)) -> dict[str, Any]:
    return user_service.get_user_state(current_user["userId"])


@router.put("/state")
def update_user_state(
    body: UserStateUpdate,
    current_user: dict = Depends(get_current_user),
) -> dict[str, Any]:
    payload = body.model_dump(exclude_unset=True)
    return user_service.update_user_state(current_user["userId"], payload)
