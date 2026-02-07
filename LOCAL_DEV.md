# Local development setup

Run backend + frontend locally, fix issues, then deploy to Railway when ready.

---

## Quick start (automated)

**Requires:** Node.js 18+, Docker Desktop (running), npm

1. **Start Docker Desktop** (so the Docker daemon is running).

2. **One-time setup** (Postgres, schema, migrations, backend .env):
   ```bash
   ./scripts/local-setup.sh
   ```

3. **Create an admin** (one time; enter email and password when prompted):
   ```bash
   cd backend && npm run create-admin
   ```

4. **Start the app** (backend + frontend in one terminal; Ctrl+C stops both):
   ```bash
   ./scripts/start-dev.sh
   ```
   Then open **http://localhost:5173**.

---

## Manual setup (if you prefer or don’t use Docker)

### 1. Prerequisites

- **Node.js 18+**
- **PostgreSQL** (local install or Docker)
- **npm** (comes with Node)

### 2. Database

### Option A: Docker (easiest)

From the **repo root**:

```bash
# Start Postgres
docker run --name proctor-db -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=proctor_db -p 5432:5432 -d postgres:14

# Wait a few seconds, then run schema + migrations (from repo root)
sleep 3
psql -h localhost -U postgres -d proctor_db -f database-schema.sql
psql -h localhost -U postgres -d proctor_db -f database-migration-optional-student-name.sql
psql -h localhost -U postgres -d proctor_db -f database-migration-student-groups.sql
psql -h localhost -U postgres -d proctor_db -f database-migration-add-use-group-access.sql
psql -h localhost -U postgres -d proctor_db -f backend/database-migration-exam-report-colors-use-session-id.sql
psql -h localhost -U postgres -d proctor_db -f backend/database-migration-session-question-notes.sql
```

Password when prompted: `postgres`.

### Option B: Local PostgreSQL

```bash
# Create DB
createdb proctor_db

# Run schema + migrations (from repo root)
psql -d proctor_db -f database-schema.sql
psql -d proctor_db -f database-migration-optional-student-name.sql
psql -d proctor_db -f database-migration-student-groups.sql
psql -d proctor_db -f database-migration-add-use-group-access.sql
psql -d proctor_db -f backend/database-migration-exam-report-colors-use-session-id.sql
psql -d proctor_db -f backend/database-migration-session-question-notes.sql
```

---

## 3. Backend .env

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env`:

- Set **JWT_SECRET** to any long random string (e.g. `openssl rand -hex 32`).
- If using Docker Postgres: **DATABASE_PASSWORD=postgres** (and keep host/port/name/user as in .env.example).
- **ALLOWED_ORIGINS** can stay `http://localhost:5173`.

You do **not** need DATABASE_URL locally; the four DATABASE_* vars are enough.

---

## 4. Create admin user

From **repo root** (after DB is set up):

```bash
# Option A: SQL (set your own password hash in insert-admin.sql, then:)
psql -h localhost -U postgres -d proctor_db -f insert-admin.sql

# Option B: Backend script (recommended – it hashes password for you)
cd backend
npm run create-admin
# Follow prompts for email and password
```

---

## 5. Start backend

```bash
cd backend
npm install
npm run dev
```

You should see:

- `✅ Environment variables validated`
- `✅ Database connection: OK`
- `Server: http://localhost:3000`

Leave this terminal open.

---

## 6. Start frontend

In a **second terminal**:

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173**. The app uses `frontend/.env.local`, which points **VITE_API_URL** at `http://localhost:3000/api` (local backend).

---

## 7. Verify

1. **Health**: http://localhost:3000/health → `{"status":"healthy",...}`
2. **Student login**: Use an email you added as a student (via admin or DB).
3. **Admin login**: Use the admin email/password you created in step 4.
4. **Exam report**: As admin, open an exam and go to Report – should load (no 500).

---

## 8. When you’re ready to deploy

1. Commit and push; Railway deploys from your repo.
2. On Railway, backend env: set **DATABASE_URL** from the Postgres service (or keep DATABASE_* if you set them). Set **JWT_SECRET** and **ALLOWED_ORIGINS** (include your frontend URL and `http://localhost:5173` if you debug against prod).
3. Run the **same migrations** on Railway Postgres if you haven’t already (e.g. connect with `psql $DATABASE_URL` and run the same `.sql` files).

---

## Troubleshooting

| Issue | Check |
|-------|--------|
| Backend: "Missing required environment variables" | You need either DATABASE_URL or DATABASE_HOST + DATABASE_NAME + DATABASE_USER. For local, use the four vars in .env. |
| Backend: "Database connection: FAILED" | Postgres is running; host/port/user/password in .env match your DB. |
| Frontend: 404 on /api/... | Frontend is using .env.local with VITE_API_URL=http://localhost:3000/api. Restart Vite after changing .env.local. |
| CORS errors | Backend ALLOWED_ORIGINS includes http://localhost:5173. |
| Exam report 500 | Run `backend/database-migration-exam-report-colors-use-session-id.sql` so the `exam_report_cell_colors` table exists. |
