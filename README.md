# FocusHome

FocusHome is an AI-assisted focus planning app that turns natural language study/work plans into structured focus sessions. Users complete sessions, earn XP/bricks, and build a virtual 5×5 home. The React/Vite frontend talks to a FastAPI backend; the backend is the **single source of truth** for tasks, inventory, and grid state.

**Deployment target (UpSchool final):** React on Vercel or Render Static Site, FastAPI on Render, PostgreSQL via Supabase (`DATABASE_URL`). No AWS. Auth and store submission are out of scope for the current phase.

## Run locally

### Backend

From `backend/`:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

- API: http://127.0.0.1:8000  
- Swagger: http://127.0.0.1:8000/docs  

### Environment setup

1. **Backend:** copy `backend/.env.example` → `backend/.env`, fill optional keys, restart uvicorn.
2. **Frontend:** copy `frontend/.env.example` → `frontend/.env`, set `VITE_API_BASE_URL`, restart Vite.

Both `.env` files are gitignored. Never commit real API keys. With `AI_PROVIDER=gemini` and an empty `GEMINI_API_KEY`, parse responses use `source: "heuristic"` and the UI shows **Smart parse**, not **AI**.

Optional: set `OPENAI_API_KEY` or `GEMINI_API_KEY` for live model parsing.

### Frontend

From `frontend/`:

```powershell
npm install
copy .env.example .env
npm run dev
```

- UI: http://127.0.0.1:5173  
- Set **`VITE_API_BASE_URL=http://127.0.0.1:8000`** in `frontend/.env` (default in `.env.example`). **Restart Vite after changing `.env`.**

**Start backend first**, then frontend.

## Frontend ↔ backend (Phase A — full API wiring)

All game state is loaded from and saved to the backend. The UI no longer uses seed mock data for tasks, inventory, or grid.

| User action | API |
|-------------|-----|
| App load | `GET /api/tasks`, `GET /api/inventory`, `GET /api/grid` |
| Dashboard health | `GET /health` |
| AI parse | `POST /api/ai/parse-task` |
| Confirm AI task | `POST /api/tasks/from-ai` |
| Save manual task | `POST /api/tasks/manual` |
| Delete task (PENDING / ABANDONED) | `DELETE /api/tasks/{id}` |
| Start focus timer | `PATCH /api/tasks/{id}/start` |
| Claim reward (timer finished) | `PATCH /api/tasks/{id}/complete` → uses returned `inventory` |
| Cancel session | `PATCH /api/tasks/{id}/abandon` |
| Place wall on grid | `POST /api/grid/place` (1 brick) → refreshes inventory |
| Remove grid cell | `DELETE /api/grid/cells/{x}/{y}` |
| Calendar link | `POST /api/calendar/template-url` (or `calendarUrl` from parse when present) |

Loading and error states are shown for initial load, task create/confirm, timer actions, grid actions, and calendar link generation. Backend validation errors (e.g. not enough bricks) are surfaced in the UI.

## What is implemented

- FastAPI backend: task lifecycle, rewards, inventory, 5×5 grid, calendar template URLs, optional OpenAI NL parse
- React UI: dashboard, create task (AI + manual), focus timer, home builder
- JSON file persistence on backend (`backend/data/state.json`) for local demo
- Backend pytest suite in `backend/tests/`

## What is not implemented yet

- Full Supabase Auth + Postgres per-user API scoping (account deletion scaffold is in place)
- Live deployment (Vercel + Render + Supabase)
- Push notifications, Play Store, advanced animations
- Flutter mobile app (long-term direction)

### Account deletion

Settings → Account → **Delete account** (requires sign-in). Two-step confirmation + type `DELETE`. Clears local cache and calls `DELETE /api/account`. See `backend/README.md` and `frontend/docs/account-deletion-verification.md`.

See `backend/README.md` for env vars, endpoint details, and curl examples.

## Screenshots

Under `docs/screenshots/` (see `docs/screenshots/README.md`).

## Project docs

- `docs/focushome_prd.md` — product requirements  
- `docs/focushome_mvp.md` — MVP scope  
- `plan.md` — phased execution plan  
