# Docker Start Script
# Starts all Docker containers for production deployment

param(
    [string]$ComposeFile = "docker-compose.prod.yml",
    [switch]$Build
)

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Docker Start Script" -ForegroundColor Cyan
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

Write-Host "Starting Docker containers..." -ForegroundColor Yellow
Write-Host "Compose file: $ComposeFile" -ForegroundColor Gray
if ($Build) {
    Write-Host "Build: Enabled (--build)" -ForegroundColor Gray
}
Write-Host ""

# Start containers
$startArgs = @("-f", $ComposeFile, "up", "-d")
if ($Build) {
    $startArgs += "--build"
}

try {
    docker-compose $startArgs
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "Waiting for services to be healthy..." -ForegroundColor Yellow
        Start-Sleep -Seconds 5
        
        Write-Host ""
        Write-Host "==========================================" -ForegroundColor Cyan
        Write-Host "✅ Containers started successfully!" -ForegroundColor Green
        Write-Host "==========================================" -ForegroundColor Cyan
        Write-Host ""
        
        # Show container status
        Write-Host "Container Status:" -ForegroundColor Yellow
        docker-compose -f $ComposeFile ps
        Write-Host ""
        
        Write-Host "Next steps:" -ForegroundColor Yellow
        Write-Host "1. Check logs: docker-compose -f $ComposeFile logs -f" -ForegroundColor Gray
        Write-Host "2. Run migrations: docker-compose -f $ComposeFile exec backend flask db upgrade" -ForegroundColor Gray
        Write-Host "3. Check health: curl http://localhost:5000/api/health" -ForegroundColor Gray
        exit 0
    } else {
        Write-Host ""
        Write-Host "==========================================" -ForegroundColor Cyan
        Write-Host "❌ Failed to start containers!" -ForegroundColor Red
        Write-Host "==========================================" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "Check logs for errors:" -ForegroundColor Yellow
        Write-Host "   docker-compose -f $ComposeFile logs" -ForegroundColor Gray
        exit 1
    }
} catch {
    Write-Host "❌ Error starting containers: $_" -ForegroundColor Red
    exit 1
}

