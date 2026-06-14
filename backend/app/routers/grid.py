from fastapi import APIRouter, Depends

from app.deps import get_current_user
from app.schemas import GridMapObject, GridPlaceRequest
from app.services import grid_service

router = APIRouter(prefix="/api/grid", tags=["grid"])


@router.get("", response_model=GridMapObject)
def get_grid(current_user: dict = Depends(get_current_user)) -> GridMapObject:
    return grid_service.get_grid(current_user["userId"])


@router.post("/place", response_model=GridMapObject)
def place(body: GridPlaceRequest, current_user: dict = Depends(get_current_user)) -> GridMapObject:
    return grid_service.place_on_grid(current_user["userId"], body)


@router.delete("/cells/{x}/{y}", response_model=GridMapObject)
def remove_cell(x: int, y: int, current_user: dict = Depends(get_current_user)) -> GridMapObject:
    return grid_service.remove_cell(current_user["userId"], x, y)
