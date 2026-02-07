#!/usr/bin/env bash
# Start backend and frontend for local dev. Ctrl+C stops both.
set -e
cd "$(dirname "$0")/.."

echo "Installing dependencies if needed..."
(cd backend && npm install --silent 2>/dev/null) &
(cd frontend && npm install --silent 2>/dev/null) &
wait

echo "Starting backend on http://localhost:3000 ..."
(cd backend && npm run dev) &
BACKEND_PID=$!
trap "kill $BACKEND_PID 2>/dev/null; exit" EXIT INT TERM

sleep 3
echo "Starting frontend on http://localhost:5173 ..."
(cd frontend && npm run dev)

kill $BACKEND_PID 2>/dev/null || true
