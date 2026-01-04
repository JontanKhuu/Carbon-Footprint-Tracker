#!/bin/bash
# Docker Build Script
# Builds all Docker images for production deployment

COMPOSE_FILE="${1:-docker-compose.prod.yml}"
NO_CACHE="${2:-}"

echo "=========================================="
echo "Docker Build Script"
echo "=========================================="
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed or not in PATH"
    echo "   Please install Docker: https://www.docker.com/get-started"
    exit 1
fi

# Check if docker-compose file exists
if [ ! -f "$COMPOSE_FILE" ]; then
    echo "❌ $COMPOSE_FILE not found!"
    exit 1
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚠️  .env file not found!"
    echo "   Run: ./scripts/setup-env.sh to create it"
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo "Building Docker images..."
echo "Compose file: $COMPOSE_FILE"
if [ -n "$NO_CACHE" ]; then
    echo "Cache: Disabled (--no-cache)"
fi
echo ""

# Build images
BUILD_ARGS=(-f "$COMPOSE_FILE" build)
if [ -n "$NO_CACHE" ]; then
    BUILD_ARGS+=(--no-cache)
fi

if docker-compose "${BUILD_ARGS[@]}"; then
    echo ""
    echo "=========================================="
    echo "✅ Docker images built successfully!"
    echo "=========================================="
    echo ""
    echo "Next steps:"
    echo "1. Start containers: docker-compose -f $COMPOSE_FILE up -d"
    echo "2. Check status: docker-compose -f $COMPOSE_FILE ps"
    echo "3. View logs: docker-compose -f $COMPOSE_FILE logs -f"
    exit 0
else
    echo ""
    echo "=========================================="
    echo "❌ Docker build failed!"
    echo "=========================================="
    echo ""
    echo "Troubleshooting:"
    echo "1. Check Docker is running: docker ps"
    echo "2. Check .env file has all required variables"
    echo "3. Review error messages above"
    exit 1
fi

