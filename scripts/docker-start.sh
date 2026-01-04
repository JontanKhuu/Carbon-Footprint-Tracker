#!/bin/bash
# Docker Start Script
# Starts all Docker containers for production deployment

COMPOSE_FILE="${1:-docker-compose.prod.yml}"
BUILD="${2:-}"

echo "=========================================="
echo "Docker Start Script"
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

echo "Starting Docker containers..."
echo "Compose file: $COMPOSE_FILE"
if [ -n "$BUILD" ]; then
    echo "Build: Enabled (--build)"
fi
echo ""

# Start containers
START_ARGS=(-f "$COMPOSE_FILE" up -d)
if [ -n "$BUILD" ]; then
    START_ARGS+=(--build)
fi

if docker-compose "${START_ARGS[@]}"; then
    echo ""
    echo "Waiting for services to be healthy..."
    sleep 5
    
    echo ""
    echo "=========================================="
    echo "✅ Containers started successfully!"
    echo "=========================================="
    echo ""
    
    # Show container status
    echo "Container Status:"
    docker-compose -f "$COMPOSE_FILE" ps
    echo ""
    
    echo "Next steps:"
    echo "1. Check logs: docker-compose -f $COMPOSE_FILE logs -f"
    echo "2. Run migrations: docker-compose -f $COMPOSE_FILE exec backend flask db upgrade"
    echo "3. Check health: curl http://localhost:5000/api/health"
    exit 0
else
    echo ""
    echo "=========================================="
    echo "❌ Failed to start containers!"
    echo "=========================================="
    echo ""
    echo "Check logs for errors:"
    echo "   docker-compose -f $COMPOSE_FILE logs"
    exit 1
fi

