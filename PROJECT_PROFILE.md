# Proctor – Project Profile

**Purpose**: Proctored exam system: students take timed exams with proctoring (violations), admins manage exams, questions, students, groups, sessions, and reports.

**Stack**:
- **Frontend**: React 18, Vite 5, TypeScript, React Router 6, Zustand, Tailwind, Axios, react-hot-toast
- **Backend**: Node.js, Express, TypeScript, JWT (jsonwebtoken), bcryptjs, pg (raw PostgreSQL)
- **DB**: PostgreSQL (raw SQL, no ORM)
- **Deploy**: Railway (separate services: Postgres, backend, frontend)

**Note**: This is **not** Next.js. Frontend is Vite + React; backend is a separate Express API.

---

## Folder Responsibilities

| Path | Role |
|------|------|
| **`/frontend`** | SPA: `src/App.tsx` (React Router), `src/pages/`, `src/components/`, `src/lib/api.ts` + `adminApi.ts`, `src/stores/`, `src/hooks/` |
| **`/backend`** | Express API: `src/server.ts` → `app.ts`, `src/routes/`, `src/controllers/`, `src/services/`, `src/middleware/`, `src/validators/`, `src/config/` |
| **`/attachments`** (root) | Static images for exam questions (also copied/served from backend `/images`) |
| **Root `*.sql`** | `database-schema.sql` (base schema); `database-migration-*.sql`, `insert-admin.sql`, etc. |

---

## Backend Entry Points

- **Server**: `backend/src/server.ts` → `createApp()` from `app.ts`
- **API base path**: `/api`
- **Routes** (all under `/api`):
  - `auth.routes` → `/api/auth` (student login, admin login, verify, complete-profile)
  - `exam.routes` → `/api/exams` (e.g. get active exam)
  - `session.routes` → `/api/sessions` (start, check, get, recovery, snapshot, submit)
  - `response.routes` → `/api/responses` (save, bulk, get by session)
  - `violation.routes` → `/api/violations` (log, get by session, stats)
  - `admin.routes` → `/api/admin` (dashboard, exams, students, sessions, groups, report, snapshots)
  - `studentGroup.routes` → `/api/admin` (groups CRUD, members, exam-group links)

No server actions (this is Express, not Next.js).

---

## DB Layer

- **Driver**: `pg` (node-postgres) with a **connection pool** in `backend/src/config/database.ts`
- **No ORM**: All queries are raw SQL in services (e.g. `auth.service.ts`, `session.service.ts`, `response.service.ts`)
- **Schema**: `database-schema.sql` at repo root (students, exams, questions, question_options, exam_sessions, session_responses, proctoring_violations, admin_users, etc.)
- **Migrations**: Standalone SQL files in repo root and `backend/`:
  - `database-migration-student-groups.sql`
  - `database-migration-add-use-group-access.sql`
  - `database-migration-optional-student-name.sql`
  - `backend/database-migration-exam-report-colors-use-session-id.sql`
  - `backend/database-migration-session-question-notes.sql`
  - (and any other `database-migration-*.sql`)
- **Seeding**: `insert-admin.sql` (admin user); backend scripts: `create-admin.ts`, `verify-admin-password.ts`, `migrate-questions.ts` (if used)

---

## Env Vars

### Backend (`backend/.env`)

| Variable | Required | Where used | Notes |
|----------|----------|------------|--------|
| `DATABASE_HOST` | ✅ | `config/database.ts`, `config/environment.ts` | |
| `DATABASE_NAME` | ✅ | same | |
| `DATABASE_USER` | ✅ | same | |
| `DATABASE_PASSWORD` | ✅ (effectively) | same | Empty string default |
| `JWT_SECRET` | ✅ | `config/environment.ts`, auth middleware/services | Must not be default in prod |
| `NODE_ENV` | No | Multiple | Default `development` |
| `PORT` | No | `server.ts` | Default `3000` |
| `ALLOWED_ORIGINS` | No | `app.ts` CORS | Comma-separated; default `http://localhost:5173` |
| `JWT_EXPIRATION` | No | auth service | Default `2h` |
| `ADMIN_JWT_EXPIRATION` | No | auth service | Default `24h` |
| `RATE_LIMIT_*`, `AUTH_RATE_LIMIT`, etc. | No | rateLimit middleware, config | |
| `ADMIN_EMAIL` | No | config | |
| `LOG_LEVEL` | No | config | |

**Railway**: Railway Postgres often exposes `DATABASE_URL`. This app does **not** read `DATABASE_URL`; it expects `DATABASE_HOST`, `DATABASE_NAME`, `DATABASE_USER`, `DATABASE_PASSWORD`. On Railway you must set those (or add `DATABASE_URL` support and parse it in `database.ts`).

### Frontend (build-time, `VITE_*`)

| Variable | Where used | Notes |
|----------|------------|--------|
| `VITE_API_URL` | `src/lib/api.ts` | Default `http://localhost:3000/api` |
| `VITE_ENABLE_PROCTORING` | Feature flags | |
| `VITE_AUTOSAVE_INTERVAL_MS` | Auto-save | |
| `VITE_MIN_RECOVERY_TIME_MS` | Recovery | |

---

## Local vs Railway

- **Local**:
  - Backend: `cd backend && npm run dev` (nodemon + ts-node) → `http://localhost:3000`
  - Frontend: `cd frontend && npm run dev` (Vite) → `http://localhost:5173`
  - DB: Local Postgres or Docker; run `database-schema.sql` and migrations; set `DATABASE_*` and `ALLOWED_ORIGINS=http://localhost:5173`
- **Railway**:
  - Three services: PostgreSQL, Backend (root dir `backend`), Frontend (root dir `frontend`)
  - Backend: build `npm run railway:build` (or similar), start `node dist/server.js`; set env (including `DATABASE_*` or `DATABASE_URL` if you add support), `ALLOWED_ORIGINS` = frontend URL
  - Frontend: build with `VITE_API_URL=https://<backend-host>/api`, serve static from `dist` (e.g. `node server.js` or `npx serve -s dist -l $PORT`)
  - DB: Run schema + migrations against Railway Postgres (e.g. `psql $DATABASE_URL -f database-schema.sql`)

---

## Key User Flows (what’s implemented)

1. **Student login**  
   `/login` → `POST /api/auth/student/login` (email) → DB `students` check + JWT → token + student stored in localStorage (`proctor_token`, `proctor_student` via `storage.ts`).

2. **Profile completion**  
   If `needsProfileCompletion`: `/complete` → `POST /api/auth/student/complete-profile` (fullName) → update `students.full_name` → then redirect to exam.

3. **Start exam**  
   Get active exam `GET /api/exams/active` → `POST /api/sessions/start` → insert `exam_sessions` → store session in frontend; navigate to `/exam`.

4. **During exam**  
   - Auto-save: `POST /api/responses/save` or `/api/responses/bulk`; snapshots: `POST /api/sessions/:sessionId/snapshot`.
   - Violations: `POST /api/violations/log`.
   - Recovery: `GET /api/sessions/:sessionId/recovery` to restore state.

5. **Submit exam**  
   `POST /api/sessions/:sessionId/submit` → session status → completed, score calculated (DB function or service).

6. **Admin**  
   `/admin/login` → `POST /api/auth/admin/login` → JWT stored (`proctor_admin_token`, `proctor_admin_user`). Dashboard, exams, students, sessions, groups, exam report, snapshots all via `adminApi.ts` → `/api/admin/*` routes (auth middleware `requireAdmin`).

---

## How It Deploys on Railway

- **railway.json** (root): Nixpacks builder, 1 replica, restart on failure.
- Backend: Deploy from `backend/`; build + start as above; env from Railway (Postgres vars or `DATABASE_URL` if added).
- Frontend: Deploy from `frontend/`; `nixpacks.toml` defines build and `node server.js` to serve `dist`; `VITE_API_URL` must point to backend API URL at build time.
- No Dockerfiles in the described setup; Nixpacks used for build.

---

## Quick Commands

```bash
# Backend
cd backend && npm run dev          # dev
npm run build && npm start         # prod run
npm run create-admin               # create admin user

# Frontend
cd frontend && npm run dev         # dev
npm run build && npm start         # serve built app

# DB (local)
psql -d proctor_db -f database-schema.sql
# then run migration .sql files as needed
```

Reference: `QUICK_START_TESTING.md`, `RAILWAY_PREP_COMPLETE.md`, `backend/SETUP_GUIDE.md`.
