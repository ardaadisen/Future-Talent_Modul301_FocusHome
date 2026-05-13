from fastapi import APIRouter

from app.schemas import GridMapObject, GridPlaceRequest
from app.services import grid_service

router = APIRouter(prefix="/api/grid", tags=["grid"])


@router.get("", response_model=GridMapObject)
def get_grid() -> GridMapObject:
    return grid_service.get_grid()


@router.post("/place", response_model=GridMapObject)
def place(body: GridPlaceRequest) -> GridMapObject:
    return grid_service.place_on_grid(body)


@router.delete("/cells/{x}/{y}", response_model=GridMapObject)
def remove_cell(x: int, y: int) -> GridMapObject:
    return grid_service.remove_cell(x, y)
