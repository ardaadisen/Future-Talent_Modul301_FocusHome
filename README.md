# FocusHome

FocusHome is an AI-assisted focus planning app that turns natural language study/work plans into structured focus sessions. Users complete sessions and gradually build a virtual home through gamified progress. The long-term product direction remains Flutter/mobile-oriented, with secure backend-based AI processing.

This repository currently contains a FastAPI backend scaffold and a temporary React/Vite frontend scaffold. The final product direction is still Flutter/mobile; this web frontend is for weekly assignment/demo progress only.

## Week 4 Frontend Submission (Mock UI)

> **Update (Week 5):** Dashboard health, Create Task AI parse, and manual save can call the local backend; most other UI state remains mock. See **Frontend ↔ backend** below.

Implemented this week (frontend with mock data):

- Dashboard/home screen with FocusHome description, progress stats, today's tasks, quick actions
- AI-assisted task creation screen with natural language input and mocked parse result
- Manual task creation form (title, duration, difficulty, description)
- Task confirmation/edit flow before AI task is saved
- Task list with reusable `TaskCard`, status badge, difficulty badge
- Focus timer screen with local countdown controls (Start, Pause, Complete, Cancel)
- Reward/inventory UI and mock reward rules
- Simple 5x5 home grid screen with mock assets and protected filled cells
- Optional Google Calendar template link UI (no OAuth)
- Reusable component structure + small design system (theme, global styles)

What is mocked:

- AI parse: uses the **live backend** when it is running; otherwise the UI shows a connection error (no silent mock parse).
- Task list (seed data), timer completion rewards, inventory numbers, and home grid remain **local mock** for this demo (manual save also persists one task on the server, but the UI does not sync full inventory from the API yet).
- Calendar: client can still build a template link; parsed tasks may include **`calendarUrl`** from the backend.

## Run Backend

1. Open a terminal in `backend/`.
2. Create and activate a virtual environment.
3. Install dependencies:
   - `pip install -r requirements.txt`
4. Start backend:
   - `uvicorn main:app --reload --host 0.0.0.0 --port 8000`

## Run Frontend (Temporary React/Vite Scaffold)

1. Open another terminal in `frontend/`.
2. Install dependencies:
   - `npm install`
3. Start dev server:
   - `npm run dev`
4. Open the local URL shown by Vite (usually `http://127.0.0.1:5173`).

## Screenshots

Add your Week 4 screenshots under `docs/screenshots/` and reference them here:

- `docs/screenshots/dashboard.png`
- `docs/screenshots/create-task.png`
- `docs/screenshots/task-confirmation.png`
- `docs/screenshots/focus-timer.png`
- `docs/screenshots/home-builder.png`

## Notes

- The frontend can call the **local FastAPI** for health, AI parse, and manual task create (`VITE_API_BASE_URL`, default `http://127.0.0.1:8000`). Restart Vite after changing `.env`.
- Google Calendar OAuth is not implemented.
- Backend API contracts are kept independent so the frontend can later be replaced with Flutter without backend changes.
## Week 5 backend (MVP API)

The FastAPI backend now exposes task lifecycle, inventory/rewards, grid placement, calendar template URLs, and optional OpenAI-backed NL parsing. See `backend/README.md` for setup, env vars, and `curl` examples.

**Run the backend** on `http://127.0.0.1:8000` (default for `uvicorn` with `--host 0.0.0.0 --port 8000`).

## Frontend ↔ backend (minimal integration)

- Copy `frontend/.env.example` to `frontend/.env` and set **`VITE_API_BASE_URL=http://127.0.0.1:8000`** (or leave the example default).
- Restart Vite after changing `.env`.
- **Dashboard** calls **`GET /health`** and shows backend status (or the error: *Backend connection failed. Please start the backend on port 8000.*).
- **Create Task → Parse with AI** calls **`POST /api/ai/parse-task`** with `text` and `timezone: "Europe/Istanbul"` and fills the parsed/confirm UI from the JSON response (including **`calendarUrl`** when present).
- **Save Manual Task** calls **`POST /api/tasks/manual`** and adds the returned task to the local list (timer and inventory remain mock/local).
- Task list, timer rewards, grid, and inventory stats are still **mostly mock/local** for this demo.
