# Cloud Platform Health Verification Script
# Verifies that deployed services are healthy

param(
    [string]$BackendUrl = "",
    [string]$FrontendUrl = ""
)

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Cloud Platform Health Verification" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

$allHealthy = $true

# Check backend health
if ($BackendUrl) {
    Write-Host "Checking backend health..." -ForegroundColor Yellow
    try {
        $healthUrl = if ($BackendUrl.EndsWith("/")) { "$BackendUrl/api/health" } else { "$BackendUrl/api/health" }
        $response = Invoke-WebRequest -Uri $healthUrl -TimeoutSec 10 -UseBasicParsing -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            $health = $response.Content | ConvertFrom-Json
            Write-Host "✅ Backend API: Healthy" -ForegroundColor Green
            Write-Host "   Status: $($health.status)" -ForegroundColor Gray
            Write-Host "   Database: $($health.database)" -ForegroundColor Gray
            
            if ($health.database -notmatch "connected") {
                Write-Host "   ⚠️  Database connection issue detected" -ForegroundColor Yellow
                $allHealthy = $false
            }
        } else {
            Write-Host "❌ Backend API: Unexpected status $($response.StatusCode)" -ForegroundColor Red
            $allHealthy = $false
        }
    } catch {
        Write-Host "❌ Backend API: Not responding" -ForegroundColor Red
        Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Gray
        $allHealthy = $false
    }
    Write-Host ""
} else {
    Write-Host "⚠️  Backend URL not provided, skipping backend check" -ForegroundColor Yellow
    Write-Host ""
}

# Check frontend
if ($FrontendUrl) {
    Write-Host "Checking frontend..." -ForegroundColor Yellow
    try {
        $response = Invoke-WebRequest -Uri $FrontendUrl -TimeoutSec 10 -UseBasicParsing -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ Frontend: Accessible" -ForegroundColor Green
            Write-Host "   Status Code: $($response.StatusCode)" -ForegroundColor Gray
        } else {
            Write-Host "⚠️  Frontend: Unexpected status $($response.StatusCode)" -ForegroundColor Yellow
            $allHealthy = $false
        }
    } catch {
        Write-Host "❌ Frontend: Not accessible" -ForegroundColor Red
        Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Gray
        $allHealthy = $false
    }
    Write-Host ""
} else {
    Write-Host "⚠️  Frontend URL not provided, skipping frontend check" -ForegroundColor Yellow
    Write-Host ""
}

# Summary
Write-Host "==========================================" -ForegroundColor Cyan
if ($allHealthy) {
    Write-Host "✅ All services are healthy!" -ForegroundColor Green
    exit 0
} else {
    Write-Host "❌ Some services have issues" -ForegroundColor Red
    Write-Host ""
    Write-Host "Troubleshooting:" -ForegroundColor Yellow
    Write-Host "1. Check service logs in cloud platform dashboard" -ForegroundColor Gray
    Write-Host "2. Verify environment variables are set correctly" -ForegroundColor Gray
    Write-Host "3. Check database connection" -ForegroundColor Gray
    Write-Host "4. Verify CORS settings if frontend can't access backend" -ForegroundColor Gray
    exit 1
fi
Write-Host "==========================================" -ForegroundColor Cyan

