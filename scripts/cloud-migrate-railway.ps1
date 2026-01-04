# Railway Migration Script
# Runs database migrations on Railway

param(
    [string]$ServiceName = "backend"
)

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Railway Database Migration" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Railway CLI is installed
if (-not (Get-Command railway -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Railway CLI is not installed" -ForegroundColor Red
    Write-Host ""
    Write-Host "Install Railway CLI:" -ForegroundColor Yellow
    Write-Host "   npm i -g @railway/cli" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Then login and link your project:" -ForegroundColor Yellow
    Write-Host "   railway login" -ForegroundColor Gray
    Write-Host "   railway link" -ForegroundColor Gray
    exit 1
}

Write-Host "Running database migrations..." -ForegroundColor Yellow
Write-Host "Service: $ServiceName" -ForegroundColor Gray
Write-Host ""

try {
    railway run --service $ServiceName flask db upgrade
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "==========================================" -ForegroundColor Cyan
        Write-Host "✅ Migrations completed successfully!" -ForegroundColor Green
        Write-Host "==========================================" -ForegroundColor Cyan
        exit 0
    } else {
        Write-Host ""
        Write-Host "==========================================" -ForegroundColor Cyan
        Write-Host "❌ Migration failed!" -ForegroundColor Red
        Write-Host "==========================================" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "Troubleshooting:" -ForegroundColor Yellow
        Write-Host "1. Verify Railway project is linked: railway link" -ForegroundColor Gray
        Write-Host "2. Check service name is correct" -ForegroundColor Gray
        Write-Host "3. Verify DATABASE_URL is set in Railway dashboard" -ForegroundColor Gray
        exit 1
    }
} catch {
    Write-Host "❌ Error running migration: $_" -ForegroundColor Red
    exit 1
}

