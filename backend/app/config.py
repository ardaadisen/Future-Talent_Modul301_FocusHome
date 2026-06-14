"""Runtime configuration from environment variables."""

from __future__ import annotations

import logging
import os
from pathlib import Path

from dotenv import load_dotenv

from app.database import get_database_url

logger = logging.getLogger("focushome.config")

_BACKEND_DIR = Path(__file__).resolve().parents[1]
_ENV_FILE = _BACKEND_DIR / ".env"
load_dotenv(_ENV_FILE)


def backend_env_file() -> Path:
    return _ENV_FILE


def app_env() -> str:
    return (os.getenv("APP_ENV") or "development").strip().lower()


def auth_mode() -> str:
    raw = (os.getenv("AUTH_MODE") or "local").strip().lower()
    return raw if raw in ("supabase", "mock", "local") else "local"


def is_local_auth_mode() -> bool:
    """Local/offline-first — game APIs optional without auth when AUTH_MODE=local."""
    return auth_mode() == "local"


def is_development() -> bool:
    return app_env() == "development"


def is_mock_auth_enabled() -> bool:
    """Mock auth is allowed only in development with AUTH_MODE=mock."""
    return auth_mode() == "mock" and is_development()


def is_supabase_auth() -> bool:
    return auth_mode() == "supabase"


def supabase_url() -> str:
    return (os.getenv("SUPABASE_URL") or "").strip().rstrip("/")


def supabase_service_role_key() -> str:
    return (os.getenv("SUPABASE_SERVICE_ROLE_KEY") or "").strip()


def supabase_jwt_secret() -> str:
    return (os.getenv("SUPABASE_JWT_SECRET") or "").strip()


def supabase_configured() -> bool:
    return bool(supabase_url() and supabase_service_role_key())


def jwt_verification_configured() -> bool:
    return bool(supabase_jwt_secret()) or bool(supabase_url())


def log_auth_startup_config() -> None:
    """Log auth-related env presence only — never secret values."""
    logger.info("Loading env from: %s (exists=%s)", _ENV_FILE, _ENV_FILE.is_file())
    logger.info("AUTH_MODE=%s", auth_mode())
    logger.info("SUPABASE_URL present: %s", bool(supabase_url()))
    logger.info("SUPABASE_SERVICE_ROLE_KEY present: %s", bool(supabase_service_role_key()))
    logger.info("SUPABASE_JWT_SECRET present: %s", bool(supabase_jwt_secret()))
    logger.info("DATABASE_URL present: %s", bool(get_database_url()))
    try:
        import cryptography  # noqa: F401

        logger.info("cryptography present: True (required for Supabase ES256 JWT)")
    except ImportError:
        logger.warning(
            "cryptography present: False — install with `pip install cryptography` for Supabase ES256 tokens"
        )
