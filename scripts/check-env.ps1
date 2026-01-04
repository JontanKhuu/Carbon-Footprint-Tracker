# Environment Variables Verification Script
# Checks if all required environment variables are set

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Environment Variables Check" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

$errors = @()
$warnings = @()

# Check if .env file exists
if (-not (Test-Path ".env")) {
    Write-Host "❌ .env file not found!" -ForegroundColor Red
    Write-Host "   Run: .\scripts\setup-env.ps1 to create it" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ .env file exists" -ForegroundColor Green
Write-Host ""

# Load .env file
$envVars = @{}
Get-Content ".env" | ForEach-Object {
    if ($_ -match '^([^#][^=]+)=(.*)$') {
        $key = $matches[1].Trim()
        $value = $matches[2].Trim()
        $envVars[$key] = $value
    }
}

# Required variables
$required = @(
    "POSTGRES_USER",
    "POSTGRES_PASSWORD",
    "POSTGRES_DB",
    "SECRET_KEY",
    "FLASK_ENV",
    "DATABASE_URL",
    "CORS_ORIGINS",
    "VITE_API_URL"
)

Write-Host "Checking required variables..." -ForegroundColor Yellow
Write-Host ""

foreach ($var in $required) {
    if ($envVars.ContainsKey($var)) {
        $value = $envVars[$var]
        if ($value -and $value -notmatch '^your_|^your-|^https://yourdomain') {
            Write-Host "✅ $var is set" -ForegroundColor Green
        } else {
            Write-Host "⚠️  $var is set but uses placeholder value" -ForegroundColor Yellow
            $warnings += $var
        }
    } else {
        Write-Host "❌ $var is missing" -ForegroundColor Red
        $errors += $var
    }
}

Write-Host ""
Write-Host "Checking security..." -ForegroundColor Yellow
Write-Host ""

# Security checks
if ($envVars["SECRET_KEY"] -match 'dev-secret-key-change-in-production') {
    Write-Host "❌ SECRET_KEY is using default value - MUST be changed!" -ForegroundColor Red
    $errors += "SECRET_KEY (default value)"
}

if ($envVars["POSTGRES_PASSWORD"] -match 'your_strong_password_here|postgres') {
    Write-Host "❌ POSTGRES_PASSWORD is using placeholder or default - MUST be changed!" -ForegroundColor Red
    $errors += "POSTGRES_PASSWORD (default/placeholder)"
}

if ($envVars["CORS_ORIGINS"] -match 'yourdomain\.com') {
    Write-Host "⚠️  CORS_ORIGINS contains placeholder - update with your actual domain" -ForegroundColor Yellow
    $warnings += "CORS_ORIGINS (placeholder)"
}

if ($envVars["VITE_API_URL"] -match 'yourdomain\.com') {
    Write-Host "⚠️  VITE_API_URL contains placeholder - update with your actual API URL" -ForegroundColor Yellow
    $warnings += "VITE_API_URL (placeholder)"
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
if ($errors.Count -eq 0 -and $warnings.Count -eq 0) {
    Write-Host "✅ All checks passed!" -ForegroundColor Green
    exit 0
} elseif ($errors.Count -eq 0) {
    Write-Host "⚠️  All required variables set, but some warnings:" -ForegroundColor Yellow
    foreach ($warn in $warnings) {
        Write-Host "   - $warn" -ForegroundColor Yellow
    }
    exit 0
} else {
    Write-Host "❌ Errors found:" -ForegroundColor Red
    foreach ($error in $errors) {
        Write-Host "   - $error" -ForegroundColor Red
    }
    if ($warnings.Count -gt 0) {
        Write-Host ""
        Write-Host "⚠️  Warnings:" -ForegroundColor Yellow
        foreach ($warn in $warnings) {
            Write-Host "   - $warn" -ForegroundColor Yellow
        }
    }
    exit 1
}
Write-Host "==========================================" -ForegroundColor Cyan

