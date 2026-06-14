# FocusHome

**UpSchool Modul 301 — final submission**

FocusHome is a productivity app with gamified home-building. Users create **focus sessions** (manually or with AI), run a **focus timer**, earn **XP and bricks**, and use those resources to **build and decorate** a virtual home. The app works in **local mode** on one device without an account, or with **Supabase sign-in** to sync progress across devices.

**Hosting:** Vercel (frontend) · Render (backend) · Supabase (auth + Postgres). No AWS.

---

## Live demo

| Resource | URL |
|----------|-----|
| **Live app (frontend)** | https://future-talent-modul301-focus-home.vercel.app |
| **Backend API** | https://focushome-backend.onrender.com |
| **Health check** | https://focushome-backend.onrender.com/health |

> **Note:** The backend runs on Render’s free tier and **may sleep after inactivity**. The first request after sleep can take 30–60 seconds while the service wakes up. Refresh or wait briefly if the app feels slow on first load.

---

## How to use the live app

1. Open https://future-talent-modul301-focus-home.vercel.app
2. **Local mode:** use the app immediately — no sign-in required. Progress stays on this browser/device.
3. **Create a session:**
   - **Manual:** enter title, duration, difficulty.
   - **AI Plan Assistant:** describe your plan in natural language → review the suggestion → confirm.
4. **Focus:** select a session → **Start** the timer → **Complete** when finished (or abandon if needed).
5. **Rewards:** completing sessions earns XP and bricks (and related resources by difficulty).
6. **Build Mode:** spend earned resources to progress your home (walls, stack building, etc.).
7. **My Home:** decorate and customize your FocusHome layout.
8. **History / archive:** view past activity and completed homes where available.
9. **Cloud sync (optional):** Settings → create account or **Sign in** → your tasks, inventory, and home sync to Supabase Postgres.
10. **Sync local progress:** if you played locally first, sign in → Settings → **Sync local progress** to upload anonymous local data to your account once.
11. **Language:** switch between **English** and **Turkish** in Settings.

---

## Main features

- **Local mode without account** — full gameplay on this device via browser storage
- **Supabase email/password auth** — optional sign-up and sign-in
- **Cloud sync for signed-in users** — tasks, inventory, grid, and home state in Postgres
- **Local-to-cloud progress sync** — one-click migration after sign-in
- **Manual focus session creation** — preset durations (15 / 30 / 45 / 60 min), difficulty, optional calendar link
- **Gemini AI task parsing** — natural language → structured session (`gemini-2.5-flash-lite`)
- **Smart Parse fallback** — deterministic heuristic parsing if AI is unavailable, times out, or hits quota
- **Focus timer and completion rewards** — XP, bricks, level progression
- **Build Mode / home progression** — stack building and tier progress
- **My Home decoration editor** — place and manage decorations
- **History and archive** — activity history and completed homes
- **English / Turkish** — full UI language support
- **Account deletion** — remove cloud data and Supabase auth user (Settings)

---

## Tech stack

| Layer | Technology |
|-------|------------|
| Frontend | React + Vite |
| Backend | FastAPI (Uvicorn) |
| Auth | Supabase Auth (JWT) |
| Database | Supabase Postgres (cloud); localStorage (local mode) |
| AI | Google Gemini API + Smart Parse fallback |
| Hosting | **Vercel** (frontend), **Render** (backend) |

---

## Local setup

### Prerequisites

- Python 3.11+
- Node.js 18+
- Optional: Supabase project, Gemini API key

### Backend

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
```

Fill in `backend/.env` (see [Environment variables](#environment-variables)), then:

```powershell
python scripts/init_db.py
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

- API: http://127.0.0.1:8000  
- Swagger: http://127.0.0.1:8000/docs  

### Frontend

```powershell
cd frontend
npm install
copy .env.example .env
```

Fill in `frontend/.env`, then:

```powershell
npm run dev
```

- UI: http://127.0.0.1:5173  

**Start the backend first**, then the frontend.

---

## Environment variables

Copy `*.env.example` → `.env` in each folder. **Commit `.env.example` files only — never commit real `.env` files or secrets.**

| Rule | Detail |
|------|--------|
| Frontend secrets | **Never** put service role key, `DATABASE_URL`, JWT secret, or Gemini API key in frontend |
| Backend env changes | Restart the backend (`uvicorn`) after editing `backend/.env` |
| Frontend env changes | Rebuild or redeploy Vite (`npm run build` / Vercel redeploy) after changing `VITE_*` vars |

### Frontend (`frontend/.env`)

| Variable | Purpose |
|----------|---------|
| `VITE_API_BASE_URL` | Backend URL — local: `http://127.0.0.1:8000`; production: `https://focushome-backend.onrender.com` |
| `VITE_SUPABASE_URL` | Supabase project URL (anon/public — from Supabase dashboard) |
| `VITE_SUPABASE_ANON_KEY` | Supabase **anon public** key only |

### Backend (`backend/.env`)

| Variable | Purpose |
|----------|---------|
| `APP_ENV` | `development` or `production` |
| `AUTH_MODE` | `supabase` for production (JWT required on protected routes) |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only admin key (account deletion) — **never frontend** |
| `SUPABASE_JWT_SECRET` | JWT secret from Supabase API settings |
| `DATABASE_URL` | Supabase Postgres connection string (Session pooler recommended) |
| `AI_PROVIDER` | `gemini` (default) |
| `GEMINI_API_KEY` | Google Gemini API key (optional — Smart Parse if missing) |
| `GEMINI_MODEL` | Default **`gemini-2.5-flash-lite`** |
| `CORS_ORIGINS` | Comma-separated allowed origins — must include Vercel URL in production |

See [`backend/.env.example`](backend/.env.example) and [`frontend/.env.example`](frontend/.env.example) for templates.

### Database init

Required for signed-in cloud persistence:

```bash
cd backend
python scripts/init_db.py
```

Creates tables in Supabase Postgres (`user_profiles`, `tasks`, `inventories`, `active_homes`, `completed_homes`, `preferences`, `activity_events`).

---

## Test and build

```powershell
# Backend tests
cd backend
python -m pytest tests/ -q

# Frontend production build
cd frontend
npm run build
```

---

## Deployment notes

| Component | Platform | Notes |
|-----------|----------|-------|
| Frontend | **Vercel** | Build: `npm run build`, output: `dist`. Env: **`VITE_*` only** (public values). |
| Backend | **Render** | Start: `uvicorn main:app --host 0.0.0.0 --port $PORT`. All secrets in Render env. |
| Auth + DB | **Supabase** | Same project for Auth, JWT secret, service role, and `DATABASE_URL`. |

**Production checklist:**

1. **Render** — set `APP_ENV=production`, `AUTH_MODE=supabase`, Supabase keys, `DATABASE_URL`, `GEMINI_*`, `CORS_ORIGINS`.
2. **Vercel** — set `VITE_API_BASE_URL=https://focushome-backend.onrender.com`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`; redeploy after changes.
3. **CORS** — `CORS_ORIGINS` on Render must include `https://future-talent-modul301-focus-home.vercel.app` (no trailing slash).
4. **Supabase Auth** — Site URL / redirect URLs should include the Vercel domain and `http://localhost:5173` for local dev.
5. Run `python scripts/init_db.py` once against production `DATABASE_URL`.

Full guide: [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md)

---

## Troubleshooting

| Problem | What to do |
|---------|------------|
| Live app calls `localhost` | `VITE_API_BASE_URL` is wrong on Vercel — fix and **redeploy** frontend |
| Browser CORS error | Add exact Vercel origin to Render `CORS_ORIGINS` — **redeploy** backend |
| AI badge shows **Smart Parse** | Gemini may be unavailable, quota exceeded, or key missing — app still works via fallback |
| Gemini model **404** | Set `GEMINI_MODEL=gemini-2.5-flash-lite` on Render and restart |
| Supabase tables empty | Run `python scripts/init_db.py` with correct `DATABASE_URL` |
| Auth fails (ES256 / JWKS) | Ensure `cryptography` is installed (`pip install -r requirements.txt`) and `SUPABASE_JWT_SECRET` + `SUPABASE_URL` match your project |
| First live request very slow | Render free tier cold start — wait and retry |

---

## Project structure

```
FocusHome/
├── backend/          FastAPI API, services, Postgres repositories
├── frontend/         React/Vite UI
├── docs/             PRD, deployment guide, screenshots
└── README.md
```

---

## Documentation

| Doc | Description |
|-----|-------------|
| [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) | Render + Vercel + Supabase setup |
| [`backend/README.md`](backend/README.md) | API endpoints, curl examples |
| [`docs/focushome_prd.md`](docs/focushome_prd.md) | Product requirements |
| [`docs/focushome_mvp.md`](docs/focushome_mvp.md) | MVP scope |

---

## Final status

**Working in production and locally:**

- Local mode, Supabase auth, Postgres cloud sync, Gemini AI parse, Smart Parse fallback
- Backend tests and frontend build pass

### Optional future work (out of scope)

- **PWA / mobile app / Play Store** — installable native-style experience
- **Custom SMTP** — reliable production email (Supabase built-in email has rate limits)
- **More decoration assets** — expanded catalog and themes
- **Analytics and notifications** — usage insights and reminder push

---

## Screenshots

Demo screenshots: [`docs/screenshots/`](docs/screenshots/)
