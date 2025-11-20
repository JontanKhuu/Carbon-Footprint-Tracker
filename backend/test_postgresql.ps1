# Test script for PostgreSQL (CI/CD simulation)
# Usage: Run this to test with PostgreSQL locally

$env:TEST_DATABASE_URL = "postgresql://postgres:postgres@localhost:5433/carbon_footprint_test"
$env:FLASK_ENV = "testing"
$env:SECRET_KEY = "test-secret-key"

Write-Host "Testing with PostgreSQL..."
Write-Host "TEST_DATABASE_URL: $env:TEST_DATABASE_URL"
Write-Host ""

python -m pytest app/tests -v --tb=short

