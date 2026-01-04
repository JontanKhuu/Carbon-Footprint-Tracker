# Database Backup Script
# Creates a backup of the PostgreSQL database

param(
    [string]$OutputPath = "backups",
    [string]$BackupName = ""
)

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Database Backup Script" -ForegroundColor Cyan
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

# Create backup directory if it doesn't exist
if (-not (Test-Path $OutputPath)) {
    New-Item -ItemType Directory -Path $OutputPath | Out-Null
    Write-Host "✅ Created backup directory: $OutputPath" -ForegroundColor Green
}

# Generate backup filename
if ([string]::IsNullOrEmpty($BackupName)) {
    $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    $dbName = ($databaseUrl -split '/')[-1] -split '\?')[0]
    $BackupName = "backup_${dbName}_${timestamp}.sql"
}

$backupPath = Join-Path $OutputPath $BackupName

Write-Host "Creating backup..." -ForegroundColor Yellow
Write-Host "Database: $(($databaseUrl -split '/')[-1] -split '\?')[0]" -ForegroundColor Gray
Write-Host "Output: $backupPath" -ForegroundColor Gray
Write-Host ""

# Check if using Docker
if ($databaseUrl -match '@db:5432|@localhost:5433') {
    Write-Host "Detected Docker database. Using docker-compose..." -ForegroundColor Yellow
    
    # Try docker-compose method
    $composeFile = "docker-compose.yml"
    if (Test-Path "docker-compose.prod.yml") {
        $composeFile = "docker-compose.prod.yml"
    }
    
    try {
        docker-compose -f $composeFile exec -T db pg_dump -U $envVars["POSTGRES_USER"] $envVars["POSTGRES_DB"] | Out-File -FilePath $backupPath -Encoding UTF8
        if ($LASTEXITCODE -eq 0) {
            $fileSize = (Get-Item $backupPath).Length / 1KB
            Write-Host "✅ Backup created successfully!" -ForegroundColor Green
            Write-Host "   File: $backupPath" -ForegroundColor Gray
            Write-Host "   Size: $([math]::Round($fileSize, 2)) KB" -ForegroundColor Gray
            Write-Host ""
            Write-Host "To restore this backup:" -ForegroundColor Yellow
            Write-Host "   docker-compose -f $composeFile exec -T db psql -U $($envVars['POSTGRES_USER']) $($envVars['POSTGRES_DB']) < $backupPath" -ForegroundColor Gray
            exit 0
        }
    } catch {
        Write-Host "⚠️  Docker method failed, trying direct connection..." -ForegroundColor Yellow
    }
}

# Try direct pg_dump if available
if (Get-Command pg_dump -ErrorAction SilentlyContinue) {
    try {
        # Parse DATABASE_URL
        $parsed = [System.Uri]$databaseUrl
        $dbHost = $parsed.Host
        $dbPort = if ($parsed.Port -ne -1) { $parsed.Port } else { 5432 }
        $dbName = $parsed.Path.TrimStart('/') -split '\?')[0]
        $dbUser = $parsed.UserInfo -split ':')[0]
        $dbPass = ($parsed.UserInfo -split ':')[1]
        
        $env:PGPASSWORD = $dbPass
        pg_dump -h $dbHost -p $dbPort -U $dbUser -d $dbName -F p > $backupPath
        
        if ($LASTEXITCODE -eq 0) {
            $fileSize = (Get-Item $backupPath).Length / 1KB
            Write-Host "✅ Backup created successfully!" -ForegroundColor Green
            Write-Host "   File: $backupPath" -ForegroundColor Gray
            Write-Host "   Size: $([math]::Round($fileSize, 2)) KB" -ForegroundColor Gray
            exit 0
        }
    } catch {
        Write-Host "❌ pg_dump failed: $_" -ForegroundColor Red
    }
}

# Fallback to Python method
Write-Host "Using Python fallback method..." -ForegroundColor Yellow
$pythonScript = @"
import os
import sys
from urllib.parse import urlparse

try:
    import psycopg2
    from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
    
    database_url = r'$databaseUrl'
    parsed = urlparse(database_url)
    
    conn = psycopg2.connect(
        host=parsed.hostname,
        port=parsed.port or 5432,
        database=parsed.path[1:] if parsed.path else None,
        user=parsed.username,
        password=parsed.password
    )
    
    # Use pg_dump via subprocess if available
    import subprocess
    backup_path = r'$backupPath'
    
    # Try to use pg_dump
    try:
        result = subprocess.run(
            ['pg_dump', 
             '-h', parsed.hostname,
             '-p', str(parsed.port or 5432),
             '-U', parsed.username,
             '-d', parsed.path[1:] if parsed.path else None,
             '-f', backup_path],
            env={**os.environ, 'PGPASSWORD': parsed.password},
            capture_output=True,
            text=True
        )
        if result.returncode == 0:
            print('SUCCESS')
            sys.exit(0)
        else:
            print(f'ERROR: {result.stderr}')
            sys.exit(1)
    except FileNotFoundError:
        print('ERROR: pg_dump not found. Please install PostgreSQL client tools.')
        sys.exit(1)
        
except ImportError:
    print('ERROR: psycopg2 not installed. Install with: pip install psycopg2-binary')
    sys.exit(1)
except Exception as e:
    print(f'ERROR: {str(e)}')
    sys.exit(1)
"@

$result = $pythonScript | python - 2>&1
if ($LASTEXITCODE -eq 0 -and $result -match 'SUCCESS') {
    $fileSize = (Get-Item $backupPath).Length / 1KB
    Write-Host "✅ Backup created successfully!" -ForegroundColor Green
    Write-Host "   File: $backupPath" -ForegroundColor Gray
    Write-Host "   Size: $([math]::Round($fileSize, 2)) KB" -ForegroundColor Gray
    exit 0
} else {
    Write-Host "❌ Backup failed!" -ForegroundColor Red
    Write-Host $result -ForegroundColor Red
    Write-Host ""
    Write-Host "Troubleshooting:" -ForegroundColor Yellow
    Write-Host "1. Install PostgreSQL client tools (pg_dump)"
    Write-Host "2. Or use Docker: docker-compose exec db pg_dump ..."
    Write-Host "3. Ensure database is accessible"
    exit 1
}

