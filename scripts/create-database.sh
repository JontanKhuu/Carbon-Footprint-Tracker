#!/bin/bash
# Database Creation Script
# Creates the PostgreSQL database if it doesn't exist

echo "=========================================="
echo "Database Creation Script"
echo "=========================================="
echo ""

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "❌ .env file not found!"
    echo "   Run: ./scripts/setup-env.sh to create it"
    exit 1
fi

# Load variables from .env
POSTGRES_USER=$(grep "^POSTGRES_USER=" .env | cut -d '=' -f2- | tr -d '"' | tr -d "'")
POSTGRES_PASSWORD=$(grep "^POSTGRES_PASSWORD=" .env | cut -d '=' -f2- | tr -d '"' | tr -d "'")
POSTGRES_DB=$(grep "^POSTGRES_DB=" .env | cut -d '=' -f2- | tr -d '"' | tr -d "'")
DATABASE_URL=$(grep "^DATABASE_URL=" .env | cut -d '=' -f2- | tr -d '"' | tr -d "'")

if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL not found in .env file"
    exit 1
fi

echo "Database Configuration:"
echo "  User: $POSTGRES_USER"
echo "  Database: $POSTGRES_DB"
echo ""

# Check if using Docker
if echo "$DATABASE_URL" | grep -qE '@db:5432|@localhost:5433'; then
    echo "Detected Docker database setup."
    echo ""
    echo "✅ Database will be created automatically when Docker containers start."
    echo "   Run: docker-compose up -d db"
    echo ""
    echo "The database '$POSTGRES_DB' will be created by the PostgreSQL container"
    echo "using the POSTGRES_DB environment variable."
    exit 0
fi

# Parse DATABASE_URL for direct connection
DB_USER=$(echo $DATABASE_URL | sed -n 's|.*://\([^:]*\):.*|\1|p')
DB_PASS=$(echo $DATABASE_URL | sed -n 's|.*://[^:]*:\([^@]*\)@.*|\1|p')
DB_HOST=$(echo $DATABASE_URL | sed -n 's|.*@\([^:]*\):.*|\1|p')
DB_PORT=$(echo $DATABASE_URL | sed -n 's|.*@[^:]*:\([^/]*\)/.*|\1|p')

# Default port if not specified
if [ -z "$DB_PORT" ]; then
    DB_PORT=5432
fi

# Try to create database using psql
if command -v psql &> /dev/null; then
    export PGPASSWORD="$DB_PASS"
    
    # Check if database already exists
    DB_EXISTS=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -lqt | cut -d \| -f 1 | grep -qw "$POSTGRES_DB" && echo "yes" || echo "no")
    
    if [ "$DB_EXISTS" = "yes" ]; then
        echo "✅ Database '$POSTGRES_DB' already exists!"
        exit 0
    fi
    
    # Create database
    echo "Creating database '$POSTGRES_DB'..."
    if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c "CREATE DATABASE $POSTGRES_DB;" 2>/dev/null; then
        echo "✅ Database '$POSTGRES_DB' created successfully!"
        exit 0
    else
        echo "❌ Failed to create database. Check your connection and permissions."
        exit 1
    fi
else
    echo "⚠️  psql not found. Please install PostgreSQL client tools."
    echo "   On Ubuntu/Debian: sudo apt-get install postgresql-client"
    echo "   On macOS: brew install postgresql"
    echo ""
    echo "Alternatively, create the database manually:"
    echo "   CREATE DATABASE $POSTGRES_DB;"
    exit 1
fi

