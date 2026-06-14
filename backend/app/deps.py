from __future__ import annotations

from typing import Optional

from fastapi import Header

from app.errors import AppError
from app.services import auth_service


def get_bearer_token(authorization: Optional[str] = Header(default=None)) -> Optional[str]:
    if authorization and authorization.lower().startswith("bearer "):
        return authorization[7:].strip()
    return None


def get_current_user(authorization: Optional[str] = Header(default=None)) -> dict:
    token = get_bearer_token(authorization)
    user, reason = auth_service.resolve_user_with_reason(token)
    if not user:
        auth_service.log_auth_rejection(
            header_present=bool(token),
            reason=reason,
        )
        raise AppError(401, "Not authenticated.")
    return user
