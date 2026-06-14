from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Header
from pydantic import BaseModel, Field

from app.services import auth_service

router = APIRouter(prefix="/api/auth", tags=["auth"])


class AuthCredentials(BaseModel):
    email: str = Field(..., min_length=3)
    password: str = Field(..., min_length=1)


@router.post("/register")
def register(payload: AuthCredentials):
    return auth_service.register(payload.email, payload.password)


@router.post("/login")
def login(payload: AuthCredentials):
    return auth_service.login(payload.email, payload.password)


@router.post("/logout")
def logout():
    # Stateless JWT / dev token — client clears local session.
    return {"ok": True}


@router.get("/me")
def me(authorization: Optional[str] = Header(default=None)):
    token = None
    if authorization and authorization.lower().startswith("bearer "):
        token = authorization[7:].strip()
    user = auth_service.resolve_user_from_token(token)
    if not user:
        return {"authenticated": False}
    return {"authenticated": True, **user}
