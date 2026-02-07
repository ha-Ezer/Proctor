#!/usr/bin/env bash
# One-time local setup: Postgres (Docker), schema + migrations, backend .env
set -e
cd "$(dirname "$0")/.."
REPO_ROOT="$(pwd)"

echo "=== Proctor local setup ==="

if ! command -v docker &>/dev/null; then
  echo "Docker is required. Install Docker Desktop (or Docker) and try again."
  exit 1
fi

# 1. Docker Postgres
if docker ps -a --format '{{.Names}}' 2>/dev/null | grep -q '^proctor-db$'; then
  echo "Starting existing Postgres container..."
  docker start proctor-db 2>/dev/null || true
else
  echo "Creating Postgres container..."
  docker run --name proctor-db \
    -e POSTGRES_PASSWORD=postgres \
    -e POSTGRES_DB=proctor_db \
    -p 5432:5432 \
    -d postgres:14
fi

echo "Waiting for Postgres..."
for i in $(seq 1 30); do
  if docker exec proctor-db pg_isready -U postgres -d proctor_db &>/dev/null; then
    break
  fi
  sleep 1
done
docker exec proctor-db pg_isready -U postgres -d proctor_db >/dev/null || { echo "Postgres did not become ready."; exit 1; }
echo "Postgres is ready."

# 2. Schema + migrations (run via docker exec so psql not required on host)
echo "Running schema and migrations..."
for f in \
  database-schema.sql \
  database-migration-optional-student-name.sql \
  database-migration-student-groups.sql \
  database-migration-add-use-group-access.sql \
  backend/database-migration-exam-report-colors-use-session-id.sql \
  backend/database-migration-session-question-notes.sql \
; do
  if [ -f "$REPO_ROOT/$f" ]; then
    echo "  $f"
    docker exec -i proctor-db psql -U postgres -d proctor_db -v ON_ERROR_STOP=1 < "$REPO_ROOT/$f" >/dev/null
  fi
done

# 3. Backend .env
BACKEND_ENV="$REPO_ROOT/backend/.env"
if [ ! -f "$BACKEND_ENV" ]; then
  cp "$REPO_ROOT/backend/.env.example" "$BACKEND_ENV"
  JWT=$(openssl rand -hex 32 2>/dev/null || node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
  if [[ "$OSTYPE" == "darwin"* ]]; then
    sed -i '' "s/your_jwt_secret_here_change_in_production/$JWT/" "$BACKEND_ENV"
    sed -i '' "s/your_password_here/postgres/" "$BACKEND_ENV"
  else
    sed -i "s/your_jwt_secret_here_change_in_production/$JWT/" "$BACKEND_ENV"
    sed -i "s/your_password_here/postgres/" "$BACKEND_ENV"
  fi
  echo "Created backend/.env with random JWT_SECRET and DATABASE_PASSWORD=postgres"
else
  echo "backend/.env already exists; leaving it as-is"
fi

echo ""
echo "=== Setup done ==="
echo ""
echo "1. Create an admin user (one time):"
echo "   cd backend && npm run create-admin"
echo "   (enter email and password when prompted)"
echo ""
echo "2. Start the app:"
echo "   ./scripts/start-dev.sh"
echo "   (or in two terminals: backend: cd backend && npm run dev   frontend: cd frontend && npm run dev)"
echo ""
