# Deploy to Hedera Testnet
# Run this after setting up your .env file with PRIVATE_KEY

Write-Host "🚀 Deploying Paramify Insurance to Hedera Testnet..." -ForegroundColor Cyan
Write-Host ""

# Check if .env exists
if (-Not (Test-Path "contracts\.env")) {
    Write-Host "❌ ERROR: contracts\.env file not found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please create contracts\.env with your private key:" -ForegroundColor Yellow
    Write-Host "PRIVATE_KEY=your_private_key_here" -ForegroundColor Gray
    Write-Host ""
    Write-Host "See DEPLOYMENT_SETUP.md for instructions" -ForegroundColor Yellow
    exit 1
}

# Check if PRIVATE_KEY is set
$envContent = Get-Content "contracts\.env" -Raw
if ($envContent -match "your_private_key_here" -or -not ($envContent -match "PRIVATE_KEY=.+")) {
    Write-Host "❌ ERROR: Please set a valid PRIVATE_KEY in contracts\.env" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Found .env file with PRIVATE_KEY" -ForegroundColor Green
Write-Host ""

# Deploy to Hedera
Write-Host "📝 Deploying contracts..." -ForegroundColor Cyan
Set-Location contracts
npx hardhat run scripts/deploy.js --network hederaTestnet

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Deployment successful!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 Next steps:" -ForegroundColor Cyan
    Write-Host "1. Copy the contract addresses from above" -ForegroundColor White
    Write-Host "2. Update frontend\.env with the new addresses" -ForegroundColor White
    Write-Host "3. Restart the frontend: cd frontend; npm run dev" -ForegroundColor White
    Write-Host "4. Check contracts on HashScan: https://hashscan.io/testnet" -ForegroundColor White
} else {
    Write-Host ""
    Write-Host "❌ Deployment failed! Check the error above." -ForegroundColor Red
    Write-Host ""
    Write-Host "Common issues:" -ForegroundColor Yellow
    Write-Host "- Insufficient HBAR balance (get test HBAR from https://portal.hedera.com/)" -ForegroundColor Gray
    Write-Host "- Invalid private key format" -ForegroundColor Gray
    Write-Host "- Network connectivity issues" -ForegroundColor Gray
}
