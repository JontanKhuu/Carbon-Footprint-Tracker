# Environment Setup Script for Carbon Footprint Tracker (PowerShell)
# This script helps set up the .env file for deployment
#
# Usage:
#   Interactive mode:  .\scripts\setup-env.ps1
#   Non-interactive:  .\scripts\setup-env.ps1 -y
#   CI/Deployment:    $env:CI="true"; .\scripts\setup-env.ps1
#
# Requirements:
#   - PowerShell 5.1 or later (Windows Server 2016+, Windows 10+)
#   - env.example file in the project root
#   - No machine-specific dependencies (works in any Windows environment)
#
# Compatibility:
#   - Works with PowerShell 5.1 (uses RNGCryptoServiceProvider for compatibility)
#   - Works in non-interactive/CI environments
#   - Uses relative paths (works regardless of installation location)

# Suppress verbose output and prevent script code from being displayed
# Turn off any debug tracing first
if ($PSDebugContext) {
    Set-PSDebug -Off
}
$VerbosePreference = 'SilentlyContinue'
$DebugPreference = 'SilentlyContinue'
$InformationPreference = 'SilentlyContinue'
$WarningPreference = 'Continue'
$ErrorActionPreference = 'Continue'
# Ensure trace is off
Set-PSDebug -Off -ErrorAction SilentlyContinue | Out-Null

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Carbon Footprint Tracker - Environment Setup" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Get the current working directory
$workingDir = Get-Location
Write-Host "Working directory: $workingDir" -ForegroundColor Gray
Write-Host ""

# Check if running in non-interactive mode (for deployment/CI)
$nonInteractive = $env:CI -eq "true" -or $env:SKIP_ENV_PROMPT -eq "true" -or $args -contains "-y" -or $args -contains "--yes"

# Check if .env already exists
if (Test-Path ".env") {
    if ($nonInteractive) {
        Write-Host "[WARNING] .env file already exists. Overwriting in non-interactive mode..." -ForegroundColor Yellow
        Write-Host "Backing up existing .env to .env.backup" -ForegroundColor Yellow
        Copy-Item ".env" ".env.backup" -ErrorAction SilentlyContinue
    } else {
        Write-Host "[WARNING] .env file already exists!" -ForegroundColor Yellow
        $overwrite = Read-Host "Do you want to overwrite it? (y/N)"
        if ($overwrite -ne "y" -and $overwrite -ne "Y") {
            Write-Host "Aborted. Exiting." -ForegroundColor Red
            exit 1
        }
        Write-Host "Backing up existing .env to .env.backup" -ForegroundColor Yellow
        Copy-Item ".env" ".env.backup" -ErrorAction SilentlyContinue
    }
}

# Copy example file
Write-Host "[INFO] Creating .env file from env.example..." -ForegroundColor Green
if (-not (Test-Path "env.example")) {
    Write-Host "[ERROR] env.example file not found!" -ForegroundColor Red
    Write-Host "   Please ensure env.example exists in the current directory." -ForegroundColor Red
    exit 1
}

# Copy file using Get-Content/Set-Content for better reliability
try {
    $currentDir = Get-Location
    $sourceFile = Join-Path $currentDir "env.example"
    $destFile = Join-Path $currentDir ".env"
    
    Write-Host "   Source: $sourceFile" -ForegroundColor Gray
    Write-Host "   Destination: $destFile" -ForegroundColor Gray
    
    if (-not (Test-Path $sourceFile)) {
        Write-Host "[ERROR] Source file env.example not found at $sourceFile" -ForegroundColor Red
        exit 1
    }
    
    # Read the source file content
    $fileContent = Get-Content $sourceFile -Raw -ErrorAction Stop
    if ($null -eq $fileContent) {
        Write-Host "[ERROR] Could not read content from env.example" -ForegroundColor Red
        exit 1
    }
    
    # Write to destination file
    Set-Content -Path $destFile -Value $fileContent -NoNewline -ErrorAction Stop
    
    # Verify the file was created
    if (-not (Test-Path $destFile)) {
        Write-Host "[ERROR] Failed to create .env file!" -ForegroundColor Red
        Write-Host "   Expected location: $destFile" -ForegroundColor Red
        Write-Host "   Current directory: $currentDir" -ForegroundColor Red
        Write-Host "   Source file exists: $(Test-Path $sourceFile)" -ForegroundColor Red
        exit 1
    }
    
    # Double-check file size
    $fileInfo = Get-Item $destFile -ErrorAction SilentlyContinue
    if ($null -eq $fileInfo -or $fileInfo.Length -eq 0) {
        Write-Host "[ERROR] .env file was created but is empty!" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "[SUCCESS] .env file created successfully" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Error copying env.example to .env: $_" -ForegroundColor Red
    Write-Host "   Exception: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "   Exception Type: $($_.Exception.GetType().FullName)" -ForegroundColor Red
    if ($_.Exception.InnerException) {
        Write-Host "   Inner Exception: $($_.Exception.InnerException.Message)" -ForegroundColor Red
    }
    exit 1
}

# Generate SECRET_KEY
Write-Host ""
Write-Host "[INFO] Generating secure SECRET_KEY..." -ForegroundColor Green
try {
    # Use OpenSSL if available, otherwise use PowerShell random generation
    $secretKey = ""
    if (Get-Command openssl -ErrorAction SilentlyContinue) {
        $secretKey = (openssl rand -hex 32).Trim()
    } else {
        # Fallback: Generate random hex string using PowerShell (compatible with older versions)
        $bytes = New-Object byte[] 32
        $rng = New-Object System.Security.Cryptography.RNGCryptoServiceProvider
        $rng.GetBytes($bytes)
        $secretKey = ($bytes | ForEach-Object { $_.ToString("x2") }) -join ""
        $rng.Dispose()
    }
    
    if ($secretKey -and $secretKey.Length -gt 0) {
        $envFile = Join-Path (Get-Location) ".env"
        if (-not (Test-Path $envFile)) {
            Write-Host "[ERROR] .env file not found at $envFile" -ForegroundColor Red
            return
        }
        $envContent = Get-Content $envFile -Raw
        if ($envContent -match 'your-very-secure-secret-key-generate-with-openssl-rand-hex-32') {
            $envContent = $envContent -replace [regex]::Escape('your-very-secure-secret-key-generate-with-openssl-rand-hex-32'), $secretKey
            $envContent | Set-Content $envFile -NoNewline
            Write-Host "[SUCCESS] SECRET_KEY generated and set" -ForegroundColor Green
        } else {
            Write-Host "[WARNING] Placeholder 'your-very-secure-secret-key-generate-with-openssl-rand-hex-32' not found in .env file" -ForegroundColor Yellow
        }
    } else {
        Write-Host "[WARNING] Could not generate SECRET_KEY automatically. Please run: openssl rand -hex 32" -ForegroundColor Yellow
    }
} catch {
    Write-Host "[WARNING] Error generating SECRET_KEY: $_" -ForegroundColor Yellow
    Write-Host "   Please run manually: openssl rand -hex 32" -ForegroundColor Yellow
}

# Generate POSTGRES_PASSWORD
Write-Host ""
Write-Host "[INFO] Generating secure POSTGRES_PASSWORD..." -ForegroundColor Green
try {
    # Generate random password using RNGCryptoServiceProvider (compatible with older PowerShell versions)
    $bytes = New-Object byte[] 24
    $rng = New-Object System.Security.Cryptography.RNGCryptoServiceProvider
    $rng.GetBytes($bytes)
    $base64Password = [Convert]::ToBase64String($bytes)
    $rng.Dispose()
    
    $cleanedPassword = $base64Password -replace '[=+/]', ''
    $postgresPassword = $cleanedPassword.Substring(0, [Math]::Min(24, $cleanedPassword.Length))
    
    if ($postgresPassword -and $postgresPassword.Length -gt 0) {
        $envFile = Join-Path (Get-Location) ".env"
        if (-not (Test-Path $envFile)) {
            Write-Host "[ERROR] .env file not found at $envFile" -ForegroundColor Red
            return
        }
        $envContent = Get-Content $envFile -Raw
        if ($envContent -match 'your_strong_password_here') {
            # Replace all occurrences of the placeholder (in both POSTGRES_PASSWORD and DATABASE_URL)
            $envContent = $envContent -replace [regex]::Escape('your_strong_password_here'), $postgresPassword
            $envContent | Set-Content $envFile -NoNewline
            Write-Host "[SUCCESS] POSTGRES_PASSWORD generated and set" -ForegroundColor Green
        } else {
            Write-Host "[WARNING] Placeholder 'your_strong_password_here' not found in .env file" -ForegroundColor Yellow
        }
    } else {
        Write-Host "[WARNING] Could not generate POSTGRES_PASSWORD automatically." -ForegroundColor Yellow
    }
} catch {
    Write-Host "[WARNING] Error generating POSTGRES_PASSWORD: $_" -ForegroundColor Yellow
    Write-Host "   Error details: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "[SUCCESS] Environment file created successfully!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "[INFO] Next steps:" -ForegroundColor Yellow
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
Write-Host "[WARNING] IMPORTANT: .env file is in .gitignore and should NEVER be committed!" -ForegroundColor Red
Write-Host ""

