# FocusHome

FocusHome is an AI-assisted focus planning app. Users describe what they want to work on in natural language, confirm a structured focus session, complete timed tasks, earn XP and bricks, and build a virtual 5×5 home. The app works **fully offline on one device** (local mode) and optionally syncs progress to the cloud when the user signs in with Supabase.

**UpSchool Modul 301 — final submission.** Deployment target: **Vercel** (frontend) + **Render** (backend) + **Supabase** (auth + Postgres). No AWS.

---

## Tech stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, Vite 5, mobile-first CSS |
| Backend | FastAPI, Uvicorn, PyJWT, psycopg3 |
| Auth | Supabase Auth (email/password, JWT) |
| Database | Supabase Postgres (cloud); localStorage (local mode) |
| AI parsing | Google Gemini (`gemini-2.5-flash-lite`) with Smart Parse fallback |
| Calendar | Google Calendar template URLs (no OAuth) |

---

## Features

- **Manual task creation** — title, duration (15/30/45/60 min), difficulty, optional calendar link
- **AI task parsing** — natural language → structured session (Gemini or Smart Parse fallback)
- **Focus timer** — start, complete, abandon; rewards on completion
- **Inventory & XP** — bricks, glass, roof tiles; level from XP
- **5×5 home grid** — place walls, windows, roof tiles
- **Build mode** — stack progress, decorations, completed homes archive
- **Google Calendar** — optional template link per task
- **Account sync** — sign in to persist tasks/inventory/grid across devices
- **Local progress migration** — one-click upload of anonymous local data after sign-in
- **Account deletion** — removes cloud data and Supabase auth user
- **i18n** — English and Turkish

---

## Local mode vs cloud sync

### Local mode (default, no sign-in)

- All game state lives in **browser localStorage** on this device.
- No Supabase or backend auth required for core gameplay.
- AI parse still calls the backend if `VITE_API_BASE_URL` is set (public endpoint); otherwise client-side Smart Parse fallback.
- Ideal for demos, offline use, and users who do not want an account.

### Cloud sync (optional, after sign-in)

- User signs in via **Supabase Auth** on the frontend.
- Frontend sends `Authorization: Bearer <access_token>` on protected API calls.
- Backend verifies JWT and stores data in **Supabase Postgres** via `DATABASE_URL`.
- Tables: `user_profiles`, `tasks`, `inventories`, `active_homes`, `completed_homes`, `preferences`, `activity_events`.
- **Sync local progress** (Settings) uploads anonymous local data to the signed-in account once.

Without `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`, the app stays in local-only mode.

---

## Gemini AI parse + Smart Parse fallback

1. User enters natural language on the create-task screen.
2. Frontend calls `POST /api/ai/parse-task` (no auth required).
3. Backend tries **Gemini** when `GEMINI_API_KEY` is set (`AI_PROVIDER=gemini`, model **`gemini-2.5-flash-lite`**).
4. If the key is missing, the request times out, or quota is exceeded (HTTP 429), the backend uses a **deterministic Smart Parse** (heuristic) — same UX, badge shows **Smart Parse** instead of **AI**.
5. Parsed output is a **suggestion only**; the user confirms/edits before `POST /api/tasks/from-ai` saves it.

Never put API keys in frontend code. Keys live in `backend/.env` only.

---

## Local setup

### Prerequisites

- Python 3.11+ (3.12+ recommended)
- Node.js 18+
- Optional: Supabase project, Gemini API key

### 1. Backend

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

- API: http://127.0.0.1:8000  
- Swagger: http://127.0.0.1:8000/docs  

### 2. Frontend

```powershell
cd frontend
npm install
copy .env.example .env
npm run dev
```

- UI: http://127.0.0.1:5173  

**Start the backend first**, then the frontend. Restart both after changing any `.env` file.

---

## Environment setup

Copy the example files and fill in values. **Never commit `.env` files or real secrets.**

| File | Purpose |
|------|---------|
| `backend/.env.example` → `backend/.env` | Auth, Postgres, Gemini, CORS |
| `frontend/.env.example` → `frontend/.env` | Backend URL, Supabase anon key |

See [`backend/.env.example`](backend/.env.example) and [`frontend/.env.example`](frontend/.env.example) for every variable. Details: [`backend/README.md`](backend/README.md).

### Minimum for local-only demo

- **Backend:** empty or partial `.env` — JSON file persistence, Smart Parse for AI.
- **Frontend:** `VITE_API_BASE_URL=http://127.0.0.1:8000`

### Full cloud + AI stack

- **Backend:** `AUTH_MODE=supabase`, Supabase URL/keys, `DATABASE_URL`, optional `GEMINI_API_KEY`
- **Frontend:** `VITE_API_BASE_URL`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`

---

## Database init (Supabase Postgres)

Required for signed-in cloud persistence:

1. Create a Supabase project → **Project Settings → Database** → copy the **Session pooler** URI.
2. Set `DATABASE_URL` in `backend/.env` (include `?sslmode=require` if missing).
3. Run once from `backend/`:

```bash
python scripts/init_db.py
```

4. Confirm tables in Supabase **Table Editor**.

---

## Test and build commands

### Backend tests

```powershell
cd backend
python -m pytest tests/ -q
```

### Frontend production build

```powershell
cd frontend
npm run build
```

Output: `frontend/dist/` (static files for Vercel).

### Optional: Gemini env check (does not print keys)

```powershell
cd backend
python scripts/test_gemini_env.py
```

---

## Deployment

Full step-by-step guide: **[`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md)**

Summary:

| Service | Platform | Notes |
|---------|----------|-------|
| Frontend | **Vercel** | Build: `npm run build`, output: `dist`. Set `VITE_*` env vars at build time. |
| Backend | **Render** | Start: `uvicorn main:app --host 0.0.0.0 --port $PORT`. Set all backend env vars in Render dashboard. |
| Auth + DB | **Supabase** | Same project for Auth, JWT secret, service role, and `DATABASE_URL`. |

**Critical after deploy:**

1. Set `VITE_API_BASE_URL` on Vercel to your Render backend URL (e.g. `https://focushome-api.onrender.com`).
2. Add your Vercel URL to backend `CORS_ORIGINS` (comma-separated).
3. Run `python scripts/init_db.py` against production `DATABASE_URL` once.
4. Set `APP_ENV=production` and `AUTH_MODE=supabase` on Render.

---

## Manual test checklist (pre-submission)

Use this before demo or deploy:

- [ ] **Local mode:** open app signed out → create manual task → complete → earn bricks → place grid tile
- [ ] **Smart Parse:** create task with AI text, no Gemini key → badge shows Smart Parse → confirm saves task
- [ ] **Gemini:** with `GEMINI_API_KEY` → parse returns AI source → confirm saves task
- [ ] **Sign up / sign in:** Supabase auth works; Settings shows signed-in email
- [ ] **Cloud tasks:** signed in → create task → row appears in Supabase `tasks` table
- [ ] **Cloud load:** refresh page → tasks/inventory/grid load from backend
- [ ] **Sync local progress:** with local data → sign in → Sync → data appears in Postgres
- [ ] **Cross-device:** incognito + same account → same tasks load
- [ ] **Account deletion:** Settings → Delete account → user data removed
- [ ] **Health:** `GET /health` returns 200 on deployed backend
- [ ] **Build/tests:** `npm run build` and `pytest` pass

---

## Project structure

```
FocusHome/
├── backend/          FastAPI API, services, Postgres repositories
├── frontend/         React/Vite UI
├── docs/             PRD, MVP, deployment guide, screenshots
└── README.md         This file
```

---

## Documentation

| Doc | Description |
|-----|-------------|
| [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) | Render + Vercel + Supabase deployment |
| [`backend/README.md`](backend/README.md) | API endpoints, env vars, curl examples |
| [`docs/focushome_prd.md`](docs/focushome_prd.md) | Product requirements |
| [`docs/focushome_mvp.md`](docs/focushome_mvp.md) | MVP scope |
| [`docs/screenshots/`](docs/screenshots/) | Screenshot placeholders |

---

## Optional future work (out of scope)

These are **not** required for the current submission:

- **Play Store / PWA** — installable mobile app wrapper
- **Custom SMTP** — production email delivery (Supabase built-in email has rate limits)
- **Advanced analytics** — usage dashboards, A/B testing

---

## Screenshots

Add demo screenshots under `docs/screenshots/` (see `docs/screenshots/README.md`).
