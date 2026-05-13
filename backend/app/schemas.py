from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Any, Optional

from pydantic import BaseModel, Field, field_validator


class Difficulty(str, Enum):
    EASY = "EASY"
    MEDIUM = "MEDIUM"
    HARD = "HARD"


class TaskStatus(str, Enum):
    PENDING = "PENDING"
    ACTIVE = "ACTIVE"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    ABANDONED = "ABANDONED"


class TaskSource(str, Enum):
    MANUAL = "MANUAL"
    AI = "AI"


class PresetDuration(int, Enum):
    M15 = 15
    M30 = 30
    M45 = 45
    M60 = 60


# --- AI parse ---


class ParseTaskRequest(BaseModel):
    text: str = Field(..., min_length=1)
    timezone: str = "Europe/Istanbul"


class AIParsedTaskObject(BaseModel):
    title: str
    startDateTime: datetime
    endDateTime: datetime
    durationMinutes: int
    difficulty: Difficulty
    description: str
    confidence: float = Field(..., ge=0.0, le=1.0)
    calendarEligible: bool
    calendarUrl: Optional[str] = None


# --- Tasks ---


class ManualTaskCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=50)
    preset_duration: PresetDuration
    difficulty_level: Difficulty
    description: Optional[str] = None
    scheduled_start_at: Optional[datetime] = None
    scheduled_end_at: Optional[datetime] = None
    calendar_url: Optional[str] = None


class TaskFromAIRequest(BaseModel):
    """User-confirmed AI suggestion saved as a real task."""

    title: str = Field(..., min_length=1, max_length=50)
    startDateTime: datetime
    endDateTime: datetime
    durationMinutes: int
    difficulty: Difficulty
    description: str = ""
    calendarUrl: Optional[str] = None


class TaskObject(BaseModel):
    id: str
    title: str = Field(..., max_length=50)
    preset_duration: int
    actual_duration_seconds: int = 0
    difficulty_level: Difficulty
    status: TaskStatus
    created_at: datetime
    completed_at: Optional[datetime] = None
    source: TaskSource
    calendar_url: Optional[str] = None
    scheduled_start_at: Optional[datetime] = None
    scheduled_end_at: Optional[datetime] = None
    description: Optional[str] = None
    reward_claimed: bool = False

    @field_validator("preset_duration")
    @classmethod
    def preset_must_be_allowed(cls, v: int) -> int:
        if v not in (15, 30, 45, 60):
            raise ValueError("preset_duration must be 15, 30, 45, or 60")
        return v


# --- Inventory ---


class ResourceBundle(BaseModel):
    bricks: int = 0
    glass: int = 0
    roof_tiles: int = 0


class InventoryObject(BaseModel):
    total_xp: int = 0
    level: int = 0
    resources: ResourceBundle = Field(default_factory=ResourceBundle)
    unlocked_assets: list[str] = Field(default_factory=list)


class TaskCompleteResponse(BaseModel):
    task: TaskObject
    inventory: InventoryObject


# --- Grid ---


class GridCell(BaseModel):
    x: int = Field(..., ge=0, le=4)
    y: int = Field(..., ge=0, le=4)
    asset_id: str
    rotation: int = 0
    placed_at: datetime


class GridMapObject(BaseModel):
    grid_id: str = "main_home"
    size: int = 5
    cells: list[GridCell] = Field(default_factory=list)


class ResourceCost(BaseModel):
    bricks: int = 0
    glass: int = 0
    roof_tiles: int = 0

    @field_validator("bricks", "glass", "roof_tiles")
    @classmethod
    def non_negative(cls, v: int) -> int:
        if v < 0:
            raise ValueError("resource cost cannot be negative")
        return v


class GridPlaceRequest(BaseModel):
    x: int = Field(..., ge=0, le=4)
    y: int = Field(..., ge=0, le=4)
    asset_id: str = Field(..., min_length=1)
    rotation: int = 0
    resource_cost: Optional[ResourceCost] = None


# --- Calendar ---


class CalendarTemplateRequest(BaseModel):
    title: str
    startDateTime: datetime
    endDateTime: datetime
    description: str = ""


class CalendarTemplateResponse(BaseModel):
    calendarUrl: str


class DeleteSuccessResponse(BaseModel):
    success: bool = True
    detail: str = "deleted"


class MessageResponse(BaseModel):
    message: str


class HealthResponse(BaseModel):
    status: str
    service: str


class MainApiResponse(BaseModel):
    app: str
    version: str
    message: str


def task_from_state(data: dict[str, Any]) -> TaskObject:
    return TaskObject.model_validate(data)


def inventory_from_state(data: dict[str, Any]) -> InventoryObject:
    return InventoryObject.model_validate(data)


def grid_from_state(data: dict[str, Any]) -> GridMapObject:
    return GridMapObject.model_validate(data)
