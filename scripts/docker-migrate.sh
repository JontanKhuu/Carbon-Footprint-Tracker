#!/bin/bash
# Docker Migration Script
# Runs database migrations in the backend container

COMPOSE_FILE="${1:-docker-compose.prod.yml}"
ACTION="${2:-upgrade}"

echo "=========================================="
echo "Database Migration Script"
echo "=========================================="
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed or not in PATH"
    exit 1
fi

# Check if docker-compose file exists
if [ ! -f "$COMPOSE_FILE" ]; then
    echo "❌ $COMPOSE_FILE not found!"
    exit 1
fi

# Check if backend container is running
if ! docker-compose -f "$COMPOSE_FILE" ps backend | grep -q "Up"; then
    echo "❌ Backend container is not running!"
    echo "   Start containers first: docker-compose -f $COMPOSE_FILE up -d"
    exit 1
fi

echo "Running database migrations..."
echo "Action: $ACTION"
echo ""

# Run migration
case "$ACTION" in
    upgrade)
        docker-compose -f "$COMPOSE_FILE" exec -T backend flask db upgrade
        ;;
    downgrade)
        docker-compose -f "$COMPOSE_FILE" exec -T backend flask db downgrade -1
        ;;
    current)
        docker-compose -f "$COMPOSE_FILE" exec -T backend flask db current
        ;;
    history)
        docker-compose -f "$COMPOSE_FILE" exec -T backend flask db history
        ;;
    *)
        echo "❌ Unknown action: $ACTION"
        echo "   Valid actions: upgrade, downgrade, current, history"
        exit 1
        ;;
esac

if [ $? -eq 0 ]; then
    echo ""
    echo "=========================================="
    echo "✅ Migration completed successfully!"
    echo "=========================================="
    exit 0
else
    echo ""
    echo "=========================================="
    echo "❌ Migration failed!"
    echo "=========================================="
    echo ""
    echo "Troubleshooting:"
    echo "1. Check database connection in .env file"
    echo "2. Verify database container is running"
    echo "3. Check backend logs: docker-compose -f $COMPOSE_FILE logs backend"
    exit 1
fi

