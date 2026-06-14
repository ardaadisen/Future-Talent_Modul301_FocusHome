"""Initialize Postgres schema for FocusHome cloud persistence."""

from __future__ import annotations

import sys
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_DIR))

from app.config import backend_env_file  # noqa: E402 — loads .env
from app.database import get_database_url, is_cloud_db_configured
from app.db.connection import db_connection


def main() -> int:
    env_path = backend_env_file()
    print(f"Env file: {env_path} (exists={env_path.is_file()})")

    if not is_cloud_db_configured():
        print("ERROR: DATABASE_URL is not set. Add it to backend/.env and retry.")
        return 1

    url = get_database_url() or ""
    print(f"DATABASE_URL present: True (host redacted)")

    schema_path = BACKEND_DIR / "app" / "db" / "schema.sql"
    sql = schema_path.read_text(encoding="utf-8")

    with db_connection() as conn:
        for statement in sql.split(";"):
            stmt = statement.strip()
            if stmt:
                conn.execute(stmt)

    print("Database schema applied successfully.")
    print("Tables: user_profiles, tasks, inventories, active_homes, completed_homes, preferences, activity_events")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
