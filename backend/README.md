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

Copy environment template (optional):

```bash
copy .env.example .env   # Windows
# cp .env.example .env   # macOS/Linux
```

## Run

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Open `http://127.0.0.1:8000/docs` for interactive OpenAPI.

## Environment variables

| Variable | Purpose |
|----------|---------|
| `OPENAI_API_KEY` | If set and `AI_PROVIDER=openai`, `POST /api/ai/parse-task` calls OpenAI from the server only. |
| `AI_PROVIDER` | Currently only `openai` is implemented for live AI. |
| `OPENAI_MODEL` | Optional model name (default `gpt-4o-mini`). |
| `APP_ENV` | Informational (e.g. `development`). |
| `CORS_ORIGINS` | Comma-separated list of allowed browser origins. |

If `OPENAI_API_KEY` is empty or the AI call fails, parsing uses a **deterministic fallback** (regex heuristics + timezone-aware defaults). Manual task APIs always work.

## Persistence

Runtime demo state is stored in `data/state.json` (created automatically). It contains **no secrets**. The `backend/data/` directory is gitignored.

If the file is missing or invalid JSON, the app recovers to a safe default (empty tasks, zero inventory, empty grid).

## Endpoints (summary)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Welcome message |
| GET | `/health` | Liveness |
| GET | `/api/main` | App metadata |
| POST | `/api/ai/parse-task` | Parse NL text → structured suggestion (not saved as task) |
| POST | `/api/tasks/manual` | Create manual task |
| POST | `/api/tasks/from-ai` | Create task from user-confirmed AI fields (`source=AI`) |
| GET | `/api/tasks` | List tasks |
| GET | `/api/tasks/{id}` | Get one task |
| PATCH | `/api/tasks/{id}/start` | `PENDING` → `ACTIVE` |
| PATCH | `/api/tasks/{id}/complete` | Complete + reward once; returns task + inventory |
| PATCH | `/api/tasks/{id}/abandon` | `PENDING`/`ACTIVE` → `ABANDONED` |
| DELETE | `/api/tasks/{id}` | Delete `PENDING` or `ABANDONED` only |
| GET | `/api/inventory` | XP, level, resources |
| POST | `/api/calendar/template-url` | Build Google Calendar template URL (UTC compact dates) |
| GET | `/api/grid` | 5×5 grid state |
| POST | `/api/grid/place` | Place asset; optional `resource_cost` deducted on success |
| DELETE | `/api/grid/cells/{x}/{y}` | Remove cell (no resource refund in MVP) |

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

- **Real**: HTTP API, validation, task lifecycle, JSON persistence, rewards, grid rules, calendar URL builder, CORS.  
- **Optional real AI**: OpenAI when `OPENAI_API_KEY` is set; otherwise **rule-based fallback** parsing.  
- **Not implemented**: Auth, OAuth, calendar read, cloud sync, social, IAP, anti-cheat.
