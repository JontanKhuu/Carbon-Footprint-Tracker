#!/bin/bash
# Test script for PostgreSQL (CI/CD simulation)
# Usage: Run this to test with PostgreSQL locally

export TEST_DATABASE_URL="postgresql://postgres:postgres@localhost:5433/carbon_footprint_test"
export FLASK_ENV="testing"
export SECRET_KEY="test-secret-key"

echo "Testing with PostgreSQL..."
echo "TEST_DATABASE_URL: $TEST_DATABASE_URL"
echo ""

python -m pytest app/tests -v --tb=short

