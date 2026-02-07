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

# Check if schema file exists
if [ ! -f "database-schema.sql" ]; then
    echo "❌ database-schema.sql not found in current directory"
    exit 1
fi

echo ""
echo "📋 To run the database schema, you need the PUBLIC DATABASE_URL from Railway."
echo ""
echo "Option 1: Get from Railway Dashboard"
echo "  1. Go to PostgreSQL service → Click 'Connect' button (top right)"
echo "  2. Copy the connection string (public URL)"
echo "  3. Run: psql \"<connection-string>\" < database-schema.sql"
echo ""
echo "Option 2: Get from Variables tab"
echo "  1. Go to PostgreSQL service → 'Variables' tab"
echo "  2. Find DATABASE_URL (should start with postgresql://postgres:...@containers-xxx.railway.app)"
echo "  3. Copy and run: psql \"<DATABASE_URL>\" < database-schema.sql"
echo ""
echo "Option 3: If you have the DATABASE_URL, you can pass it as an argument:"
echo "  ./scripts/run-db-schema-railway.sh <DATABASE_URL>"
echo ""

# Check if DATABASE_URL was provided as argument
if [ -n "$1" ]; then
    DATABASE_URL="$1"
    echo "Using provided DATABASE_URL..."
    
    # Check if it's the internal URL
    if echo "$DATABASE_URL" | grep -q "railway.internal"; then
        echo "❌ Error: Internal DATABASE_URL provided (postgres.railway.internal)"
        echo "This won't work from your local machine."
        echo "Please get the PUBLIC DATABASE_URL from Railway dashboard (Connect button)"
        exit 1
    fi
    
    echo "Running database schema..."
    echo ""
    psql "$DATABASE_URL" < database-schema.sql
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "✅ Database schema executed successfully!"
        echo ""
        echo "Next steps:"
        echo "1. Run migrations (if any)"
        echo "2. Create admin user: railway run -s backend npm run create-admin"
    else
        echo ""
        echo "❌ Failed to execute schema. Check the error above."
        exit 1
    fi
else
    echo "ℹ️  No DATABASE_URL provided. Please follow one of the options above."
    exit 0
fi

echo ""
echo "✅ Database schema executed successfully!"
echo ""
echo "Next steps:"
echo "1. Run migrations (if any)"
echo "2. Create admin user: railway run -s backend npm run create-admin"
