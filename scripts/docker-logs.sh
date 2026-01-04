#!/bin/bash
# Docker Logs Script
# Shows logs from Docker containers

COMPOSE_FILE="${1:-docker-compose.prod.yml}"
SERVICE="${2:-}"
FOLLOW="${3:-}"
TAIL="${4:-100}"

echo "=========================================="
echo "Docker Container Logs"
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

# Build log command
LOG_ARGS=(-f "$COMPOSE_FILE" logs --tail="$TAIL")
if [ -n "$FOLLOW" ]; then
    LOG_ARGS+=(--follow)
fi
if [ -n "$SERVICE" ]; then
    LOG_ARGS+=("$SERVICE")
fi

echo "Showing logs..."
if [ -n "$SERVICE" ]; then
    echo "Service: $SERVICE"
fi
if [ -n "$FOLLOW" ]; then
    echo "Mode: Following (Press Ctrl+C to stop)"
else
    echo "Lines: Last $TAIL"
fi
echo ""

# Show logs
docker-compose "${LOG_ARGS[@]}"

