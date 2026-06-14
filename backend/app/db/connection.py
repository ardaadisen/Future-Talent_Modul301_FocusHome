"""Postgres connection helpers (DATABASE_URL from env)."""

from __future__ import annotations

import logging
import re
from contextlib import contextmanager
from typing import Iterator

import psycopg
from psycopg.rows import dict_row

from app.database import get_database_url, is_cloud_db_configured

logger = logging.getLogger("focushome.db")


def _normalize_database_url(url: str) -> str:
    """Strip Supabase-only query params and fix bracketed hostnames for psycopg."""
    cleaned = url.strip()
    # Some Supabase examples use @[hostname]:port — psycopg rejects that form.
    cleaned = re.sub(r"@\[([^\]]+)\]", r"@\1", cleaned)
    cleaned = re.sub(r"([?&])pgbouncer=[^&]*&?", r"\1", cleaned)
    cleaned = cleaned.replace("?&", "?").rstrip("?&")
    return cleaned


def _connect() -> psycopg.Connection:
    raw = get_database_url()
    if not raw:
        raise RuntimeError("DATABASE_URL is not configured")
    url = _normalize_database_url(raw.strip())
    return psycopg.connect(url, row_factory=dict_row, autocommit=False)


@contextmanager
def db_connection() -> Iterator[psycopg.Connection]:
    conn = _connect()
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def check_db_connection() -> bool:
    if not is_cloud_db_configured():
        return False
    try:
        with db_connection() as conn:
            conn.execute("SELECT 1")
        return True
    except Exception as exc:
        logger.warning("Database connection check failed: %s", exc)
        return False
