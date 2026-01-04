#!/bin/bash
# Environment Variables Verification Script
# Checks if all required environment variables are set

echo "=========================================="
echo "Environment Variables Check"
echo "=========================================="
echo ""

ERRORS=()
WARNINGS=()

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "❌ .env file not found!"
    echo "   Run: ./scripts/setup-env.sh to create it"
    exit 1
fi

echo "✅ .env file exists"
echo ""

# Source .env file (simple parsing)
source .env 2>/dev/null || {
    echo "⚠️  Could not source .env file directly, parsing manually..."
    # Manual parsing fallback
    while IFS='=' read -r key value; do
        # Skip comments and empty lines
        [[ "$key" =~ ^#.*$ ]] && continue
        [[ -z "$key" ]] && continue
        # Remove quotes from value
        value=$(echo "$value" | sed -e 's/^"//' -e 's/"$//')
        export "$key=$value"
    done < .env
}

# Required variables
REQUIRED=("POSTGRES_USER" "POSTGRES_PASSWORD" "POSTGRES_DB" "SECRET_KEY" "FLASK_ENV" "DATABASE_URL" "CORS_ORIGINS" "VITE_API_URL")

echo "Checking required variables..."
echo ""

for var in "${REQUIRED[@]}"; do
    value=$(grep "^${var}=" .env | cut -d '=' -f2- | tr -d '"' | tr -d "'")
    if [ -n "$value" ]; then
        if [[ "$value" =~ ^your_|^your-|^https://yourdomain ]]; then
            echo "⚠️  $var is set but uses placeholder value"
            WARNINGS+=("$var (placeholder)")
        else
            echo "✅ $var is set"
        fi
    else
        echo "❌ $var is missing"
        ERRORS+=("$var")
    fi
done

echo ""
echo "Checking security..."
echo ""

# Security checks
SECRET_KEY=$(grep "^SECRET_KEY=" .env | cut -d '=' -f2- | tr -d '"' | tr -d "'")
if [[ "$SECRET_KEY" =~ dev-secret-key-change-in-production ]]; then
    echo "❌ SECRET_KEY is using default value - MUST be changed!"
    ERRORS+=("SECRET_KEY (default value)")
fi

POSTGRES_PASSWORD=$(grep "^POSTGRES_PASSWORD=" .env | cut -d '=' -f2- | tr -d '"' | tr -d "'")
if [[ "$POSTGRES_PASSWORD" =~ your_strong_password_here|^postgres$ ]]; then
    echo "❌ POSTGRES_PASSWORD is using placeholder or default - MUST be changed!"
    ERRORS+=("POSTGRES_PASSWORD (default/placeholder)")
fi

CORS_ORIGINS=$(grep "^CORS_ORIGINS=" .env | cut -d '=' -f2- | tr -d '"' | tr -d "'")
if [[ "$CORS_ORIGINS" =~ yourdomain\.com ]]; then
    echo "⚠️  CORS_ORIGINS contains placeholder - update with your actual domain"
    WARNINGS+=("CORS_ORIGINS (placeholder)")
fi

VITE_API_URL=$(grep "^VITE_API_URL=" .env | cut -d '=' -f2- | tr -d '"' | tr -d "'")
if [[ "$VITE_API_URL" =~ yourdomain\.com ]]; then
    echo "⚠️  VITE_API_URL contains placeholder - update with your actual API URL"
    WARNINGS+=("VITE_API_URL (placeholder)")
fi

echo ""
echo "=========================================="
if [ ${#ERRORS[@]} -eq 0 ] && [ ${#WARNINGS[@]} -eq 0 ]; then
    echo "✅ All checks passed!"
    exit 0
elif [ ${#ERRORS[@]} -eq 0 ]; then
    echo "⚠️  All required variables set, but some warnings:"
    for warn in "${WARNINGS[@]}"; do
        echo "   - $warn"
    done
    exit 0
else
    echo "❌ Errors found:"
    for error in "${ERRORS[@]}"; do
        echo "   - $error"
    done
    if [ ${#WARNINGS[@]} -gt 0 ]; then
        echo ""
        echo "⚠️  Warnings:"
        for warn in "${WARNINGS[@]}"; do
            echo "   - $warn"
        done
    fi
    exit 1
fi
echo "=========================================="

