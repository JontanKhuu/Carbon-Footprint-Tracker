#!/bin/bash
# Database Backup Script
# Creates a backup of the PostgreSQL database

OUTPUT_PATH="${1:-backups}"
BACKUP_NAME="${2:-}"

echo "=========================================="
echo "Database Backup Script"
echo "=========================================="
echo ""

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "❌ .env file not found!"
    echo "   Run: ./scripts/setup-env.sh to create it"
    exit 1
fi

# Load DATABASE_URL from .env
DATABASE_URL=$(grep "^DATABASE_URL=" .env | cut -d '=' -f2- | tr -d '"' | tr -d "'")

if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL not found in .env file"
    exit 1
fi

# Create backup directory if it doesn't exist
mkdir -p "$OUTPUT_PATH"

# Generate backup filename
if [ -z "$BACKUP_NAME" ]; then
    TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
    DB_NAME=$(echo $DATABASE_URL | sed -n 's|.*/\([^?]*\).*|\1|p')
    BACKUP_NAME="backup_${DB_NAME}_${TIMESTAMP}.sql"
fi

BACKUP_PATH="$OUTPUT_PATH/$BACKUP_NAME"

echo "Creating backup..."
echo "Database: $(echo $DATABASE_URL | sed -n 's|.*/\([^?]*\).*|\1|p')"
echo "Output: $BACKUP_PATH"
echo ""

# Check if using Docker
if echo "$DATABASE_URL" | grep -qE '@db:5432|@localhost:5433'; then
    echo "Detected Docker database. Using docker-compose..."
    
    # Determine which compose file to use
    COMPOSE_FILE="docker-compose.yml"
    if [ -f "docker-compose.prod.yml" ]; then
        COMPOSE_FILE="docker-compose.prod.yml"
    fi
    
    # Get database credentials from .env
    POSTGRES_USER=$(grep "^POSTGRES_USER=" .env | cut -d '=' -f2- | tr -d '"' | tr -d "'")
    POSTGRES_DB=$(grep "^POSTGRES_DB=" .env | cut -d '=' -f2- | tr -d '"' | tr -d "'")
    
    if docker-compose -f "$COMPOSE_FILE" exec -T db pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" > "$BACKUP_PATH" 2>/dev/null; then
        FILE_SIZE=$(du -h "$BACKUP_PATH" | cut -f1)
        echo "✅ Backup created successfully!"
        echo "   File: $BACKUP_PATH"
        echo "   Size: $FILE_SIZE"
        echo ""
        echo "To restore this backup:"
        echo "   docker-compose -f $COMPOSE_FILE exec -T db psql -U $POSTGRES_USER $POSTGRES_DB < $BACKUP_PATH"
        exit 0
    else
        echo "⚠️  Docker method failed, trying direct connection..."
    fi
fi

# Parse DATABASE_URL for direct connection
DB_USER=$(echo $DATABASE_URL | sed -n 's|.*://\([^:]*\):.*|\1|p')
DB_PASS=$(echo $DATABASE_URL | sed -n 's|.*://[^:]*:\([^@]*\)@.*|\1|p')
DB_HOST=$(echo $DATABASE_URL | sed -n 's|.*@\([^:]*\):.*|\1|p')
DB_PORT=$(echo $DATABASE_URL | sed -n 's|.*@[^:]*:\([^/]*\)/.*|\1|p')
DB_NAME=$(echo $DATABASE_URL | sed -n 's|.*/\([^?]*\).*|\1|p')

# Default port if not specified
if [ -z "$DB_PORT" ]; then
    DB_PORT=5432
fi

# Try pg_dump if available
if command -v pg_dump &> /dev/null; then
    export PGPASSWORD="$DB_PASS"
    if pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -F p > "$BACKUP_PATH" 2>/dev/null; then
        FILE_SIZE=$(du -h "$BACKUP_PATH" | cut -f1)
        echo "✅ Backup created successfully!"
        echo "   File: $BACKUP_PATH"
        echo "   Size: $FILE_SIZE"
        exit 0
    else
        echo "❌ pg_dump failed. Check your connection and credentials."
        exit 1
    fi
else
    echo "❌ pg_dump not found. Please install PostgreSQL client tools."
    echo "   On Ubuntu/Debian: sudo apt-get install postgresql-client"
    echo "   On macOS: brew install postgresql"
    exit 1
fi

