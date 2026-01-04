# Environment Setup Script for Carbon Footprint Tracker (PowerShell)
# This script helps set up the .env file for deployment

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Carbon Footprint Tracker - Environment Setup" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Check if .env already exists
if (Test-Path ".env") {
    Write-Host "⚠️  .env file already exists!" -ForegroundColor Yellow
    $overwrite = Read-Host "Do you want to overwrite it? (y/N)"
    if ($overwrite -ne "y" -and $overwrite -ne "Y") {
        Write-Host "Aborted. Exiting." -ForegroundColor Red
        exit 1
    }
    Write-Host "Backing up existing .env to .env.backup" -ForegroundColor Yellow
    Copy-Item ".env" ".env.backup"
}

# Copy example file
Write-Host "📋 Creating .env file from env.example..." -ForegroundColor Green
Copy-Item "env.example" ".env"

# Generate SECRET_KEY
Write-Host ""
Write-Host "🔑 Generating secure SECRET_KEY..." -ForegroundColor Green
try {
    # Use OpenSSL if available, otherwise use PowerShell random generation
    $secretKey = ""
    if (Get-Command openssl -ErrorAction SilentlyContinue) {
        $secretKey = openssl rand -hex 32
    } else {
        # Fallback: Generate random hex string using PowerShell
        $bytes = New-Object byte[] 32
        [System.Security.Cryptography.RandomNumberGenerator]::Fill($bytes)
        $secretKey = ($bytes | ForEach-Object { $_.ToString("x2") }) -join ""
    }
    
    if ($secretKey) {
        (Get-Content .env) -replace 'your-very-secure-secret-key-generate-with-openssl-rand-hex-32', $secretKey | Set-Content .env
        Write-Host "✅ SECRET_KEY generated and set" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Could not generate SECRET_KEY automatically. Please run: openssl rand -hex 32" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️  Error generating SECRET_KEY: $_" -ForegroundColor Yellow
    Write-Host "   Please run manually: openssl rand -hex 32" -ForegroundColor Yellow
}

# Generate POSTGRES_PASSWORD
Write-Host ""
Write-Host "🔐 Generating secure POSTGRES_PASSWORD..." -ForegroundColor Green
try {
    $bytes = New-Object byte[] 24
    [System.Security.Cryptography.RandomNumberGenerator]::Fill($bytes)
    $postgresPassword = [Convert]::ToBase64String($bytes) -replace '[=+/]', '' | Select-Object -First 24
    
    if ($postgresPassword) {
        (Get-Content .env) -replace 'your_strong_password_here', $postgresPassword | Set-Content .env
        Write-Host "✅ POSTGRES_PASSWORD generated and set" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Could not generate POSTGRES_PASSWORD automatically." -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️  Error generating POSTGRES_PASSWORD: $_" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "✅ Environment file created successfully!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📝 Next steps:" -ForegroundColor Yellow
Write-Host "1. Review and update .env file with your production values:"
Write-Host "   - Update CORS_ORIGINS with your actual domain(s)"
Write-Host "   - Update VITE_API_URL with your production backend URL"
Write-Host "   - Review DATABASE_URL if using external database"
Write-Host ""
Write-Host "2. For production deployment, ensure:"
Write-Host "   - All passwords are strong and unique"
Write-Host "   - SECRET_KEY is kept secret (never commit .env to git)"
Write-Host "   - CORS_ORIGINS only includes your production domains"
Write-Host ""
Write-Host "⚠️  IMPORTANT: .env file is in .gitignore and should NEVER be committed!" -ForegroundColor Red
Write-Host ""

