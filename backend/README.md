# FocusHome Backend (MVP)

FastAPI service: natural-language task parsing (Gemini + Smart Parse fallback), task lifecycle, rewards, inventory, 5×5 grid, Google Calendar **template URLs** (no OAuth), Supabase JWT auth, and Postgres persistence when `DATABASE_URL` is set.

See also: [Project README](../README.md) · [Deployment guide](../docs/DEPLOYMENT.md)

## Setup

From this `backend/` directory:

```bash
python -m venv .venv
```

Windows (PowerShell):

```powershell
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
```

macOS / Linux:

```bash
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

Restart the backend after changing `.env`. Startup logs show env presence (never secret values).

## Run (development)

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Open http://127.0.0.1:8000/docs for interactive OpenAPI.

## Run (production — Render)

```bash
uvicorn main:app --host 0.0.0.0 --port $PORT
```

Set `APP_ENV=production`, `AUTH_MODE=supabase`, and all Supabase/Postgres/Gemini vars in the Render dashboard. See [docs/DEPLOYMENT.md](../docs/DEPLOYMENT.md).

## Environment variables

| Variable | Purpose |
|----------|---------|
| `AUTH_MODE` | `supabase` (production) or `mock` (dev-only when `APP_ENV=development`) |
| `APP_ENV` | `development` or `production` |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side admin key — **never expose to frontend** |
| `SUPABASE_JWT_SECRET` | JWT secret from Supabase API settings |
| `DATABASE_URL` | Supabase Postgres connection string (Session pooler recommended) |
| `AI_PROVIDER` | `gemini` (default), `openai`, or `mock` |
| `GEMINI_API_KEY` | Google Gemini API key (optional — Smart Parse fallback if missing) |
| `GEMINI_MODEL` | Default **`gemini-2.5-flash-lite`** |
| `AI_HTTP_TIMEOUT_SECONDS` | HTTP timeout for AI calls (default 15) |
| `OPENAI_API_KEY` | When `AI_PROVIDER=openai` |
| `OPENAI_MODEL` | Default `gpt-4o-mini` |
| `CORS_ORIGINS` | Comma-separated allowed browser origins (include Vercel URL in production) |

Startup logs include: `AUTH_MODE`, `SUPABASE_* present`, `DATABASE_URL present`, `GEMINI_MODEL`, `cryptography present` (required for Supabase ES256 JWT verification).

## Authentication

### Supabase (production)

1. Frontend uses Supabase Auth (`signInWithPassword`, `signUp`).
2. Protected API calls send `Authorization: Bearer <access_token>`.
3. Backend verifies JWT (JWKS/HS256) and scopes data to JWT `sub` as `user_id`.

Frontend env: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (anon key only).

### Mock (development only)

`AUTH_MODE=mock` + `APP_ENV=development` enables backend email/password for local testing without Supabase.

## Persistence

| Mode | Storage |
|------|---------|
| No `DATABASE_URL` | JSON file `data/state.json` (gitignored) |
| With `DATABASE_URL` | Supabase Postgres via `cloud_store` repository |

### Initialize Postgres

```bash
python scripts/init_db.py
```

Creates: `user_profiles`, `tasks`, `inventories`, `active_homes`, `completed_homes`, `preferences`, `activity_events`.

## Endpoints (summary)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/health` | No | Liveness |
| GET | `/api/main` | No | App metadata |
| POST | `/api/ai/parse-task` | No | Parse NL → structured suggestion (not saved) |
| POST | `/api/tasks/manual` | Bearer | Create manual task |
| POST | `/api/tasks/from-ai` | Bearer | Create confirmed AI task |
| GET | `/api/tasks` | Bearer | List tasks |
| PATCH | `/api/tasks/{id}/start` | Bearer | Start task |
| PATCH | `/api/tasks/{id}/complete` | Bearer | Complete + reward |
| PATCH | `/api/tasks/{id}/abandon` | Bearer | Abandon task |
| DELETE | `/api/tasks/{id}` | Bearer | Delete task |
| GET | `/api/inventory` | Bearer | Inventory |
| GET | `/api/grid` | Bearer | 5×5 grid |
| POST | `/api/grid/place` | Bearer | Place asset |
| DELETE | `/api/grid/cells/{x}/{y}` | Bearer | Remove cell |
| GET | `/api/user/state` | Bearer | Profile, homes, preferences |
| PUT | `/api/user/state` | Bearer | Sync/migrate user state |
| DELETE | `/api/account` | Bearer | Delete account + cloud data |
| POST | `/api/calendar/template-url` | No | Google Calendar template URL |

## Gemini + Smart Parse

- With `GEMINI_API_KEY`: backend calls **`gemini-2.5-flash-lite`** (or `GEMINI_MODEL`).
- Without key, timeout, or quota (429): **Smart Parse** heuristic fallback (`source: heuristic`).
- Response includes `source` and optional `fallbackReason` for debugging.

Diagnostic (safe — no keys printed):

```bash
python scripts/test_gemini_env.py
```

## Reward rules

- EASY → 2 bricks + 20 XP · MEDIUM → 5 + 50 · HARD → 10 + 100  
- Level: `floor(sqrt(total_xp / 100))`  
- Reward at most once per task (`reward_claimed`).

## Example curl

Health:

```bash
curl -s http://127.0.0.1:8000/health
```

Parse (no auth):

```bash
curl -s -X POST http://127.0.0.1:8000/api/ai/parse-task \
  -H "Content-Type: application/json" \
  -d '{"text": "Study algorithms for 45 minutes tomorrow at 3pm", "timezone": "Europe/Istanbul"}'
```

Protected endpoints require `Authorization: Bearer <supabase_access_token>`.

## Tests

```bash
python -m pytest tests/ -q
```

## What is real vs optional

| Real | Optional / fallback |
|------|---------------------|
| FastAPI API, validation, CORS | Gemini AI (Smart Parse if unavailable) |
| Supabase JWT auth | Mock auth (dev only) |
| Postgres cloud persistence | JSON file when no `DATABASE_URL` |
| Local mode (frontend localStorage) | — |
| Calendar template URLs | Calendar OAuth/read (not implemented) |
