# FocusHome Implementation Plan

This document breaks down the FocusHome PRD and MVP into small implementation tasks that can be executed step by step in Cursor. It is not a product requirements document; it is the technical execution plan for building the MVP before June.

## 1. Project Goal

FocusHome is an AI-assisted focus planning app that turns natural language study/work plans into structured focus sessions and optional Google Calendar events. Users complete focus sessions to earn building materials and gradually construct a virtual home.

The main product is still FocusHome. The AI Calendar feature is not a separate app; it is integrated as an intelligent task creation and calendar planning layer.

## 2. MVP Goal Before June

The goal is to release a simple but functional product before June.

The MVP should include:

- Manual focus task creation
- AI-assisted natural language task creation
- Task confirmation/edit screen before saving
- Focus timer
- Task completion logic
- Reward system with bricks/XP
- Simple 5x5 home grid
- Basic inventory display
- Optional Google Calendar event link generation
- Local storage for tasks, rewards, and grid state
- Basic clean UI suitable for a real product demo/store submission

## 3. Out of Scope for MVP

These features should not be implemented before the core MVP is working:

- User login/sign-up
- Social features, friends, chat, leaderboards
- Cloud sync
- In-app purchases
- Advanced character animations
- Tablet-specific UI
- Complex isometric grid system
- Advanced anti-cheat system
- Phone call detection
- Battery-level based pause logic
- Full analytics dashboard
- Real-time calendar availability checking
- Reading the user's Google Calendar
- OAuth-based Google Calendar API integration

## 4. Technical Stack

### Frontend

Primary target:

- Flutter

Initial homework scaffold may run on Flutter Web or Chrome for quick testing.

### Backend

Recommended:

- FastAPI or Node.js/Express

Backend is required because AI API keys must not be stored in the frontend/mobile app.

### AI/API Layer

- The frontend sends natural language task text to the backend.
- The backend calls the AI API.
- The backend returns structured JSON.
- During the first scaffold stage, the AI endpoint can return mocked data.

### Storage

MVP target:

- Local storage on device

Recommended options:

- Hive
- SQLite
- SharedPreferences only for very simple state

### Calendar Integration

MVP target:

- Google Calendar Template URL generation

No OAuth is needed for the MVP. The app can generate a calendar URL and let the user manually save the event in Google Calendar.

## 5. Proposed Folder Structure

```text
FocusHome/
│
├── backend/
│   ├── main.py
│   ├── requirements.txt
│   ├── .env.example
│   └── README.md
│
├── frontend/
│   └── FocusHome Flutter app files
│
├── docs/
│   ├── focushome_mvp.md
│   └── focushome_prd.md
│
├── plan.md
├── README.md
└── .gitignore
```

## 6. Development Phases

## Phase 0: Repository and Documentation Setup

Purpose: Create the initial project structure and provide Cursor with enough context.

Tasks:

- [X] Create the main project repository.
- [X] Create `backend/` directory.
- [X] Create `frontend/` directory.
- [X] Create `docs/` directory.
- [X] Add `focushome_mvp.md` to `docs/`.
- [X] Add `focushome_prd.md` to `docs/`.
- [X] Add this `plan.md` file to the project root.
- [X] Create a root `README.md`.
- [X] Add basic run instructions to `README.md`.

Deliverable:

- A clean project folder with documentation and clear structure.

## Phase 1: Backend Scaffold

Purpose: Make the backend run locally with basic endpoints.

Tasks:

- [X] Initialize backend project.
- [X] Add backend dependency file.
- [X] Create main backend application file.
- [X] Add `GET /` endpoint.
- [X] Add `GET /health` endpoint.
- [X] Add `GET /api/main` endpoint.
- [X] Add `POST /api/ai/parse-task` endpoint.
- [X] Make `/api/ai/parse-task` return structured JSON (rule-based fallback; optional OpenAI when configured — not production-hardened).
- [X] Add CORS configuration so the frontend can call the backend.
- [X] Add `.env.example` file.
- [X] Make sure no real API keys are committed.
- [X] Test all endpoints locally.

Expected endpoints:

```text
GET /
GET /health
GET /api/main
POST /api/ai/parse-task
```

Example `/health` response:

```json
{
  "status": "ok",
  "service": "focushome-backend"
}
```

Example `/api/main` response:

```json
{
  "app": "FocusHome",
  "version": "0.1.0",
  "message": "FocusHome backend is running."
}
```

Example mocked `/api/ai/parse-task` response:

```json
{
  "title": "Algorithm Study",
  "startDateTime": "2026-04-23T15:00:00+03:00",
  "endDateTime": "2026-04-23T16:00:00+03:00",
  "durationMinutes": 60,
  "difficulty": "MEDIUM",
  "description": "Mock AI parsed focus task",
  "calendarEligible": true
}
```

Deliverable:

- Backend runs locally and the basic endpoints respond correctly.

## Phase 2: Frontend Scaffold

Purpose: Make the frontend run locally and display a basic FocusHome screen.

Tasks:

- [ ] Initialize Flutter frontend project.
- [X] Create a simple landing/home screen.
- [X] Show app name: FocusHome.
- [X] Show short description of the product.
- [X] Add natural language task input field.
- [X] Add "Create Focus Task" button.
- [X] Add placeholder backend status area.
- [X] Call backend `/health` endpoint if possible.
- [X] Display parsed task result from `/api/ai/parse-task` when the backend is reachable (errors shown if offline).
- [X] Keep UI simple and clean.
- [X] Initialize temporary React/Vite frontend scaffold because Flutter is not installed in the current environment.

Deliverable:

- Frontend opens locally and shows a basic FocusHome interface.

## Phase 3: AI-Assisted Task Creation

Purpose: Convert natural language input into structured focus tasks.

Tasks:

- [X] Define request schema for AI task parsing.
- [X] Define response schema for parsed task data.
- [X] Create backend AI service module.
- [X] Store AI API key only in backend environment variables.
- [X] Add system prompt for task parsing (optional OpenAI path; not production-tuned).
- [X] Ask AI to return JSON only (optional OpenAI path; not production-hardened).
- [X] Validate AI response before sending it to frontend (Pydantic validation + normalization; invalid provider JSON falls back).
- [X] Add error handling for invalid AI response (fallback / safe failure path).
- [X] Add fallback behavior if AI request fails.
- [X] Connect frontend input to backend parse endpoint.
- [X] Show parsed task in a confirmation card.

**Note:** Optional OpenAI calls exist behind backend env vars; full production behavior (SLA, retries, strict monitoring) is **not** in scope for the current milestone.

Expected user input:

```text
Tomorrow at 3 PM I will study algorithms for 45 minutes.
```

Expected structured output:

```json
{
  "title": "Algorithm Study",
  "startDateTime": "2026-04-23T15:00:00+03:00",
  "endDateTime": "2026-04-23T15:45:00+03:00",
  "durationMinutes": 45,
  "difficulty": "MEDIUM",
  "description": "Focus session for studying algorithms"
}
```

Deliverable:

- User can enter natural language text and receive a structured task suggestion.

## Phase 4: Manual Task Creation

Purpose: Ensure the app works even without AI.

Tasks:

- [X] Create manual task form.
- [X] Add title input.
- [X] Add duration options: 15, 30, 45, 60 minutes (UI uses hour/minute/second inputs; values are snapped to 15/30/45/60 when sent to the backend).
- [X] Add difficulty options: Easy, Medium, Hard.
- [X] Save manual task via backend (`POST /api/tasks/manual`).
- [X] Display task in task list (merged into local React list; not a full sync with `GET /api/tasks`).
- [ ] Allow deleting pending tasks (backend `DELETE` exists; React UI not wired).

**Note:** Full task list, timer flow, and inventory display remain **partially local React state** (seed/mock data plus tasks added from the UI).

Deliverable:

- User can create tasks manually.

## Phase 5: Task Confirmation and Editing

Purpose: Prevent incorrect AI-generated tasks from being saved directly.

**Note:** Confirmation/edit UI exists in React. Saving a confirmed AI task still merges into **local React state** only (backend `POST /api/tasks/from-ai` is not wired from the frontend yet).

Tasks:

- [X] Create confirmation screen/card.
- [X] Display parsed title.
- [X] Display parsed date/time.
- [X] Display parsed duration.
- [X] Display parsed difficulty.
- [X] Allow user to edit fields before saving.
- [X] Add "Confirm Task" button.
- [X] Add "Cancel" button.
- [X] Save confirmed task locally (React state; not persisted via backend from-ai endpoint).

Deliverable:

- AI output is reviewed by user before becoming a real task.

## Phase 6: Focus Timer

Purpose: Let users complete focus sessions.

**Note:** The **React/Vite** scaffold includes a working focus timer (countdown, start, pause, complete when time reaches zero, cancel). State and task status updates are **local React state** only. Backend endpoints such as `PATCH /api/tasks/{id}/start`, `.../complete`, and `.../abandon` exist but are **not called from this UI**.

Tasks:

- [X] Create focus timer screen.
- [X] Start timer for selected task duration.
- [X] Show remaining time.
- [X] Add pause/resume if simple enough.
- [X] Mark task completed only if timer finishes (Complete / “Claim reward” stays disabled until `remainingSeconds === 0`).
- [X] Mark abandoned/failed if user cancels (cancel updates task status in local state; no backend abandon call).
- [X] Prevent reward if task is not completed (reward applied in `App.jsx` only after timer reaches zero).

Deliverable:

- User can run and complete a focus session.

## Phase 7: Rewards and Inventory

Purpose: Reward completed focus sessions.

**Note:** **Backend** implements the PRD reward rules and inventory (`reward_service`, `GET /api/inventory`, rewards on `PATCH .../complete`). The **Dashboard** still reads **mock seed inventory** in React; timer “Claim reward” updates **local** XP/bricks/level only. There is **no** live sync from the UI to backend inventory after a focus session.

Tasks:

- [X] Define reward rules (shared constants in `frontend/src/utils/rewards.js`; mirrored in backend).
- [X] Easy task gives 2 bricks.
- [X] Medium task gives 5 bricks.
- [X] Hard task gives 10 bricks.
- [X] Add XP reward.
- [X] Update inventory after completed task (**local React state** after timer completion; not `GET/PATCH` inventory API from the frontend).
- [X] Display total bricks.
- [X] Display total XP.
- [X] Display level.

Deliverable:

- Completing tasks gives visible rewards.

## Phase 8: Simple Home Grid

Purpose: Implement the core gamification mechanic.

**Note:** Backend grid API exists (`GET/POST/DELETE` under `/api/grid`). The **React/Vite** home builder still uses **mock/local grid state** (no full wiring to the backend from the UI).

Tasks:

- [ ] Create 5x5 grid.
- [ ] Show empty ground cells.
- [ ] Allow placing a brick/wall asset.
- [ ] Prevent placement if user has no bricks.
- [ ] Prevent placement on occupied cells.
- [ ] Deduct inventory resource after placement.
- [ ] Save grid state locally.
- [ ] Reload grid state after app restart.

Deliverable:

- User can build a simple home using earned materials.

## Phase 9: Google Calendar Template URL

Purpose: Let users add planned focus sessions to Google Calendar.

Tasks:

- [ ] Create calendar URL helper function.
- [ ] Convert task title to calendar event title.
- [ ] Convert start and end datetime to Google Calendar URL format.
- [ ] Add task description to calendar details.
- [ ] Show "Add to Google Calendar" button for scheduled tasks.
- [ ] Open generated calendar URL in browser.
- [ ] Do not use OAuth for MVP.
- [ ] Do not read user's calendar for MVP.

Deliverable:

- User can add a FocusHome task to Google Calendar manually.

## Phase 10: Local Persistence

Purpose: Keep user progress after app restart.

**Note:** The **backend** demo persists to `backend/data/state.json`. The **React** app does **not** yet implement full MVP local persistence (e.g. Hive/SQLite/localStorage sync for tasks, inventory, grid, XP) as described for the long-term mobile target.

Tasks:

- [ ] Save tasks locally.
- [ ] Save inventory locally.
- [ ] Save grid state locally.
- [ ] Save XP and level locally.
- [ ] Load saved state on app start.
- [ ] Handle missing/corrupted local state safely.

Deliverable:

- App remembers user progress.

## Phase 11: Basic Polish

Purpose: Make the app feel like a real product.

Tasks:

- [ ] Add simple onboarding text.
- [ ] Add empty states.
- [ ] Add loading states.
- [ ] Add error messages.
- [ ] Add basic color palette.
- [ ] Add simple icons/assets.
- [ ] Make UI clean and readable.
- [ ] Test on mobile screen size.

Deliverable:

- App looks presentable enough for demo/store preparation.

## Phase 12: Testing and Store Preparation

Purpose: Prepare for real product submission.

Tasks:

- [ ] Test manual task creation.
- [ ] Test AI task creation.
- [ ] Test focus timer.
- [ ] Test rewards.
- [ ] Test grid placement.
- [ ] Test local storage.
- [ ] Test calendar URL generation.
- [ ] Add privacy policy draft.
- [ ] Add app description draft.
- [ ] Prepare store screenshots.
- [ ] Build Android release candidate.
- [ ] Optional: prepare iOS build if time allows.

Deliverable:

- MVP is ready for a real product demo and possible store submission.

## Current Week 5 Status

Completed:

- FastAPI backend runs locally on port 8000.
- Backend health, main, AI parse, task, inventory, grid, and calendar API structure exists.
- Frontend checks backend status with `GET /health`.
- Frontend sends natural language input to `POST /api/ai/parse-task`.
- Frontend sends manual task creation to `POST /api/tasks/manual`.
- Backend URL is configured with `VITE_API_BASE_URL`.
- No real API keys are committed.

Partially completed:

- Task list/timer flow still uses some local React state.
- Calendar template URL is supported without OAuth.
- Inventory and grid API exist, but UI is still mostly mock/local.

Still open:

- Full Flutter/mobile implementation.
- Full frontend sync for timer, rewards, inventory, and grid.
- Full local/mobile persistence such as Hive/SQLite.
- Store preparation.

## 7. Current Homework Checklist

The current homework is not to complete the full product. The current goal is to prove that the project structure exists and both backend and frontend can start.

For this week's homework, complete only the following:

- [X] Create project repository.
- [X] Add `docs/` folder.
- [X] Add PRD and MVP markdown files to `docs/`.
- [X] Add this `plan.md` file.
- [X] Create `backend/` folder.
- [X] Make backend run locally.
- [X] Add `GET /` endpoint.
- [X] Add `GET /health` endpoint.
- [X] Add `GET /api/main` endpoint.
- [X] Add mocked/fallback `POST /api/ai/parse-task` endpoint.
- [X] Create `frontend/` folder.
- [X] Make frontend run locally.
- [X] Show a simple FocusHome page.
- [X] Add README with run instructions.
- [X] Make sure no API keys are committed.

## 8. Cursor Execution Rule

Cursor should follow this plan phase by phase.

Important:

- Do not jump to future phases before the current phase is working.
- Do not implement advanced features before the MVP basics are complete.
- Do not put API keys in the frontend.
- Do not implement login, cloud sync, social features, or OAuth before MVP.
- Prefer small, working increments.
- After each phase, verify that the app still runs.

## 9. Definition of Done for This Week

This week's work is done when:

- Backend starts locally.
- Backend `/health` returns a valid response.
- Backend `/api/main` returns a valid response.
- Backend `/api/ai/parse-task` returns structured JSON (rule-based fallback; optional OpenAI when configured).
- Frontend starts locally.
- Frontend displays a FocusHome page.
- PRD, MVP, and plan documents are inside the repository.
- README explains how to run the project.
- No secret API key is committed.
