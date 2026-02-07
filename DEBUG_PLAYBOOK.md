# Proctor – Debug Playbook

Use this when isolating and fixing bugs in the Proctor app (Vite frontend + Express backend + Postgres).

---

## 1. Fastest Reproduction Workflow

1. **Reproduce locally first** (if possible):
   - Backend: `cd backend && npm run dev` (port 3000).
   - Frontend: `cd frontend && npm run dev` (port 5173).
   - DB: Local Postgres with schema + migrations applied; `.env` in `backend/` with `DATABASE_*`, `JWT_SECRET`, `ALLOWED_ORIGINS=http://localhost:5173`.
2. **Reproduce on Railway**: Use same flow (login → exam → submit or admin flows); compare env (see PROJECT_PROFILE for vars).
3. **Narrow scope**: Note exact step (e.g. “click Submit” or “load session detail”) and whether it fails only in prod, only locally, or both.

---

## 2. Isolate Frontend vs Backend vs DB

| Layer | How to isolate |
|-------|-----------------|
| **Frontend** | Open DevTools → Network: see request URL, method, status, response body. Check Console for JS errors. Disable cache; try in incognito to rule out stale token/storage. |
| **Backend** | Check server logs (see §4). Call API with curl/Postman using same URL/headers/body as the failing request (copy from Network tab). |
| **DB** | Backend logs show query errors (`backend/src/config/database.ts` logs on error). Run equivalent SQL in `psql` (e.g. `psql $DATABASE_URL` or local `psql -d proctor_db`) to verify schema and data. |

**Quick checks**:
- Backend health: `GET http://localhost:3000/health` (or Railway backend URL).
- DB from backend: Startup log “Database connection: OK” vs “FAILED”; if FAILED, DB env or connectivity.
- CORS: If browser shows CORS error, backend `ALLOWED_ORIGINS` must include the frontend origin (e.g. `http://localhost:5173` or Railway frontend URL).

---

## 3. Recommended Logging Points

- **Backend**
  - **Request entry**: Add a single middleware that logs `method`, `path`, `query`, and (if safe) a short `body` summary before routes. Optionally log `Authorization: Bearer ***` only.
  - **Auth**: `backend/src/middleware/auth.middleware.ts` – log when token missing / invalid / expired (already returns 401/403; adding one log line per branch helps).
  - **DB**: `backend/src/config/database.ts` – already logs in dev (`NODE_ENV=development`) per query; in prod, consider logging only on error or slow queries.
  - **Errors**: `backend/src/app.ts` – global error handler already `console.error('❌ Error:', err)`; ensure errors are passed with `next(error)` from controllers.
  - **Session/response/violation**: `session.service.ts`, `response.service.ts`, `violation.service.ts` – already have some `console.error`/`console.log`; add one line at start of each handler (e.g. “saveResponse sessionId=…”) to trace flow.
- **Frontend**
  - **API base URL**: Log `import.meta.env.VITE_API_URL` once at app init (or in api.ts) to confirm build-time env in prod.
  - **Auth**: Before each protected API call, log which token is used (e.g. “using admin token” vs “using student token”) – or at least that a token is present – to catch wrong-token bugs.
  - **Critical actions**: One log before `sessionApi.submitExam`, `responseApi.saveResponse`, etc., with ids (sessionId, questionId) to correlate with backend logs.

---

## 4. Error Boundaries and API Error Handling

- **Frontend**: No React error boundary found in the scanned code. Errors in components surface as uncaught exceptions; API errors are handled in Axios interceptors (`frontend/src/lib/api.ts`): 401 with `TOKEN_EXPIRED` clears exam data and redirects to `/login`; other errors propagate to callers (toast/UI).
- **Backend**: Express global error handler in `backend/src/app.ts` (after routes):
  - Maps known error messages (`UNAUTHORIZED_EMAIL`, `INVALID_CREDENTIALS`, `INVALID_TOKEN`, `NO_ACTIVE_EXAM`, `SESSION_NOT_FOUND`) to 4xx and `code`.
  - Default 500; in development sends `err.message` and `stack`; in production only “Internal server error”.
- **Controllers**: Use `next(error)` to pass errors to the global handler (e.g. `session.controller.ts`, `auth.controller.ts`). Services throw; controllers catch and call `next(error)`.

---

## 5. Debug Chokepoints (in code order)

| Location | What to check |
|----------|----------------|
| **CORS** | `backend/src/app.ts` – `config.cors.allowedOrigins` must include frontend origin. Wrong origin → CORS error in browser, request may not reach backend. |
| **Rate limit** | `backend/src/middleware/rateLimit.middleware.ts` – 401/429 with message “Too many requests” or “login attempts”; check window/max in config and that you’re not sharing one IP in prod. |
| **Auth** | `backend/src/middleware/auth.middleware.ts` – `authenticateToken` (Bearer), `requireStudent`, `requireAdmin`. 401 = missing/invalid/expired token; 403 = wrong type (e.g. student calling admin route). Check `Authorization` header and that frontend sends the right token (student vs admin). |
| **Token storage (frontend)** | Student: `storage` with key `proctor_token` (via `STORAGE_KEYS.TOKEN`); Admin: `localStorage` key `proctor_admin_token`. `api.ts` uses `proctor_admin_token` then `proctor_token`. If both exist, admin wins – can cause “student request sent with admin token” or vice versa. |
| **Body/query validation** | `backend/src/middleware/validate.middleware.ts` – Zod schemas in `validators/`. 400 with “Validation error” + `errors[]`; fix body/query or schema. |
| **DB client** | `backend/src/config/database.ts` – pool config from env; `healthCheck()` at startup. Connection failures or missing env (e.g. on Railway) show in startup log and in query error logs. |
| **Route order** | `backend/src/routes/session.routes.ts`: `GET /check/:examId` must be registered **before** `GET /:sessionId`, else “check” is interpreted as sessionId. Same idea elsewhere: more specific routes before parametric ones. |

---

## 5b. Likely Bug Hotspots (from code scan)

| Area | Risk | Where (file: lines or area) |
|------|------|------------------------------|
| **Auth / session** | Token mix-up (admin vs student) | `frontend/src/lib/api.ts` 41–42: uses `proctor_admin_token` first, then `proctor_token`. If both exist, admin token is sent for student routes (or vice versa depending on route). |
| **Auth** | Student token stored with prefix | `frontend/src/lib/storage.ts`: student uses `STORAGE_KEYS.TOKEN` → key is `proctor_token`. `api.ts` reads raw `localStorage.getItem('proctor_token')` – consistent, but clearing must use same key (see `utils.ts` clearAllExamData). |
| **Server/client boundary** | API URL at build time | Frontend uses `import.meta.env.VITE_API_URL`; if not set at build on Railway, production bundle may call `http://localhost:3000/api`. |
| **Caching/revalidation** | None in API layer | No explicit cache headers on API responses; SPA is static. Stale data usually from React state or localStorage (e.g. old token/session). |
| **Env vars** | Railway vs local DB config | Backend expects `DATABASE_HOST`, `DATABASE_NAME`, `DATABASE_USER`, `DATABASE_PASSWORD` (`backend/src/config/database.ts` 6–11, `config/environment.ts` 10–18). Railway Postgres often exposes only `DATABASE_URL` – not read anywhere in backend src. |
| **Railway Postgres pooling** | Pool size / timeouts | `backend/src/config/database.ts`: `max: 20`, `idleTimeoutMillis: 30000`, `connectionTimeoutMillis: 2000`. Railway free tier may limit connections; many concurrent requests could exhaust pool or time out. |
| **Migrations drift** | Migrations in two places | Root: `database-schema.sql`, `database-migration-*.sql`; also `backend/database-migration-*.sql`. Running only root migrations (or only backend) can leave prod missing columns/tables. |
| **Route ordering** | Param catches literal path | `backend/src/routes/session.routes.ts`: `GET /check/:examId` is defined before `GET /:sessionId` – correct. If any route is added as `GET /:sessionId` before more specific paths, “check” would be treated as sessionId. |
| **Global error handler** | Dev vs prod message | `backend/src/app.ts` 86–136: in production only “Internal server error” is sent; stack/details only in development. Rely on server logs for prod. |
| **Unhandled rejections** | Process exit | `backend/src/server.ts` 59–62: unhandled rejection exits process. Any uncaught async error in a route/service can bring down the server. |

---

## 6. Common Failure Modes and How to Confirm

| Failure mode | How to confirm | Files / notes |
|--------------|----------------|---------------|
| **DB connection (e.g. Railway)** | Backend startup: “Database connection: FAILED”. Or first request that hits DB throws. | `server.ts`, `config/database.ts`. Railway often gives `DATABASE_URL`; this app uses `DATABASE_HOST`, `DATABASE_NAME`, `DATABASE_USER`, `DATABASE_PASSWORD`. Set those (or add DATABASE_URL parsing). |
| **Wrong token type** | Student flow returns 403 “Student access required” or admin route returns “Admin access required”; or opposite. | Check Network tab: which token is in `Authorization`. Check frontend: admin vs student routes and that logout clears the right token. `api.ts` line 41–42: admin token preferred over student. |
| **Token expired** | 401 with `code: 'TOKEN_EXPIRED'`. Frontend redirects to `/login` and clears exam data. | `auth.middleware.ts` (jwt.verify); frontend interceptor in `api.ts`. |
| **CORS** | Browser console: CORS error; request may be “preflight” OPTIONS or first GET/POST. | Backend `app.ts` CORS config; `ALLOWED_ORIGINS` must include exact frontend origin (including port). |
| **Session not found / wrong session** | 404 SESSION_NOT_FOUND or 403 ACCESS_DENIED. | Ensure `sessionId` in URL/body is the one created for this student; check `exam_sessions` in DB and that frontend stores and sends the same session id. |
| **Responses not saving** | UI shows saved but DB or admin view doesn’t. | Check `POST /api/responses/save` or `/bulk` in Network (status 200? body?). Backend `response.service.ts` and DB table `session_responses`; check for validation (Zod) or DB constraint errors in logs. |
| **Submit exam fails** | Submit button → 4xx/5xx or no completion. | Check `POST /api/sessions/:sessionId/submit` body and response. `session.service.ts` completeSession; check for score function or transaction errors in logs. |
| **Admin login 401** | “Invalid credentials” or 401. | Verify admin exists in `admin_users` and password hash (e.g. `scripts/verify-admin-password.ts`). Check `auth.service.ts` authenticateAdmin. |
| **Migration drift** | Local works, Railway fails (e.g. column missing). | Compare schema: run migrations in same order locally and on Railway; ensure Railway DB has all migrations applied. |
| **Frontend env (VITE_API_URL)** | Production frontend calls wrong API URL (e.g. localhost). | Build-time env: `VITE_API_URL` must be set when running `npm run build` on Railway so it’s baked into the client bundle. |

---

## 7. Debugging Checklist

- [ ] Reproduced the bug (exact steps + environment: local vs Railway).
- [ ] Checked browser Network: request URL, method, status, response body for the failing call.
- [ ] Checked browser Console for JS or CORS errors.
- [ ] Checked backend logs for the same request (method + path + status/error).
- [ ] Verified env: backend `DATABASE_*` (or `DATABASE_URL` if added), `JWT_SECRET`, `ALLOWED_ORIGINS`; frontend `VITE_API_URL` at build time.
- [ ] Verified token: correct type (student vs admin) and not expired; storage keys `proctor_token` vs `proctor_admin_token` and clearing on logout.
- [ ] If DB-related: confirmed schema/migrations applied; ran equivalent SQL locally or against Railway DB.
- [ ] If only on Railway: compared env vars, DB state, and migration order with local.

---

## 8. After You Have the Bug Report

When you have:
- **Exact symptom** (error message or wrong behavior),
- **Where it happens** (page/route, API endpoint),
- **Environment** (local vs Railway),
- **Relevant logs** (backend + Railway),

you can form **top 3 hypotheses** and **one fast test per hypothesis** (e.g. “If CORS: add frontend URL to ALLOWED_ORIGINS and redeploy”; “If token: log Authorization header in middleware”; “If DB: run health check and one SELECT in psql”). Use the table in §6 to match failure modes to fixes.
