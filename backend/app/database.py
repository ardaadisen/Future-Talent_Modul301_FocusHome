"""Database connection placeholder for Supabase Postgres.

TODO: When DATABASE_URL is set, use asyncpg or SQLAlchemy for per-user persistence.
User-owned data (tasks, inventory, homes, decorations) must be stored with user_id.
"""

from __future__ import annotations

import os
from typing import Optional


def get_database_url() -> Optional[str]:
    return (os.getenv("DATABASE_URL") or "").strip() or None


def is_cloud_db_configured() -> bool:
    return get_database_url() is not None
