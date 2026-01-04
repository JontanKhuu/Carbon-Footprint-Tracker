# Docker Status Script
# Checks the status of all Docker containers

param(
    [string]$ComposeFile = "docker-compose.prod.yml"
)

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Docker Container Status" -ForegroundColor Cyan
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

Write-Host "Checking container status..." -ForegroundColor Yellow
Write-Host ""

# Get container status
$containers = docker-compose -f $ComposeFile ps --format json | ConvertFrom-Json
$allRunning = $true
$allHealthy = $true

foreach ($container in $containers) {
    $name = $container.Name
    $state = $container.State
    $status = $container.Status
    
    if ($state -eq "running") {
        Write-Host "✅ $name" -ForegroundColor Green
        Write-Host "   State: $state" -ForegroundColor Gray
        Write-Host "   Status: $status" -ForegroundColor Gray
    } else {
        Write-Host "❌ $name" -ForegroundColor Red
        Write-Host "   State: $state" -ForegroundColor Red
        Write-Host "   Status: $status" -ForegroundColor Red
        $allRunning = $false
    }
    Write-Host ""
}

# Check health endpoints
Write-Host "Health Checks:" -ForegroundColor Yellow
Write-Host ""

# Backend health
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5000/api/health" -TimeoutSec 5 -UseBasicParsing -ErrorAction Stop
    if ($response.StatusCode -eq 200) {
        $health = $response.Content | ConvertFrom-Json
        Write-Host "✅ Backend API: Healthy" -ForegroundColor Green
        Write-Host "   Database: $($health.database)" -ForegroundColor Gray
    } else {
        Write-Host "⚠️  Backend API: Unexpected status $($response.StatusCode)" -ForegroundColor Yellow
        $allHealthy = $false
    }
} catch {
    Write-Host "❌ Backend API: Not responding" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Gray
    $allHealthy = $false
}

Write-Host ""

# Summary
Write-Host "==========================================" -ForegroundColor Cyan
if ($allRunning -and $allHealthy) {
    Write-Host "✅ All containers are running and healthy!" -ForegroundColor Green
    exit 0
} elseif ($allRunning) {
    Write-Host "⚠️  Containers are running but some health checks failed" -ForegroundColor Yellow
    exit 1
} else {
    Write-Host "❌ Some containers are not running!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Troubleshooting:" -ForegroundColor Yellow
    Write-Host "1. Check logs: docker-compose -f $ComposeFile logs" -ForegroundColor Gray
    Write-Host "2. Restart containers: docker-compose -f $ComposeFile restart" -ForegroundColor Gray
    exit 1
fi
Write-Host "==========================================" -ForegroundColor Cyan

