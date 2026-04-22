# FocusHome

FocusHome is an AI-assisted focus planning app that turns natural language study/work plans into structured focus sessions. Users complete sessions and gradually build a virtual home through gamified progress. The long-term product direction remains Flutter/mobile-oriented, with secure backend-based AI processing.

This week includes only the initial scaffold: a minimal FastAPI backend and a temporary web frontend to verify local integration. The AI parse endpoint returns mocked structured JSON (no real AI API call yet).

## Run Backend

1. Open a terminal in `backend/`.
2. Create and activate a virtual environment.
3. Install dependencies:
   - `pip install -r requirements.txt`
4. Start backend:
   - `uvicorn main:app --reload --host 0.0.0.0 --port 8000`

## Run Frontend (Temporary Web Scaffold)

1. Open another terminal in `frontend/`.
2. Install dependencies:
   - `npm install`
3. Start dev server:
   - `npm run dev`
4. Open the local URL shown by Vite (usually `http://127.0.0.1:5173`).

## Notes

- No real API keys are included or required for this week.
- Google Calendar integration is not implemented yet.
- Timer, rewards, local storage, and grid system are not implemented yet.
- Backend API contracts are kept independent so the frontend can later be replaced with Flutter without backend changes.
