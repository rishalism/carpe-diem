# Setup & Deployment Guide

carpe diem runs locally with **zero external accounts** (SQLite + local file
storage). You only need the services below when you deploy to production or want
to enable AI / cloud storage / Google sign-in.

---

## Environment variables

### Backend (`backend/.env`, copy from `.env.example`)

| Variable | Required | Notes |
|----------|----------|-------|
| `ENVIRONMENT` | yes | `development` or `production` |
| `DATABASE_URL` | yes | Defaults to `sqlite:///./carpe_diem.db`. Use the Supabase connection string in prod. |
| `JWT_SECRET_KEY` | yes | **Change in production.** Generate: `python -c "import secrets; print(secrets.token_urlsafe(64))"` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | no | Default 15 |
| `REFRESH_TOKEN_EXPIRE_DAYS` | no | Default 7 |
| `CORS_ORIGINS` | yes | Comma-separated frontend origins, e.g. `https://your-app.vercel.app` |
| `OPENROUTER_API_KEY` / `OPENROUTER_MODEL` | Phase 3 | AI writing enhancement |
| `SUPABASE_URL` / `SUPABASE_SERVICE_KEY` / `SUPABASE_STORAGE_BUCKET` | Phase 3 | Photo attachments (local `./uploads` fallback otherwise) |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` / `GOOGLE_REDIRECT_URI` | Phase 4 | Google sign-in |
| `FRONTEND_URL` | yes (prod) | Used for invitation/reset links |

### Frontend (`frontend/.env`, copy from `.env.example`)

| Variable | Required | Notes |
|----------|----------|-------|
| `VITE_API_URL` | yes | Backend base URL incl. `/api`, e.g. `https://carpe-diem-api.onrender.com/api` |

---

## 1. Supabase (PostgreSQL + Storage)

1. Create a project at <https://supabase.com> (free tier).
2. **Database:** Project Settings → Database → Connection string (URI). Use it as
   `DATABASE_URL`, prefixed for psycopg2:
   ```
   postgresql+psycopg2://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres
   ```
3. Run migrations against it:
   ```bash
   cd backend
   DATABASE_URL="postgresql+psycopg2://..." alembic upgrade head
   ```
   (On Windows PowerShell: `$env:DATABASE_URL="..."; alembic upgrade head`)
4. **Storage (Phase 3):** Storage → create a bucket named `carpe-diem`. Copy the
   project URL → `SUPABASE_URL` and the **service_role** key → `SUPABASE_SERVICE_KEY`.
   Keep the service key secret (backend only).

## 2. OpenRouter (AI enhancement, Phase 3)

1. Sign up at <https://openrouter.ai> and create an API key → `OPENROUTER_API_KEY`.
2. Pick a model id for `OPENROUTER_MODEL` (e.g. a free or low-cost instruct model).
   AI runs as a non-blocking background task; entries always save immediately.

## 3. Google OAuth (Phase 4)

1. Google Cloud Console → APIs & Services → Credentials → OAuth client ID (Web).
2. Authorized redirect URI: your frontend callback, e.g.
   `https://your-app.vercel.app/auth/google/callback`.
3. Copy client id/secret → `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`.

---

## Deploying the backend to Render

1. Push this repo to GitHub.
2. In Render: **New → Blueprint**, point at the repo. `render.yaml` provisions a
   Dockerized web service from `backend/`.
3. Set the secret env vars in the dashboard: `DATABASE_URL`, `JWT_SECRET_KEY`,
   `CORS_ORIGINS` (your Vercel URL), `FRONTEND_URL`, plus any Phase 3/4 keys.
4. Deploy. The container runs `alembic upgrade head` then starts uvicorn. Health
   check: `/health`.

## Deploying the frontend to Vercel

1. In Vercel: **New Project** → import the repo → set **Root Directory** to
   `frontend`. The framework (Vite) and `vercel.json` handle the rest (SPA
   rewrites + build).
2. Add env var `VITE_API_URL` = your Render API URL + `/api`.
3. Deploy, then add the resulting Vercel URL to the backend's `CORS_ORIGINS`.

> **Netlify alternative:** build command `npm run build`, publish directory
> `dist`, and add a SPA redirect (`/* /index.html 200`).

---

## Regenerating the database migration

The initial Alembic migration is generated from the models. To regenerate after
schema changes:

```bash
cd backend
alembic revision --autogenerate -m "describe change"
alembic upgrade head
```
