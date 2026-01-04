# Docker Logs Script
# Shows logs from Docker containers

param(
    [string]$ComposeFile = "docker-compose.prod.yml",
    [string]$Service = "",
    [switch]$Follow,
    [int]$Tail = 100
)

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Docker Container Logs" -ForegroundColor Cyan
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

# Build log command
$logArgs = @("-f", $ComposeFile, "logs")
if ($Follow) {
    $logArgs += "--follow"
}
$logArgs += "--tail=$Tail"
if ($Service) {
    $logArgs += $Service
}

Write-Host "Showing logs..." -ForegroundColor Yellow
if ($Service) {
    Write-Host "Service: $Service" -ForegroundColor Gray
}
if ($Follow) {
    Write-Host "Mode: Following (Press Ctrl+C to stop)" -ForegroundColor Gray
} else {
    Write-Host "Lines: Last $Tail" -ForegroundColor Gray
}
Write-Host ""

# Show logs
try {
    docker-compose $logArgs
} catch {
    Write-Host "❌ Error showing logs: $_" -ForegroundColor Red
    exit 1
}

