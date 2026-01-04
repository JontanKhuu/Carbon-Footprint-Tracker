#!/bin/bash
# Railway Migration Script
# Runs database migrations on Railway

SERVICE_NAME="${1:-backend}"

echo "=========================================="
echo "Railway Database Migration"
echo "=========================================="
echo ""

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI is not installed"
    echo ""
    echo "Install Railway CLI:"
    echo "   npm i -g @railway/cli"
    echo ""
    echo "Then login and link your project:"
    echo "   railway login"
    echo "   railway link"
    exit 1
fi

echo "Running database migrations..."
echo "Service: $SERVICE_NAME"
echo ""

if railway run --service "$SERVICE_NAME" flask db upgrade; then
    echo ""
    echo "=========================================="
    echo "✅ Migrations completed successfully!"
    echo "=========================================="
    exit 0
else
    echo ""
    echo "=========================================="
    echo "❌ Migration failed!"
    echo "=========================================="
    echo ""
    echo "Troubleshooting:"
    echo "1. Verify Railway project is linked: railway link"
    echo "2. Check service name is correct"
    echo "3. Verify DATABASE_URL is set in Railway dashboard"
    exit 1
fi

