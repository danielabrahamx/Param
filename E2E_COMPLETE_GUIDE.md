# Complete E2E Test Setup and Execution Guide

## Overview

This guide walks through setting up and running the comprehensive E2E test suite for the Param insurance system.

## What Was Created

### Test Files (8 files)
1. **setup.ts** - Common utilities, configuration, and helper functions
2. **test-1-pool-funding.ts** - Tests admin funding the insurance pool
3. **test-2-policy-purchase.ts** - Tests user purchasing insurance policy
4. **test-3-threshold-breach.ts** - Tests oracle flood monitoring
5. **test-4-manual-threshold.ts** - Tests manual threshold adjustment
6. **test-5-claim-payout.ts** - Tests user claiming insurance payout
7. **run-all-tests.ts** - Main orchestrator that runs all tests
8. **run-tests.ps1** - PowerShell quick start script

### Configuration Files
- **package.json** - Dependencies and npm scripts
- **tsconfig.json** - TypeScript configuration
- **README.md** - Complete documentation

### Documentation
- **E2E_TEST_SUMMARY.md** - Comprehensive overview
- **E2E_TESTS_QUICK_REF.md** - Quick reference card

## Step-by-Step Setup

### Step 1: Ensure Backend Services Are Running

```bash
cd backend
docker-compose up -d
```

Verify all services are up:
```bash
docker-compose ps
```

You should see these services running:
- postgres
- api-gateway
- policy-service
- oracle-service
- claims-service
- notification-service
- analytics-service

### Step 2: Verify Contracts Are Deployed

Check that your `backend/.env` file has these variables:

```env
RPC_URL=https://testnet.hashio.io/api
POOL_ADDRESS=0x1234...  # Your deployed pool contract
POLICY_FACTORY_ADDRESS=0x5678...  # Your deployed factory
PRIVATE_KEY=0xabcd...  # Your admin wallet key
```

If contracts aren't deployed yet:

```bash
cd contracts
npx hardhat run scripts/deploy.js --network hederaTestnet
```

Copy the output addresses to `backend/.env`

### Step 3: Fund Admin Wallet

The admin wallet needs at least 10 HBAR to run the tests.

1. Get your admin address by running this in the contracts folder:
```bash
node -e "
const { ethers } = require('ethers');
require('dotenv').config();
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY);
console.log('Admin Address:', wallet.address);
"
```

2. Visit https://faucet.hedera.com/
3. Paste your admin address
4. Request HBAR
5. Check balance at: https://hashscan.io/testnet/account/YOUR_ADDRESS

### Step 4: Install Test Dependencies

```bash
cd backend/e2e-tests
npm install
```

### Step 5: Run the Tests

**Option A: Using PowerShell Script (Recommended)**
```bash
./run-tests.ps1
```

**Option B: Using npm**
```bash
npm test
```

**Option C: Individual Tests**
```bash
npm run test:pool         # Test pool funding only
npm run test:policy       # Test policy purchase only
npm run test:oracle       # Test oracle monitoring only
npm run test:threshold    # Test threshold adjustment only
npm run test:claim        # Test claim payout only
```

## What Each Test Does

### Test 1: Admin Pool Funding
```
1. Check admin has sufficient HBAR (needs ≥10 HBAR)
2. Get current pool balance
3. Admin deposits 5 HBAR via API
4. Verify pool balance increased
5. Query pool status from backend
```

**Success Criteria:**
- Admin balance sufficient ✓
- Pool balance increases by 5 HBAR ✓
- Backend can query pool ✓

### Test 2: User Policy Purchase
```
1. Create new test user wallet
2. Fund user with 2 HBAR
3. User purchases 10 HBAR coverage (1 HBAR premium)
4. Verify policy created on-chain
5. Verify policy synced to database
6. Verify premium deducted
```

**Success Criteria:**
- Policy created with correct coverage ✓
- User is policyholder ✓
- Premium paid (10% of coverage) ✓
- Policy active on-chain ✓
- Policy in database ✓

### Test 3: Oracle Threshold Breach Detection
```
1. Get current flood level from USGS
2. Get configured thresholds
3. Compare level to thresholds
4. Retrieve flood history
5. Check policy eligibility
6. Verify oracle monitoring active
```

**Success Criteria:**
- Oracle fetches real data ✓
- Thresholds configured ✓
- Breach detection works ✓
- History available ✓
- Monitoring active ✓

### Test 4: Manual Threshold Adjustment
```
1. Get current thresholds
2. Get current flood level
3. Set new threshold below current (trigger breach)
4. Update via API
5. Verify threshold updated
6. Confirm breach detected
7. Restore original thresholds
```

**Success Criteria:**
- Thresholds can be updated ✓
- Updates persisted ✓
- Breach triggered by adjustment ✓
- System responds to changes ✓

### Test 5: User Claim Payout
```
1. Check policy status
2. Record user balance
3. Check claims pool status
4. Verify threshold breached
5. User submits claim
6. Verify claim approved
7. Verify policy marked as claimed
8. Verify pool balance updated
```

**Success Criteria:**
- Claim created and approved ✓
- Payout amount correct ✓
- Policy marked claimed ✓
- Pool balance decreased ✓
- User receives payout ✓

## Expected Output

When all tests pass, you'll see:

```
╔═══════════════════════════════════════════════════════╗
║        PARAM INSURANCE E2E TEST SUITE                ║
╚═══════════════════════════════════════════════════════╝

Checking environment configuration...
✓ Environment configured

Checking service availability...
✓ Policy Service is ready
✓ Oracle Service is ready
✓ Claims Service is ready
✓ All services ready

Running Test 1 of 5...
═══════════════════════════════════════════════════════
TEST 1: Admin Pool Funding
═══════════════════════════════════════════════════════
[Detailed test steps...]
✓ TEST 1 PASSED: Admin Pool Funding

Running Test 2 of 5...
[...]

╔═══════════════════════════════════════════════════════╗
║                   TEST SUMMARY                        ║
╚═══════════════════════════════════════════════════════╝

✓ Test 1: Pool Funding - PASSED
✓ Test 2: Policy Purchase - PASSED
✓ Test 3: Threshold Breach - PASSED
✓ Test 4: Manual Threshold - PASSED
✓ Test 5: Claim Payout - PASSED

Total Tests:  5
Passed:       5
Failed:       0
Duration:     42.5s

╔═══════════════════════════════════════════════════════╗
║            ✓ ALL TESTS PASSED!                       ║
║  The Param insurance system is working correctly!    ║
╚═══════════════════════════════════════════════════════╝
```

## Troubleshooting

### Error: Service Not Available
```
Error: Claims Service is not available at http://localhost:3003
```

**Solution:**
```bash
cd backend
docker-compose ps  # Check which services are down
docker-compose up -d  # Start services
docker-compose logs -f claims-service  # Check logs
```

### Error: Admin Needs HBAR
```
Error: Admin needs at least 10 HBAR to run tests
```

**Solution:**
1. Go to https://faucet.hedera.com/
2. Enter your admin address (shown in error)
3. Request HBAR
4. Wait 30 seconds
5. Run tests again

### Error: Missing Environment Variable
```
Error: Missing required environment variable: POOL_ADDRESS
```

**Solution:**
1. Check `backend/.env` file exists
2. Ensure it has all required variables:
   - RPC_URL
   - POOL_ADDRESS
   - POLICY_FACTORY_ADDRESS
   - PRIVATE_KEY
3. Deploy contracts if needed

### Error: Policy Already Claimed
```
⚠ Policy has already been claimed (expected if test ran before)
```

**This is normal!** The test handles this gracefully. Tests can be run multiple times. The existing claim will be used for verification.

### Test Timeout
If tests hang or timeout:

1. Check network connectivity
2. Verify Hedera testnet is operational
3. Check backend services are responding:
   ```bash
   curl http://localhost:3001/api/v1/policies
   curl http://localhost:3002/api/v1/oracle/flood-level/01646500
   curl http://localhost:3003/api/v1/claims
   ```

## Test Data

### What Gets Created
- 1 insurance pool deposit transaction (5 HBAR)
- 1 test user wallet (randomly generated)
- 1 insurance policy (10 HBAR coverage)
- 1 threshold adjustment
- 1 insurance claim

### Persistence
- Policies remain in database
- Claims remain in database
- Test user wallet address is unique each run
- Multiple test runs are safe

### Cleanup
Test data persists for debugging. To clean:

```bash
# Reset database (loses all data)
cd backend
docker-compose down -v
docker-compose up -d
```

## Running in CI/CD

### GitHub Actions Example
```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Start Backend Services
        run: |
          cd backend
          docker-compose up -d
          sleep 15
      
      - name: Install Dependencies
        run: |
          cd backend/e2e-tests
          npm install
      
      - name: Run E2E Tests
        env:
          RPC_URL: ${{ secrets.RPC_URL }}
          POOL_ADDRESS: ${{ secrets.POOL_ADDRESS }}
          POLICY_FACTORY_ADDRESS: ${{ secrets.POLICY_FACTORY_ADDRESS }}
          PRIVATE_KEY: ${{ secrets.PRIVATE_KEY }}
        run: |
          cd backend/e2e-tests
          npm test
```

## Cost Estimate

Each full test run costs approximately:
- Admin deposit: ~0.001 HBAR (gas)
- Policy creation: 1 HBAR (premium) + ~0.001 HBAR (gas)
- Claim processing: ~0.001 HBAR (gas)
- User wallet funding: 2 HBAR (returned after test)

**Total cost per run: ~1.003 HBAR** (plus test wallet funding which stays with test wallet)

## Best Practices

1. **Run tests before deployment**
   ```bash
   npm test  # Must pass before deploying
   ```

2. **Run tests after major changes**
   - After contract updates
   - After API changes
   - After database migrations

3. **Check individual tests during development**
   ```bash
   npm run test:policy  # Test just one feature
   ```

4. **Monitor test duration**
   - Normal: 30-60 seconds
   - Slow: >90 seconds (check network/services)

5. **Review test output**
   - Read failure messages carefully
   - Check transaction hashes on Hashscan
   - Verify service logs if needed

## Next Steps

After tests pass:

1. ✓ Backend is verified working
2. ✓ Smart contracts are functional
3. ✓ Integration is correct
4. ✓ Ready for frontend testing
5. ✓ Ready for deployment

## Support

If you encounter issues:

1. Check this guide's troubleshooting section
2. Review `backend/e2e-tests/README.md`
3. Check service logs: `docker-compose logs -f`
4. Verify contract deployment
5. Ensure admin has HBAR

## Summary

You now have a complete E2E test suite that:

✓ Tests all backend services  
✓ Verifies smart contract integration  
✓ Validates complete user workflows  
✓ Uses real blockchain transactions  
✓ Provides detailed output  
✓ Handles edge cases  
✓ Can run repeatedly  
✓ Is ready for CI/CD  

The tests ensure your Param insurance system works end-to-end!
