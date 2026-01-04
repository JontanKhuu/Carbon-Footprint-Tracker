#!/bin/bash
# Database Connection Test Script
# Tests connection to PostgreSQL database using DATABASE_URL from .env

echo "=========================================="
echo "Database Connection Test"
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

echo "Testing connection to database..."
echo "DATABASE_URL: $(echo $DATABASE_URL | sed 's/:[^:@]*@/:****@/')"
echo ""

# Parse DATABASE_URL
# Format: postgresql://user:password@host:port/database
DB_USER=$(echo $DATABASE_URL | sed -n 's|.*://\([^:]*\):.*|\1|p')
DB_PASS=$(echo $DATABASE_URL | sed -n 's|.*://[^:]*:\([^@]*\)@.*|\1|p')
DB_HOST=$(echo $DATABASE_URL | sed -n 's|.*@\([^:]*\):.*|\1|p')
DB_PORT=$(echo $DATABASE_URL | sed -n 's|.*@[^:]*:\([^/]*\)/.*|\1|p')
DB_NAME=$(echo $DATABASE_URL | sed -n 's|.*/\([^?]*\).*|\1|p')

# Default port if not specified
if [ -z "$DB_PORT" ]; then
    DB_PORT=5432
fi

# Test connection using psql if available
if command -v psql &> /dev/null; then
    export PGPASSWORD="$DB_PASS"
    if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT version(), current_database();" &> /dev/null; then
        echo "✅ Database connection successful!"
        psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT version(), current_database();"
        echo ""
        echo "=========================================="
        echo "✅ Database connection test passed!"
        echo "=========================================="
        exit 0
    else
        echo "❌ Database connection failed!"
        echo ""
        echo "Troubleshooting:"
        echo "1. Verify DATABASE_URL is correct in .env file"
        echo "2. Ensure database server is running"
        echo "3. Check firewall/network settings"
        echo "4. Verify database credentials are correct"
        exit 1
    fi
# Fallback to Python if psql not available
elif command -v python3 &> /dev/null || command -v python &> /dev/null; then
    PYTHON_CMD=$(command -v python3 2>/dev/null || command -v python)
    $PYTHON_CMD << EOF
import sys
from urllib.parse import urlparse

try:
    import psycopg2
    parsed = urlparse('$DATABASE_URL')
    conn = psycopg2.connect(
        host=parsed.hostname,
        port=parsed.port or 5432,
        database=parsed.path[1:] if parsed.path else None,
        user=parsed.username,
        password=parsed.password
    )
    cursor = conn.cursor()
    cursor.execute('SELECT version();')
    version = cursor.fetchone()[0]
    cursor.execute('SELECT current_database();')
    db_name = cursor.fetchone()[0]
    cursor.close()
    conn.close()
    print(f'✅ Database connection successful!')
    print(f'Database: {db_name}')
    print(f'PostgreSQL version: {version}')
    sys.exit(0)
except ImportError:
    print('❌ psycopg2 not installed. Install with: pip install psycopg2-binary')
    sys.exit(1)
except Exception as e:
    print(f'❌ Database connection failed: {str(e)}')
    sys.exit(1)
EOF
    if [ $? -eq 0 ]; then
        echo ""
        echo "=========================================="
        echo "✅ Database connection test passed!"
        echo "=========================================="
        exit 0
    else
        echo ""
        echo "=========================================="
        echo "❌ Database connection test failed!"
        echo "=========================================="
        exit 1
    fi
else
    echo "❌ Neither psql nor python found. Please install one of them."
    exit 1
fi

