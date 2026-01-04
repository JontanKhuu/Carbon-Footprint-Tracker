#!/bin/bash
# Environment Setup Script for Carbon Footprint Tracker
# This script helps set up the .env file for deployment

set -e

echo "=========================================="
echo "Carbon Footprint Tracker - Environment Setup"
echo "=========================================="
echo ""

# Check if .env already exists
if [ -f ".env" ]; then
    echo "⚠️  .env file already exists!"
    read -p "Do you want to overwrite it? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Aborted. Exiting."
        exit 1
    fi
    echo "Backing up existing .env to .env.backup"
    cp .env .env.backup
fi

# Copy example file
echo "📋 Creating .env file from env.example..."
cp env.example .env

# Generate SECRET_KEY
echo ""
echo "🔑 Generating secure SECRET_KEY..."
SECRET_KEY=$(openssl rand -hex 32)
if [ $? -eq 0 ]; then
    # Replace SECRET_KEY in .env (works on both Linux and Mac)
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' "s|your-very-secure-secret-key-generate-with-openssl-rand-hex-32|$SECRET_KEY|" .env
    else
        # Linux
        sed -i "s|your-very-secure-secret-key-generate-with-openssl-rand-hex-32|$SECRET_KEY|" .env
    fi
    echo "✅ SECRET_KEY generated and set"
else
    echo "⚠️  Could not generate SECRET_KEY automatically. Please run: openssl rand -hex 32"
fi

# Generate POSTGRES_PASSWORD
echo ""
echo "🔐 Generating secure POSTGRES_PASSWORD..."
POSTGRES_PASSWORD=$(openssl rand -base64 24 | tr -d "=+/" | cut -c1-24)
if [ $? -eq 0 ]; then
    # Replace POSTGRES_PASSWORD in .env
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "s|your_strong_password_here|$POSTGRES_PASSWORD|g" .env
    else
        sed -i "s|your_strong_password_here|$POSTGRES_PASSWORD|g" .env
    fi
    echo "✅ POSTGRES_PASSWORD generated and set"
else
    echo "⚠️  Could not generate POSTGRES_PASSWORD automatically. Please set a strong password."
fi

# Update DATABASE_URL with generated password
if [ ! -z "$POSTGRES_PASSWORD" ]; then
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "s|your_strong_password_here|$POSTGRES_PASSWORD|g" .env
    else
        sed -i "s|your_strong_password_here|$POSTGRES_PASSWORD|g" .env
    fi
fi

echo ""
echo "=========================================="
echo "✅ Environment file created successfully!"
echo "=========================================="
echo ""
echo "📝 Next steps:"
echo "1. Review and update .env file with your production values:"
echo "   - Update CORS_ORIGINS with your actual domain(s)"
echo "   - Update VITE_API_URL with your production backend URL"
echo "   - Review DATABASE_URL if using external database"
echo ""
echo "2. For production deployment, ensure:"
echo "   - All passwords are strong and unique"
echo "   - SECRET_KEY is kept secret (never commit .env to git)"
echo "   - CORS_ORIGINS only includes your production domains"
echo ""
echo "⚠️  IMPORTANT: .env file is in .gitignore and should NEVER be committed!"
echo ""

