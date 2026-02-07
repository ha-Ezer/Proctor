#!/usr/bin/env bash
# Verify deployment health and configuration

set -e

BACKEND_URL="${1:-http://localhost:3000}"

echo "🔍 Verifying Deployment"
echo "======================="
echo ""
echo "Backend URL: $BACKEND_URL"
echo ""

# Check health endpoint
echo "Checking health endpoint..."
HEALTH_RESPONSE=$(curl -s "$BACKEND_URL/health" || echo "ERROR")

if echo "$HEALTH_RESPONSE" | grep -q "healthy"; then
    echo "✅ Health check passed"
    echo "Response: $HEALTH_RESPONSE"
else
    echo "❌ Health check failed"
    echo "Response: $HEALTH_RESPONSE"
    exit 1
fi

echo ""
echo "✅ Deployment verification complete!"
echo ""
echo "Next: Test admin login at: $BACKEND_URL/admin/login"
