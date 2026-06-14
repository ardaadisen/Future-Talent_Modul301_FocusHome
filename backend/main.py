"""Uvicorn entrypoint: ``uvicorn main:app`` from the ``backend/`` directory."""

import logging

logging.basicConfig(level=logging.INFO)

from app.config import backend_env_file  # noqa: E402 — loads backend/.env
from app.main import app  # noqa: E402
from app.services.ai_service import log_ai_startup_config  # noqa: E402

log_ai_startup_config()

__all__ = ["app"]
