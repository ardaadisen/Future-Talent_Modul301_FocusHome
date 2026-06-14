# FocusHome Backend (MVP)

FastAPI service that acts as the secure AI and game-logic layer: natural-language task parsing (optional OpenAI), task lifecycle, rewards, inventory, 5×5 grid placement, and Google Calendar **template URL** generation (no OAuth, no calendar read).

## Setup

From this `backend/` directory:

```bash
python -m venv .venv
```

Windows (PowerShell):

```powershell
.\.venv\Scripts\Activate.ps1
```

macOS / Linux:

```bash
source .venv/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Copy environment template:

```bash
copy .env.example .env   # Windows — creates backend/.env if missing
# cp .env.example .env   # macOS/Linux
```

Restart the backend after changing `.env`. On startup the server logs `AI_PROVIDER` and whether API keys are present (never the key values).

## Run

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Open `http://127.0.0.1:8000/docs` for interactive OpenAPI.

## Environment variables

| Variable | Purpose |
|----------|---------|
| `AUTH_MODE` | `supabase` (production) or `mock` (dev-only fake auth when `APP_ENV=development`) |
| `APP_ENV` | `development` or `production` — mock auth only works in development |
| `SUPABASE_URL` | Supabase project URL (required for `AUTH_MODE=supabase`) |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side secret for admin user deletion — **never expose to frontend** |
| `SUPABASE_JWT_SECRET` | JWT secret from Supabase API settings — used to verify Bearer tokens |
| `DATABASE_URL` | Optional Postgres for future cloud DB (`cloudDbConfigured` in `/api/main`) |
| `AI_PROVIDER` | `mock` \| `openai` \| `gemini` (default **gemini**). Falls back to heuristic parse if key missing or call fails. |
| `GEMINI_API_KEY` | Google Gemini API key (recommended for production task parsing). **Restart the backend after changing this value** — keys are read once at startup from `backend/.env`. |
| `GEMINI_MODEL` | Optional model (default **`gemini-2.5-flash-lite`**). |
| `AI_HTTP_TIMEOUT_SECONDS` | Timeout for Gemini/OpenAI HTTP calls (default **15**). On timeout or error, parsing falls back to the smart/heuristic parser. |
| `OPENAI_API_KEY` | OpenAI key when `AI_PROVIDER=openai`. |
| `OPENAI_MODEL` | Optional model name (default `gpt-4o-mini`). |
| `CORS_ORIGINS` | Comma-separated list of allowed browser origins. |

If no AI key is set or the AI call fails, parsing uses a **deterministic fallback** with Turkish/English duration extraction (`durationSeconds` in the response).

On startup, the backend logs (never actual key values):

- `Loading env from: …/backend/.env`
- `AI_PROVIDER=…`
- `GEMINI_API_KEY present: true/false`
- `GEMINI_MODEL=…`
- `OPENAI_API_KEY present: true/false`

Environment variables are loaded from **`backend/.env`** only (not `frontend/.env`). Run the server from the `backend/` folder:

```bash
cd backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Restart the backend after any change to `backend/.env`** — values are read at process start.

Each parse request logs whether Gemini was attempted or heuristic fallback was used. Check the `focushome.ai` logger in the terminal.

### Gemini troubleshooting

HTTP **429** means Gemini **quota or rate limit is exhausted** — this is **not an app failure**. FocusHome falls back to Smart Parse (`source=heuristic`, `fallbackReason=gemini_quota_exceeded`) and keeps working.

| What to do | Details |
|------------|---------|
| Check limits | [Google AI Studio rate limits](https://ai.google.dev/gemini-api/docs/rate-limits) and [usage dashboard](https://ai.dev/rate-limit) |
| Wait | Free-tier quotas reset on a schedule — try again later |
| Billing / paid tier | Enable billing in Google Cloud / AI Studio if you need higher limits |
| Lighter model | Set `GEMINI_MODEL=gemini-2.5-flash-lite` (default) or another model in `backend/.env` and **restart** the backend |
| Smart Parse fallback | Always available — users see the **Smart Parse** badge and can confirm the session normally |

The API response includes optional `fallbackReason` (e.g. `gemini_quota_exceeded`, `gemini_timeout`) for debugging. The frontend shows a friendly non-technical hint; detailed status codes stay in backend logs only.

| Symptom | Likely cause |
|---------|----------------|
| Startup shows `GEMINI_API_KEY present: false` | Key missing from `backend/.env`, or server not restarted after adding it |
| Log: `fallbackReason=missing_gemini_api_key` | Same as above |
| Log: `fallbackReason=gemini_quota_exceeded` (HTTP 429) | Quota/rate limit — Smart Parse fallback is expected and OK |
| Log: `gemini_unauthorized` (401/403) | Wrong key — create one at [Google AI Studio](https://aistudio.google.com/apikey) |
| Frontend always Smart Parse, no backend logs | Backend not running or wrong `VITE_API_BASE_URL` — frontend uses client fallback (`backend_unreachable`) |

Diagnostic script (safe — does not print keys):

```bash
cd backend
python scripts/test_gemini_env.py
```

## Authentication

### Modes

| Mode | When | Behaviour |
|------|------|-----------|
| `AUTH_MODE=supabase` | Production | Frontend uses Supabase Auth; API verifies JWT (`Authorization: Bearer`). Mock login disabled. |
| `AUTH_MODE=mock` | `APP_ENV=development` only | Backend email/password with hashed credentials. Disabled in production. |

### Supabase setup

1. Create a project at [supabase.com](https://supabase.com).
2. Backend `.env`: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_JWT_SECRET`, `AUTH_MODE=supabase`.
3. Frontend `.env`: `VITE_AUTH_MODE=supabase`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (anon key only).
4. **Email confirmation** (optional): Authentication → Providers → Email → enable *Confirm email*. The app prompts users to confirm before sign-in.
5. **Password security**: Authentication → Settings — set min length, enable leaked-password protection and CAPTCHA if needed.

### Auth endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/register` | No | Mock mode only — real sign-up is via Supabase client |
| POST | `/api/auth/login` | No | Mock mode only — real sign-in is via Supabase client |
| GET | `/api/auth/me` | Optional Bearer | Session check |
| DELETE | `/api/account` | Bearer required | Delete user bucket + Supabase auth user (service role) |

### Protected endpoints (Bearer required)

Tasks, inventory, grid, and `/api/user/state` are scoped to the authenticated `user_id` from the JWT `sub` claim.

### Manual verification checklist

- Wrong password → 401 (mock) or Supabase error (supabase)
- Non-existing user → 401
- Registered user can sign in
- Unauthenticated `GET /api/tasks` → 401
- Authenticated request succeeds
- User A cannot read User B's tasks
- Logout clears frontend cached progress
- `DELETE /api/account` requires auth and removes only that user's data

### Account deletion

`DELETE /api/account` requires `Authorization: Bearer <access_token>`. It:

- Removes the user's bucket from `state.json` (tasks, inventory, grid, profile, preferences, homes, decorations, history)
- Removes mock auth credentials when applicable
- Revokes the session token
- Deletes the Supabase auth user via Admin API when configured (service role, backend-only)

## Persistence

Runtime demo state is stored in `data/state.json` (created automatically). It contains **no secrets**. The `backend/data/` directory is gitignored.

If the file is missing or invalid JSON, the app recovers to a safe default (empty tasks, zero inventory, empty grid).

## Endpoints (summary)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Welcome message |
| GET | `/health` | Liveness |
| GET | `/api/main` | App metadata |
| POST | `/api/ai/parse-task` | Parse NL text → structured suggestion (not saved). Response includes `source`: `gemini` \| `openai` \| `heuristic` \| `mock` and `durationSeconds`. |
| POST | `/api/tasks/manual` | Create manual task |
| POST | `/api/tasks/from-ai` | Create task from user-confirmed AI fields (`source=AI`) |
| GET | `/api/tasks` | List tasks |
| GET | `/api/tasks/{id}` | Get one task |
| PATCH | `/api/tasks/{id}/start` | `PENDING` → `ACTIVE` |
| PATCH | `/api/tasks/{id}/complete` | Complete + reward once; returns task + inventory |
| PATCH | `/api/tasks/{id}/abandon` | `PENDING`/`ACTIVE` → `ABANDONED` |
| DELETE | `/api/tasks/{id}` | Delete `PENDING` or `ABANDONED` only |
| GET | `/api/inventory` | XP, level, resources (auth required) |
| POST | `/api/calendar/template-url` | Build Google Calendar template URL (UTC compact dates) |
| GET | `/api/grid` | 5×5 grid state (auth required) |
| POST | `/api/grid/place` | Place asset; optional `resource_cost` deducted on success (auth required) |
| DELETE | `/api/grid/cells/{x}/{y}` | Remove cell (auth required) |
| GET | `/api/user/state` | User profile, preferences, homes (auth required) |
| PUT | `/api/user/state` | Update user-scoped home/profile data (auth required) |

## Reward rules

- EASY → 2 bricks + 20 XP  
- MEDIUM → 5 bricks + 50 XP  
- HARD → 10 bricks + 100 XP  
- `FAILED` / `ABANDONED` → no reward  
- Reward at most once per task (`reward_claimed`).  
- Level: `floor(sqrt(total_xp / 100))`.

## Google Calendar

Only **template URLs** (`action=TEMPLATE`) are generated. Datetimes are converted to UTC and formatted as `YYYYMMDDTHHMMSSZ`. Naive datetimes are interpreted as **Europe/Istanbul (UTC+3)**. Title and description are URL-encoded (UTF-8).

## Example `curl` calls

Health:

```bash
curl -s http://127.0.0.1:8000/health
```

Parse task (fallback without API key):

```bash
curl -s -X POST http://127.0.0.1:8000/api/ai/parse-task ^
  -H "Content-Type: application/json" ^
  -d "{\"text\": \"Tomorrow at 3 PM I will study algorithms for 45 minutes.\", \"timezone\": \"Europe/Istanbul\"}"
```

Create manual task:

```bash
curl -s -X POST http://127.0.0.1:8000/api/tasks/manual ^
  -H "Content-Type: application/json" ^
  -d "{\"title\": \"Read chapter 3\", \"preset_duration\": 30, \"difficulty_level\": \"EASY\"}"
```

Start, complete (replace `TASK_ID`):

```bash
curl -s -X PATCH http://127.0.0.1:8000/api/tasks/TASK_ID/start
curl -s -X PATCH http://127.0.0.1:8000/api/tasks/TASK_ID/complete
```

Inventory:

```bash
curl -s http://127.0.0.1:8000/api/inventory
```

Calendar template URL:

```bash
curl -s -X POST http://127.0.0.1:8000/api/calendar/template-url ^
  -H "Content-Type: application/json" ^
  -d "{\"title\": \"Finance Study\", \"startDateTime\": \"2026-05-14T10:00:00+03:00\", \"endDateTime\": \"2026-05-14T11:00:00+03:00\", \"description\": \"Focus session\"}"
```

## Tests

```bash
pip install -r requirements.txt
python -m pytest tests/ -q
```

## What is real vs mocked

- **Real**: HTTP API, validation, JWT auth, per-user JSON buckets, task lifecycle, rewards, grid rules, calendar URL builder, CORS.  
- **Optional real AI**: OpenAI/Gemini when keys are set; otherwise **rule-based fallback** parsing.  
- **Supabase Auth**: Real when `AUTH_MODE=supabase`; mock dev auth when `AUTH_MODE=mock` + `APP_ENV=development`.  
- **Not implemented**: OAuth providers, calendar read, Postgres cloud DB (use JSON buckets until `DATABASE_URL` is wired).
