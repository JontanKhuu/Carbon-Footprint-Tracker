#!/bin/bash
# Docker Status Script
# Checks the status of all Docker containers

COMPOSE_FILE="${1:-docker-compose.prod.yml}"

echo "=========================================="
echo "Docker Container Status"
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

echo "Checking container status..."
echo ""

# Show container status
docker-compose -f "$COMPOSE_FILE" ps
echo ""

# Check health endpoints
echo "Health Checks:"
echo ""

# Backend health
if curl -s -f http://localhost:5000/api/health > /dev/null 2>&1; then
    HEALTH=$(curl -s http://localhost:5000/api/health)
    DB_STATUS=$(echo "$HEALTH" | grep -o '"database":"[^"]*"' | cut -d'"' -f4)
    echo "✅ Backend API: Healthy"
    echo "   Database: $DB_STATUS"
else
    echo "❌ Backend API: Not responding"
    ALL_HEALTHY=false
fi

echo ""

# Summary
echo "=========================================="
if docker-compose -f "$COMPOSE_FILE" ps | grep -q "Up"; then
    if [ -z "$ALL_HEALTHY" ]; then
        echo "✅ All containers are running and healthy!"
        exit 0
    else
        echo "⚠️  Containers are running but some health checks failed"
        exit 1
    fi
else
    echo "❌ Some containers are not running!"
    echo ""
    echo "Troubleshooting:"
    echo "1. Check logs: docker-compose -f $COMPOSE_FILE logs"
    echo "2. Restart containers: docker-compose -f $COMPOSE_FILE restart"
    exit 1
fi
echo "=========================================="

