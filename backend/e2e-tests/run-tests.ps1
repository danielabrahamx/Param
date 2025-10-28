# Param Insurance E2E Test Quick Start Script
# This script sets up and runs the end-to-end tests

Write-Host ""
Write-Host "╔═══════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                                                       ║" -ForegroundColor Cyan
Write-Host "║        PARAM INSURANCE E2E TEST SETUP                ║" -ForegroundColor Cyan
Write-Host "║                                                       ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check environment variables
Write-Host "Step 1: Checking environment variables..." -ForegroundColor Yellow
$envFile = "../.env"

if (-not (Test-Path $envFile)) {
    Write-Host "✗ Error: .env file not found at $envFile" -ForegroundColor Red
    Write-Host "  Please create a .env file with required variables:" -ForegroundColor Red
    Write-Host "    - RPC_URL" -ForegroundColor Red
    Write-Host "    - POOL_ADDRESS" -ForegroundColor Red
    Write-Host "    - POLICY_FACTORY_ADDRESS" -ForegroundColor Red
    Write-Host "    - PRIVATE_KEY" -ForegroundColor Red
    exit 1
}

Write-Host "✓ .env file found" -ForegroundColor Green
Write-Host ""

# Step 2: Check if backend services are running
Write-Host "Step 2: Checking backend services..." -ForegroundColor Yellow

Set-Location ..
$services = docker-compose ps --services --filter "status=running"

if ($services -match "api-gateway" -and $services -match "policy-service" -and $services -match "claims-service" -and $services -match "oracle-service") {
    Write-Host "✓ Backend services are running" -ForegroundColor Green
} else {
    Write-Host "⚠ Some backend services may not be running" -ForegroundColor Yellow
    Write-Host "  Starting backend services..." -ForegroundColor Yellow
    docker-compose up -d
    Write-Host "  Waiting for services to be ready..." -ForegroundColor Yellow
    Start-Sleep -Seconds 10
}

Set-Location e2e-tests
Write-Host ""

# Step 3: Install dependencies
Write-Host "Step 3: Installing test dependencies..." -ForegroundColor Yellow

if (-not (Test-Path "node_modules")) {
    npm install
    Write-Host "✓ Dependencies installed" -ForegroundColor Green
} else {
    Write-Host "✓ Dependencies already installed" -ForegroundColor Green
}
Write-Host ""

# Step 4: Run tests
Write-Host "Step 4: Running E2E tests..." -ForegroundColor Yellow
Write-Host ""

npm test

Write-Host ""
Write-Host "Test run complete!" -ForegroundColor Cyan
Write-Host ""
