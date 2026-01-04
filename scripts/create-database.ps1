# Database Creation Script
# Creates the PostgreSQL database if it doesn't exist

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Database Creation Script" -ForegroundColor Cyan
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

$POSTGRES_USER = $envVars["POSTGRES_USER"]
$POSTGRES_PASSWORD = $envVars["POSTGRES_PASSWORD"]
$POSTGRES_DB = $envVars["POSTGRES_DB"]
$DATABASE_URL = $envVars["DATABASE_URL"]

if (-not $DATABASE_URL) {
    Write-Host "❌ DATABASE_URL not found in .env file" -ForegroundColor Red
    exit 1
}

Write-Host "Database Configuration:" -ForegroundColor Yellow
Write-Host "  User: $POSTGRES_USER" -ForegroundColor Gray
Write-Host "  Database: $POSTGRES_DB" -ForegroundColor Gray
Write-Host ""

# Check if using Docker
if ($DATABASE_URL -match '@db:5432|@localhost:5433') {
    Write-Host "Detected Docker database setup." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "✅ Database will be created automatically when Docker containers start." -ForegroundColor Green
    Write-Host "   Run: docker-compose up -d db" -ForegroundColor Gray
    Write-Host ""
    Write-Host "The database '$POSTGRES_DB' will be created by the PostgreSQL container" -ForegroundColor Gray
    Write-Host "using the POSTGRES_DB environment variable." -ForegroundColor Gray
    exit 0
}

# For non-Docker setups, provide instructions
Write-Host "For non-Docker PostgreSQL installations:" -ForegroundColor Yellow
Write-Host "1. Connect to PostgreSQL server as superuser" -ForegroundColor Gray
Write-Host "2. Run: CREATE DATABASE $POSTGRES_DB;" -ForegroundColor Gray
Write-Host ""
Write-Host "Or use psql:" -ForegroundColor Yellow
Write-Host "   psql -h <host> -U <superuser> -c `"CREATE DATABASE $POSTGRES_DB;`"" -ForegroundColor Gray
Write-Host ""

