from fastapi import APIRouter

from app.schemas import InventoryObject
from app.services import reward_service
from app.storage import read_state

router = APIRouter(prefix="/api/inventory", tags=["inventory"])


@router.get("", response_model=InventoryObject)
def get_inventory() -> InventoryObject:
    state = read_state()
    inv = dict(state["inventory"])
    inv["level"] = reward_service.compute_level(int(inv.get("total_xp", 0)))
    return InventoryObject.model_validate(inv)
