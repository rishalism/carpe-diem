# carpe diem

A private digital journaling platform built around **Spaces** — permission-based
journal areas you keep alone or share with a partner, family, or friends. Write
entries, track moods, tag memories, and (in later phases) react, comment, attach
photos, and run optional AI writing enhancement.

Privacy-first, free-tier deployable: **Vercel** (frontend) + **Render** (backend)
+ **Supabase** (Postgres & Storage).

---

## Project status — phased build

This repo is being built in runnable phases. **Phase 1 is complete and runs
end-to-end.**

| Phase | Scope | Status |
|------:|-------|--------|
| **1** | Auth (JWT), Spaces (CRUD + roles), Journal entries (CRUD, moods, tags), full DB schema, frontend app shell | ✅ Done |
| **2** | Comments (nested), reactions, invitations, notifications | ✅ Done |
| **3** | AI enhancement (OpenRouter, non-blocking), photo/file attachments (Supabase + local fallback), global search & filters | ✅ Done |
| **4** | Dashboard widgets (streak, mood overview, on-this-day, recent), settings (notif prefs, password, export, delete), timeline views (list/feed/calendar), Google OAuth, password reset | ✅ Done |

All four phases are complete. carpe diem is feature-complete per the original spec.

The **full database schema** for all phases is already designed in
`backend/app/models/` — later phases add services/routers/UI on top of it.

---

## Tech stack

- **Frontend:** React 18, Vite, TypeScript, Tailwind CSS, React Router v6, Axios, Zustand
- **Backend:** FastAPI, SQLAlchemy 2.0, Alembic, Pydantic v2, JWT (python-jose), bcrypt (passlib)
- **Database:** SQLite locally (zero setup) → Supabase PostgreSQL in production
- **Storage:** local `./uploads` fallback → Supabase Storage in production

---

## Repository layout

```
carpe diem/
├── backend/          FastAPI app (routers → services → repositories → models)
│   └── app/
├── frontend/         React + Vite app (pages, components, stores, services)
│   └── src/
├── render.yaml       Render blueprint (backend)
├── SETUP.md          Provisioning Supabase / OAuth / OpenRouter + deployment
└── README.md
```

The backend follows a clean layering: **router** (HTTP) → **service** (business
logic + authorization) → **repository** (data access) → **model**. Authorization
lives in the service layer (e.g. `SpaceService.require_member`).

---

## Quickstart (local, no external accounts needed)

### 1. Backend

```bash
cd backend
python -m venv .venv
# Windows:  .venv\Scripts\activate
# macOS/Linux:  source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env          # defaults to local SQLite — no edits required
uvicorn app.main:app --reload
```

API runs at <http://localhost:8000> — interactive docs at
<http://localhost:8000/docs>. On SQLite the tables are created automatically on
startup; for Postgres use `alembic upgrade head`.

### 2. Frontend

```bash
cd frontend
npm install
cp .env.example .env          # VITE_API_URL defaults to http://localhost:8000/api
npm run dev
```

App runs at <http://localhost:5173>. Register an account, create a space, and
write your first entry.

---

## Deployment

See **[SETUP.md](SETUP.md)** for step-by-step provisioning of Supabase
(Postgres + Storage), Google OAuth, and OpenRouter, plus deploying the backend
to Render and the frontend to Vercel.

---

## API overview (Phase 1)

| Method | Path | Description |
|-------|------|-------------|
| POST | `/api/auth/register` | Create account → tokens |
| POST | `/api/auth/login` | Sign in → tokens |
| POST | `/api/auth/refresh` | Exchange refresh token → new tokens |
| GET/PATCH | `/api/users/me` | Get / update current profile |
| GET/POST | `/api/spaces` | List / create spaces |
| GET/PATCH/DELETE | `/api/spaces/{id}` | Get / update / delete a space |
| GET | `/api/spaces/{id}/members` | List members |
| GET/POST | `/api/spaces/{id}/entries` | List / create entries |
| GET/PATCH/DELETE | `/api/spaces/{id}/entries/{entryId}` | Entry operations (edit/delete own only) |

Auth endpoints are rate-limited (10/min per IP).
