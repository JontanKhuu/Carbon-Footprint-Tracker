#!/bin/bash
# Cloud Platform Health Verification Script
# Verifies that deployed services are healthy

BACKEND_URL="${1:-}"
FRONTEND_URL="${2:-}"

echo "=========================================="
echo "Cloud Platform Health Verification"
echo "=========================================="
echo ""

ALL_HEALTHY=true

# Check backend health
if [ -n "$BACKEND_URL" ]; then
    echo "Checking backend health..."
    HEALTH_URL="${BACKEND_URL%/}/api/health"
    
    if curl -s -f -m 10 "$HEALTH_URL" > /dev/null 2>&1; then
        HEALTH=$(curl -s "$HEALTH_URL")
        STATUS=$(echo "$HEALTH" | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
        DB_STATUS=$(echo "$HEALTH" | grep -o '"database":"[^"]*"' | cut -d'"' -f4)
        
        echo "✅ Backend API: Healthy"
        echo "   Status: $STATUS"
        echo "   Database: $DB_STATUS"
        
        if [[ "$DB_STATUS" != *"connected"* ]]; then
            echo "   ⚠️  Database connection issue detected"
            ALL_HEALTHY=false
        fi
    else
        echo "❌ Backend API: Not responding"
        ALL_HEALTHY=false
    fi
    echo ""
else
    echo "⚠️  Backend URL not provided, skipping backend check"
    echo ""
fi

# Check frontend
if [ -n "$FRONTEND_URL" ]; then
    echo "Checking frontend..."
    if curl -s -f -m 10 "$FRONTEND_URL" > /dev/null 2>&1; then
        STATUS_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$FRONTEND_URL")
        echo "✅ Frontend: Accessible"
        echo "   Status Code: $STATUS_CODE"
    else
        echo "❌ Frontend: Not accessible"
        ALL_HEALTHY=false
    fi
    echo ""
else
    echo "⚠️  Frontend URL not provided, skipping frontend check"
    echo ""
fi

# Summary
echo "=========================================="
if [ "$ALL_HEALTHY" = true ]; then
    echo "✅ All services are healthy!"
    exit 0
else
    echo "❌ Some services have issues"
    echo ""
    echo "Troubleshooting:"
    echo "1. Check service logs in cloud platform dashboard"
    echo "2. Verify environment variables are set correctly"
    echo "3. Check database connection"
    echo "4. Verify CORS settings if frontend can't access backend"
    exit 1
fi
echo "=========================================="

