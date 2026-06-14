import logging
import os

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import is_development
from app.errors import AppError
from app.routers import account, ai, auth, calendar, grid, health, inventory, tasks, user

logger = logging.getLogger("focushome.api")


def _cors_origins() -> list[str]:
    raw = os.getenv(
        "CORS_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000,http://127.0.0.1:3000",
    )
    return [x.strip() for x in raw.split(",") if x.strip()]


def create_app() -> FastAPI:
    app = FastAPI(title="FocusHome Backend", version="0.1.0")

    @app.exception_handler(AppError)
    async def app_error_handler(_: Request, exc: AppError) -> JSONResponse:
        return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
        user_id = request.headers.get("x-debug-user-id")
        logger.exception(
            "Unhandled error endpoint=%s method=%s user_id=%s error=%s: %s",
            request.url.path,
            request.method,
            user_id or "unknown",
            type(exc).__name__,
            exc,
        )
        if is_development():
            detail = f"{type(exc).__name__}: {exc}"
        else:
            detail = "We couldn't complete that request. Please try again."
        return JSONResponse(status_code=500, content={"detail": detail})

    app.add_middleware(
        CORSMiddleware,
        allow_origins=_cors_origins(),
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(health.router)
    app.include_router(auth.router)
    app.include_router(account.router)
    app.include_router(ai.router)
    app.include_router(tasks.router)
    app.include_router(inventory.router)
    app.include_router(calendar.router)
    app.include_router(grid.router)
    app.include_router(user.router)

    return app


app = create_app()
