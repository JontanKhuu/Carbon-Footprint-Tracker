# Docker Build Script
# Builds all Docker images for production deployment

param(
    [switch]$NoCache,
    [string]$ComposeFile = "docker-compose.prod.yml"
)

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Docker Build Script" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Docker is installed
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Docker is not installed or not in PATH" -ForegroundColor Red
    Write-Host "   Please install Docker Desktop: https://www.docker.com/products/docker-desktop" -ForegroundColor Yellow
    exit 1
}

# Check if docker-compose file exists
if (-not (Test-Path $ComposeFile)) {
    Write-Host "❌ $ComposeFile not found!" -ForegroundColor Red
    exit 1
}

# Check if .env file exists
if (-not (Test-Path ".env")) {
    Write-Host "⚠️  .env file not found!" -ForegroundColor Yellow
    Write-Host "   Run: .\scripts\setup-env.ps1 to create it" -ForegroundColor Yellow
    $continue = Read-Host "Continue anyway? (y/N)"
    if ($continue -ne "y" -and $continue -ne "Y") {
        exit 1
    }
}

Write-Host "Building Docker images..." -ForegroundColor Yellow
Write-Host "Compose file: $ComposeFile" -ForegroundColor Gray
if ($NoCache) {
    Write-Host "Cache: Disabled (--no-cache)" -ForegroundColor Gray
}
Write-Host ""

# Build images
$buildArgs = @("-f", $ComposeFile, "build")
if ($NoCache) {
    $buildArgs += "--no-cache"
}

try {
    docker-compose $buildArgs
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "==========================================" -ForegroundColor Cyan
        Write-Host "✅ Docker images built successfully!" -ForegroundColor Green
        Write-Host "==========================================" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "Next steps:" -ForegroundColor Yellow
        Write-Host "1. Start containers: docker-compose -f $ComposeFile up -d" -ForegroundColor Gray
        Write-Host "2. Check status: docker-compose -f $ComposeFile ps" -ForegroundColor Gray
        Write-Host "3. View logs: docker-compose -f $ComposeFile logs -f" -ForegroundColor Gray
        exit 0
    } else {
        Write-Host ""
        Write-Host "==========================================" -ForegroundColor Cyan
        Write-Host "❌ Docker build failed!" -ForegroundColor Red
        Write-Host "==========================================" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "Troubleshooting:" -ForegroundColor Yellow
        Write-Host "1. Check Docker is running: docker ps" -ForegroundColor Gray
        Write-Host "2. Check .env file has all required variables" -ForegroundColor Gray
        Write-Host "3. Review error messages above" -ForegroundColor Gray
        exit 1
    }
} catch {
    Write-Host "❌ Error building Docker images: $_" -ForegroundColor Red
    exit 1
}

