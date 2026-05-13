"""Uvicorn entrypoint: ``uvicorn main:app`` from the ``backend/`` directory."""

from dotenv import load_dotenv

load_dotenv()

from app.main import app  # noqa: E402

__all__ = ["app"]
