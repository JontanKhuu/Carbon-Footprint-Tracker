# Docker Migration Script
# Runs database migrations in the backend container

param(
    [string]$ComposeFile = "docker-compose.prod.yml",
    [string]$Action = "upgrade"
)

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Database Migration Script" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Docker is installed
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Docker is not installed or not in PATH" -ForegroundColor Red
    exit 1
}

# Check if docker-compose file exists
if (-not (Test-Path $ComposeFile)) {
    Write-Host "❌ $ComposeFile not found!" -ForegroundColor Red
    exit 1
}

# Check if backend container is running
$backendStatus = docker-compose -f $ComposeFile ps backend --format json | ConvertFrom-Json
if ($backendStatus.State -ne "running") {
    Write-Host "❌ Backend container is not running!" -ForegroundColor Red
    Write-Host "   Start containers first: docker-compose -f $ComposeFile up -d" -ForegroundColor Yellow
    exit 1
}

Write-Host "Running database migrations..." -ForegroundColor Yellow
Write-Host "Action: $Action" -ForegroundColor Gray
Write-Host ""

# Run migration
try {
    switch ($Action) {
        "upgrade" {
            docker-compose -f $ComposeFile exec -T backend flask db upgrade
        }
        "downgrade" {
            docker-compose -f $ComposeFile exec -T backend flask db downgrade -1
        }
        "current" {
            docker-compose -f $ComposeFile exec -T backend flask db current
        }
        "history" {
            docker-compose -f $ComposeFile exec -T backend flask db history
        }
        default {
            Write-Host "❌ Unknown action: $Action" -ForegroundColor Red
            Write-Host "   Valid actions: upgrade, downgrade, current, history" -ForegroundColor Yellow
            exit 1
        }
    }
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "==========================================" -ForegroundColor Cyan
        Write-Host "✅ Migration completed successfully!" -ForegroundColor Green
        Write-Host "==========================================" -ForegroundColor Cyan
        exit 0
    } else {
        Write-Host ""
        Write-Host "==========================================" -ForegroundColor Cyan
        Write-Host "❌ Migration failed!" -ForegroundColor Red
        Write-Host "==========================================" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "Troubleshooting:" -ForegroundColor Yellow
        Write-Host "1. Check database connection in .env file" -ForegroundColor Gray
        Write-Host "2. Verify database container is running" -ForegroundColor Gray
        Write-Host "3. Check backend logs: docker-compose -f $ComposeFile logs backend" -ForegroundColor Gray
        exit 1
    }
} catch {
    Write-Host "❌ Error running migration: $_" -ForegroundColor Red
    exit 1
}

