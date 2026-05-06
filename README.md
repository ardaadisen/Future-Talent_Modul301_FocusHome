# FocusHome

FocusHome is an AI-assisted focus planning app that turns natural language study/work plans into structured focus sessions. Users complete sessions and gradually build a virtual home through gamified progress. The long-term product direction remains Flutter/mobile-oriented, with secure backend-based AI processing.

This repository currently contains a FastAPI backend scaffold and a temporary React/Vite frontend scaffold. The final product direction is still Flutter/mobile; this web frontend is for weekly assignment/demo progress only.

## Week 4 Frontend Submission (Mock UI)

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

- AI parse results
- task data and inventory state
- home grid content
- reward progression persistence (local state only)
- calendar integration (template URL only)

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

- No real API keys are included or required for this week.
- No real AI API call is used in frontend this week.
- Google Calendar OAuth is not implemented.
- Backend/live integration is optional for this week frontend submission.
- Backend API contracts are kept independent so the frontend can later be replaced with Flutter without backend changes.
