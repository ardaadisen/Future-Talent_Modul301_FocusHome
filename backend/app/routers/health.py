from fastapi import APIRouter

from app.config import auth_mode
from app.database import is_cloud_db_configured
from app.schemas import HealthResponse, MainApiResponse, MessageResponse

router = APIRouter(tags=["meta"])


@router.get("/", response_model=MessageResponse)
def root() -> MessageResponse:
    return MessageResponse(message="Welcome to FocusHome backend.")


@router.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(status="ok", service="focushome-backend")


@router.get("/api/main", response_model=MainApiResponse)
def api_main() -> MainApiResponse:
    return MainApiResponse(
        app="FocusHome",
        version="0.1.0",
        message="FocusHome backend is running.",
        authMode=auth_mode(),
        cloudDbConfigured=is_cloud_db_configured(),
        userSyncAvailable=True,
    )
