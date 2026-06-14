from fastapi import APIRouter, Depends

from app.deps import get_current_user
from app.schemas import InventoryObject
from app.services import reward_service, user_service

router = APIRouter(prefix="/api/inventory", tags=["inventory"])


@router.get("", response_model=InventoryObject)
def get_inventory(current_user: dict = Depends(get_current_user)) -> InventoryObject:
    user_id = current_user["userId"]
    inv = user_service.get_inventory(user_id)
    inv["level"] = reward_service.compute_level(int(inv.get("total_xp", 0)))
    return InventoryObject.model_validate(inv)
