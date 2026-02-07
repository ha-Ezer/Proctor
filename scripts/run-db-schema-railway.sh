#!/usr/bin/env bash
# Run database schema on Railway database
# Usage: ./scripts/run-db-schema-railway.sh

set -e

echo "🗄️  Running Database Schema on Railway"
echo "========================================"
echo ""

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found"
    echo "Install it with: npm i -g @railway/cli"
    exit 1
fi

# Check if linked
if [ ! -f ".railway/project.json" ]; then
    echo "⚠️  Not linked to Railway project"
    echo "Linking now..."
    railway link
fi

echo "✅ Railway project linked"
echo ""

# Get DATABASE_URL from Railway
echo "Fetching DATABASE_URL from Railway..."
DATABASE_URL=$(railway variables --json | grep -o '"DATABASE_URL":"[^"]*' | cut -d'"' -f4)

if [ -z "$DATABASE_URL" ]; then
    echo "❌ Could not find DATABASE_URL"
    echo "Make sure PostgreSQL service is linked to backend service"
    echo ""
    echo "Try: railway variables"
    exit 1
fi

# Check if it's the internal URL (won't work from local machine)
if echo "$DATABASE_URL" | grep -q "railway.internal"; then
    echo "⚠️  Warning: Found internal DATABASE_URL (postgres.railway.internal)"
    echo "This won't work from your local machine."
    echo ""
    echo "Please use Railway Dashboard SQL Editor instead:"
    echo "1. Go to PostgreSQL service → Data tab → Query tab"
    echo "2. Copy contents of database-schema.sql"
    echo "3. Paste and run in SQL editor"
    echo ""
    echo "OR get the public DATABASE_URL from Railway dashboard"
    exit 1
fi

echo "✅ Found DATABASE_URL"
echo ""

# Check if schema file exists
if [ ! -f "database-schema.sql" ]; then
    echo "❌ database-schema.sql not found in current directory"
    exit 1
fi

echo "Running database schema..."
echo ""

# Run schema using Railway CLI (this executes on Railway's servers)
railway run psql "$DATABASE_URL" < database-schema.sql

echo ""
echo "✅ Database schema executed successfully!"
echo ""
echo "Next steps:"
echo "1. Run migrations (if any)"
echo "2. Create admin user: railway run -s backend npm run create-admin"
