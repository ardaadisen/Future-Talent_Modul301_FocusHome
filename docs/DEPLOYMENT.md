# FocusHome — Deployment Guide

Deploy **frontend on Vercel**, **backend on Render**, **auth + database on Supabase**. No AWS.

---

## Overview

```
Browser  →  Vercel (React static)  →  Render (FastAPI)
                ↓                           ↓
           Supabase Auth              Supabase Postgres
           (anon key)                 (DATABASE_URL)
```

1. Create and configure a **Supabase** project (Auth + Postgres).
2. Deploy **backend** to Render with env vars from Supabase + Gemini.
3. Initialize Postgres tables with `init_db.py`.
4. Deploy **frontend** to Vercel with `VITE_API_BASE_URL` pointing at Render.
5. Add Vercel URL to backend `CORS_ORIGINS`.

---

## Step 1 — Supabase

### Create project

1. Go to [supabase.com](https://supabase.com) → New project.
2. Save the database password securely.

### Auth settings

1. **Authentication → Providers → Email** — enable Email provider.
2. For quick testing: disable *Confirm email*. For production: enable confirmation and configure **custom SMTP** (optional future work).
3. **Authentication → Settings** — set password rules as needed.

### Collect credentials

| Value | Where to find it | Used in |
|-------|------------------|---------|
| Project URL | Settings → API → Project URL | Backend `SUPABASE_URL`, Frontend `VITE_SUPABASE_URL` |
| Anon public key | Settings → API → anon public | Frontend `VITE_SUPABASE_ANON_KEY` only |
| Service role key | Settings → API → service_role | Backend `SUPABASE_SERVICE_ROLE_KEY` only — **never frontend** |
| JWT secret | Settings → API → JWT Settings → JWT Secret | Backend `SUPABASE_JWT_SECRET` |
| Database URI | Settings → Database → Connection string (Session pooler) | Backend `DATABASE_URL` |

Example shapes (placeholders only):

```
SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
DATABASE_URL=postgresql://postgres.YOUR_PROJECT_REF:YOUR_DB_PASSWORD@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?sslmode=require
```

---

## Step 2 — Backend on Render

### Create Web Service

1. [render.com](https://render.com) → New → **Web Service**.
2. Connect your Git repository.
3. Settings:

| Setting | Value |
|---------|-------|
| Root directory | `backend` |
| Runtime | Python 3 |
| Build command | `pip install -r requirements.txt` |
| Start command | `uvicorn main:app --host 0.0.0.0 --port $PORT` |
| Health check path | `/health` |

### Environment variables (Render dashboard)

Copy from `backend/.env.example`. Production values:

```env
APP_ENV=production
AUTH_MODE=supabase

SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_JWT_SECRET=your-jwt-secret
DATABASE_URL=postgresql://postgres.YOUR_PROJECT_REF:YOUR_PASSWORD@....pooler.supabase.com:6543/postgres?sslmode=require

AI_PROVIDER=gemini
GEMINI_API_KEY=your-gemini-key
GEMINI_MODEL=gemini-2.5-flash-lite
AI_HTTP_TIMEOUT_SECONDS=15

CORS_ORIGINS=https://YOUR_APP.vercel.app,http://localhost:5173
```

- Replace `YOUR_APP.vercel.app` with your actual Vercel domain after Step 4.
- Add `http://127.0.0.1:5173` only if you still test locally against production API.

### Initialize database

From your machine (with production `DATABASE_URL` in a local `backend/.env` or exported):

```bash
cd backend
python scripts/init_db.py
```

Verify tables in Supabase Table Editor.

### Verify backend

```bash
curl https://YOUR_API.onrender.com/health
curl https://YOUR_API.onrender.com/api/main
```

---

## Step 3 — Frontend on Vercel

### Create project

1. [vercel.com](https://vercel.com) → Add New → Project → import Git repo.
2. Settings:

| Setting | Value |
|---------|-------|
| Root directory | `frontend` |
| Framework | Vite |
| Build command | `npm run build` |
| Output directory | `dist` |

### Environment variables (Vercel dashboard)

Set at **build time** (Production + Preview):

```env
VITE_API_BASE_URL=https://YOUR_API.onrender.com
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```

**Important:** `VITE_*` variables are embedded at build time. Redeploy after changing them.

Do **not** set service role key or Gemini key on Vercel.

### Update CORS on Render

After Vercel gives you a URL (e.g. `https://focushome.vercel.app`):

1. Render → your service → Environment → edit `CORS_ORIGINS`:
   ```
   https://focushome.vercel.app,http://localhost:5173
   ```
2. Save → Render redeploys automatically.

---

## Step 4 — Post-deploy verification

Run the checklist from [README.md](../README.md#manual-test-checklist-pre-submission) against the live URLs.

Quick smoke test:

1. Open Vercel URL → app loads (local mode works without sign-in).
2. Create a task with Smart Parse or Gemini.
3. Sign up / sign in → create task → check Supabase `tasks` table.
4. Open browser DevTools → Network → confirm API calls go to Render URL with `Authorization: Bearer …` when signed in.

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| CORS error in browser | Add exact Vercel origin to `CORS_ORIGINS` on Render (include `https://`, no trailing slash) |
| 401 on all API calls | Check `SUPABASE_JWT_SECRET` matches Supabase dashboard; frontend/backend use same Supabase project |
| Tasks not in Postgres | Confirm `DATABASE_URL` on Render; run `init_db.py`; check Render logs |
| AI always Smart Parse | Set `GEMINI_API_KEY` on Render; check logs for `GEMINI_API_KEY present: true` |
| Frontend calls wrong API | Rebuild Vercel after fixing `VITE_API_BASE_URL` |
| Render cold start slow | Free tier spins down; first request may take ~30s |

---

## Local vs production env summary

| Variable | Backend | Frontend |
|----------|---------|----------|
| `SUPABASE_URL` | ✓ | via `VITE_SUPABASE_URL` |
| `SUPABASE_SERVICE_ROLE_KEY` | ✓ | ✗ never |
| `SUPABASE_JWT_SECRET` | ✓ | ✗ never |
| `DATABASE_URL` | ✓ | ✗ never |
| `GEMINI_API_KEY` | ✓ | ✗ never |
| `CORS_ORIGINS` | ✓ | ✗ |
| `VITE_API_BASE_URL` | ✗ | ✓ |
| `VITE_SUPABASE_ANON_KEY` | ✗ | ✓ |
