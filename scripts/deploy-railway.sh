#!/usr/bin/env bash
# Railway Deployment Helper Script
# This script helps prepare and verify deployment to Railway

set -e

echo "🚀 Railway Deployment Helper"
echo "=============================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo -e "${YELLOW}⚠️  Railway CLI not found.${NC}"
    echo "Install it with: npm i -g @railway/cli"
    echo "Or visit: https://docs.railway.app/develop/cli"
    exit 1
fi

echo -e "${GREEN}✅ Railway CLI found${NC}"
echo ""

# Check if project is linked
if [ ! -f ".railway/project.json" ]; then
    echo -e "${YELLOW}⚠️  Project not linked to Railway${NC}"
    echo "Run: railway link"
    exit 1
fi

echo -e "${GREEN}✅ Railway project linked${NC}"
echo ""

# Check backend build
echo "Building backend..."
cd backend
if npm run build; then
    echo -e "${GREEN}✅ Backend builds successfully${NC}"
else
    echo -e "${RED}❌ Backend build failed${NC}"
    exit 1
fi
cd ..

# Check frontend build
echo ""
echo "Building frontend..."
cd frontend
if npm run build; then
    echo -e "${GREEN}✅ Frontend builds successfully${NC}"
else
    echo -e "${RED}❌ Frontend build failed${NC}"
    exit 1
fi
cd ..

echo ""
echo -e "${GREEN}✅ All builds successful!${NC}"
echo ""
echo "Next steps:"
echo "1. Ensure all environment variables are set in Railway dashboard"
echo "2. Run database schema: railway run psql \$DATABASE_URL < database-schema.sql"
echo "3. Create admin user: railway run -s backend npm run create-admin"
echo "4. Deploy services in Railway dashboard"
echo ""
echo "For detailed instructions, see: DEPLOYMENT_CHECKLIST.md"
