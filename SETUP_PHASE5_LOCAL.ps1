# Phase 5 Local Testing Setup Script
# This script sets up everything needed to test the notification and analytics services

Write-Host "Phase 5 Local Testing Setup" -ForegroundColor Cyan

# Step 1: Check if Docker is running
Write-Host "`nChecking Docker..." -ForegroundColor Yellow
$dockerRunning = docker ps > $null 2>&1
if (-not $dockerRunning) {
    Write-Host "ERROR: Docker is not running. Please start Docker Desktop first." -ForegroundColor Red
    exit 1
}
Write-Host "[OK] Docker is running" -ForegroundColor Green

# Step 2: Start Docker services
Write-Host "`nStarting Docker services (PostgreSQL, Redis)..." -ForegroundColor Yellow
cd c:\Users\danie\Param\backend
docker compose up -d postgres redis

# Wait for services to be ready
Write-Host "⏳ Waiting for PostgreSQL to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Step 3: Create test database if it doesn't exist
Write-Host "`n📊 Creating/checking test database..." -ForegroundColor Yellow
docker exec param-postgres psql -U postgres -c "SELECT 1 FROM pg_database WHERE datname = 'Paramify'" > $null 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Database 'Paramify' already exists" -ForegroundColor Green
} else {
    Write-Host "Creating database 'Paramify'..." -ForegroundColor Cyan
    docker exec param-postgres psql -U postgres -c "CREATE DATABASE Paramify;"
    Write-Host "✅ Database created" -ForegroundColor Green
}

# Step 4: Check if notification-service has dependencies
Write-Host "`n📚 Checking notification-service dependencies..." -ForegroundColor Yellow
if (-not (Test-Path "c:\Users\danie\Param\backend\notification-service\node_modules")) {
    Write-Host "Installing dependencies..." -ForegroundColor Cyan
    cd c:\Users\danie\Param\backend\notification-service
    npm install
    Write-Host "✅ Dependencies installed" -ForegroundColor Green
} else {
    Write-Host "✅ Dependencies already installed" -ForegroundColor Green
}

# Step 5: Check if analytics-service has dependencies
Write-Host "`n📚 Checking analytics-service dependencies..." -ForegroundColor Yellow
if (-not (Test-Path "c:\Users\danie\Param\backend\analytics-service\node_modules")) {
    Write-Host "Installing dependencies..." -ForegroundColor Cyan
    cd c:\Users\danie\Param\backend\analytics-service
    npm install
    Write-Host "✅ Dependencies installed" -ForegroundColor Green
} else {
    Write-Host "✅ Dependencies already installed" -ForegroundColor Green
}

# Step 6: Display connection info
Write-Host "`n" -ForegroundColor Green
Write-Host "✅ Setup Complete!" -ForegroundColor Green
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "📋 Connection Details:" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Database Host:     localhost" -ForegroundColor White
Write-Host "Database Port:     5432" -ForegroundColor White
Write-Host "Database User:     postgres" -ForegroundColor White
Write-Host "Database Name:     Paramify" -ForegroundColor White
Write-Host "Redis Host:        localhost:6379" -ForegroundColor White
Write-Host "`nServices (when started):" -ForegroundColor White
Write-Host "Notification Service: http://localhost:3004" -ForegroundColor White
Write-Host "Analytics Service:    http://localhost:3005" -ForegroundColor White
Write-Host "API Gateway:          http://localhost:3000" -ForegroundColor White
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "🚀 Next Steps:" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "1. Open Terminal 1:" -ForegroundColor White
Write-Host "   cd c:\Users\danie\Param\backend\notification-service" -ForegroundColor Yellow
Write-Host "   npm run dev" -ForegroundColor Yellow
Write-Host "`n2. Open Terminal 2:" -ForegroundColor White
Write-Host "   cd c:\Users\danie\Param\backend\analytics-service" -ForegroundColor Yellow
Write-Host "   npm run dev" -ForegroundColor Yellow
Write-Host "`n3. Open Terminal 3 to test:" -ForegroundColor White
Write-Host "   curl -X GET http://localhost:3004/api/v1/notifications/health" -ForegroundColor Yellow
Write-Host "   curl -X GET http://localhost:3005/api/v1/analytics/health" -ForegroundColor Yellow
Write-Host "`n4. Or run integration tests:" -ForegroundColor White
Write-Host "   cd c:\Users\danie\Param\backend\notification-service" -ForegroundColor Yellow
Write-Host "   npm run test:integration" -ForegroundColor Yellow
Write-Host "`n========================================" -ForegroundColor Cyan
