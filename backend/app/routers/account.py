from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, Header

from app.deps import get_bearer_token, get_current_user
from app.services import account_service

router = APIRouter(prefix="/api/account", tags=["account"])


@router.delete("")
def delete_account(
    current_user: dict = Depends(get_current_user),
    authorization: Optional[str] = Header(default=None),
):
    """
    Permanently delete the authenticated user's account and user-scoped data.
    Requires Authorization: Bearer <token>.
    """
    user_id = current_user["userId"]
    email = current_user.get("email")
    token = get_bearer_token(authorization)
    result = account_service.delete_user_account(user_id, email=email, token=token)
    return {
        "ok": True,
        "detail": "Account and user data deleted.",
        **result,
    }
