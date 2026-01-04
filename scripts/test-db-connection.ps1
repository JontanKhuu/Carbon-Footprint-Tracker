# Database Connection Test Script
# Tests connection to PostgreSQL database using DATABASE_URL from .env

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Database Connection Test" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Check if .env file exists
if (-not (Test-Path ".env")) {
    Write-Host "❌ .env file not found!" -ForegroundColor Red
    Write-Host "   Run: .\scripts\setup-env.ps1 to create it" -ForegroundColor Yellow
    exit 1
}

# Load .env file
$envVars = @{}
Get-Content ".env" | ForEach-Object {
    if ($_ -match '^([^#][^=]+)=(.*)$') {
        $key = $matches[1].Trim()
        $value = $matches[2].Trim()
        $envVars[$key] = $value
    }
}

# Get DATABASE_URL
$databaseUrl = $envVars["DATABASE_URL"]
if (-not $databaseUrl) {
    Write-Host "❌ DATABASE_URL not found in .env file" -ForegroundColor Red
    exit 1
}

Write-Host "Testing connection to database..." -ForegroundColor Yellow
Write-Host "DATABASE_URL: $($databaseUrl -replace ':[^:@]+@', ':****@')" -ForegroundColor Gray
Write-Host ""

# Try to connect using Python (since we have Flask/SQLAlchemy available)
try {
    $testScript = @"
import os
import sys
from urllib.parse import urlparse

# Parse DATABASE_URL
database_url = r'$databaseUrl'
parsed = urlparse(database_url)

# Try to import psycopg2
try:
    import psycopg2
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
    print(f'SUCCESS: Connected to database: {db_name}')
    print(f'PostgreSQL version: {version}')
    sys.exit(0)
except ImportError:
    print('ERROR: psycopg2 not installed. Install with: pip install psycopg2-binary')
    sys.exit(1)
except Exception as e:
    print(f'ERROR: {str(e)}')
    sys.exit(1)
"@

    $testScript | python - 2>&1 | ForEach-Object {
        if ($_ -match 'SUCCESS:') {
            Write-Host "✅ $_" -ForegroundColor Green
        } elseif ($_ -match 'ERROR:') {
            Write-Host "❌ $_" -ForegroundColor Red
        } else {
            Write-Host "$_"
        }
    }

    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "==========================================" -ForegroundColor Cyan
        Write-Host "✅ Database connection successful!" -ForegroundColor Green
        Write-Host "==========================================" -ForegroundColor Cyan
        exit 0
    } else {
        Write-Host ""
        Write-Host "==========================================" -ForegroundColor Cyan
        Write-Host "❌ Database connection failed!" -ForegroundColor Red
        Write-Host "==========================================" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "Troubleshooting:" -ForegroundColor Yellow
        Write-Host "1. Verify DATABASE_URL is correct in .env file"
        Write-Host "2. Ensure database server is running"
        Write-Host "3. Check firewall/network settings"
        Write-Host "4. Verify database credentials are correct"
        Write-Host "5. Install psycopg2-binary: pip install psycopg2-binary"
        exit 1
    }
} catch {
    Write-Host "❌ Error running test: $_" -ForegroundColor Red
    exit 1
}

