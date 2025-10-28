# Param Insurance E2E Tests

Comprehensive end-to-end tests for the Param parametric insurance system.

## Overview

These tests verify the complete insurance workflow from admin setup to user payout claims:

1. **Pool Funding** - Admin deposits funds into the insurance pool
2. **Policy Purchase** - User buys insurance with premium payment
3. **Threshold Breach** - Oracle detects flood level exceeding threshold
4. **Manual Threshold** - Admin can manually adjust thresholds to trigger payouts
5. **Claim Payout** - User successfully claims insurance payout

## Prerequisites

1. **Backend Services Running**
   ```bash
   cd ../
   docker-compose up -d
   ```

2. **Smart Contracts Deployed**
   - Insurance Pool contract deployed
   - Policy Factory contract deployed
   - Contracts addresses in `.env` file

3. **Environment Variables**
   Create a `.env` file in the `backend` directory:
   ```env
   RPC_URL=https://testnet.hashio.io/api
   POOL_ADDRESS=0x...
   POLICY_FACTORY_ADDRESS=0x...
   PRIVATE_KEY=0x...
   ```

4. **Admin Wallet Funded**
   - The admin wallet (from PRIVATE_KEY) needs at least 10 HBAR
   - Get testnet HBAR from https://faucet.hedera.com/

## Installation

```bash
cd backend/e2e-tests
npm install
```

## Running Tests

### Run All Tests
```bash
npm test
```

### Run Individual Tests

**Test 1: Pool Funding**
```bash
npm run test:pool
```

**Test 2: Policy Purchase**
```bash
npm run test:policy
```

**Test 3: Oracle Threshold Detection**
```bash
npm run test:oracle
```

**Test 4: Manual Threshold Adjustment**
```bash
npm run test:threshold
```

**Test 5: User Claim Payout**
```bash
npm run test:claim
```

Note: Tests 3-5 depend on data from previous tests. Run the full suite for complete testing.

## Test Details

### Test 1: Admin Pool Funding

Verifies that the admin can deposit funds into the insurance pool contract.

**Steps:**
1. Check admin wallet balance
2. Get initial pool balance
3. Admin deposits HBAR via API
4. Verify pool balance increased
5. Query pool status from backend

**Success Criteria:**
- ✓ Admin has sufficient balance
- ✓ Pool balance increases by deposit amount
- ✓ Backend can query pool status

### Test 2: User Policy Purchase

Verifies that a user can purchase an insurance policy.

**Steps:**
1. Create and fund test user wallet
2. Check initial policy count
3. User purchases policy with coverage amount
4. Verify policy created on-chain
5. Verify policy recorded in backend
6. Verify premium deducted from user

**Success Criteria:**
- ✓ Policy created with correct coverage
- ✓ User is set as policyholder
- ✓ Premium (10% of coverage) is paid
- ✓ Policy is active on-chain
- ✓ Policy synced to backend database

### Test 3: Oracle Threshold Breach Detection

Verifies that the oracle service monitors flood levels and detects threshold breaches.

**Steps:**
1. Get current flood level from oracle
2. Get configured thresholds
3. Check if level exceeds thresholds
4. Retrieve flood history
5. Check policy eligibility for payout
6. Verify oracle monitoring is active

**Success Criteria:**
- ✓ Oracle fetches real flood data
- ✓ Thresholds are configured
- ✓ System detects threshold breaches
- ✓ Historical data is available
- ✓ Oracle monitoring job is running

### Test 4: Manual Threshold Adjustment

Verifies that admin can manually adjust thresholds to trigger payouts.

**Steps:**
1. Get current thresholds
2. Get current flood level
3. Calculate new thresholds below current level
4. Update thresholds via API
5. Verify thresholds were updated
6. Check if current level now exceeds threshold
7. Wait for oracle to process change
8. Restore original thresholds

**Success Criteria:**
- ✓ Thresholds can be updated
- ✓ Updated thresholds are persisted
- ✓ Lowering threshold triggers breach detection
- ✓ System responds to manual adjustments

### Test 5: User Claim Payout

Verifies that a user can claim payout after threshold breach.

**Steps:**
1. Check policy status before claim
2. Record user balance before claim
3. Check claims pool status
4. Verify threshold breach occurred
5. User submits claim
6. Verify claim in database
7. Verify policy marked as claimed
8. Verify pool balance updated
9. List all claims
10. Check on-chain policy state

**Success Criteria:**
- ✓ Claim is created and approved
- ✓ Payout amount is correct
- ✓ Policy marked as claimed
- ✓ Claims pool balance decreased
- ✓ User receives payout

## Test Architecture

```
e2e-tests/
├── setup.ts                    # Test configuration and utilities
├── test-1-pool-funding.ts      # Admin pool funding tests
├── test-2-policy-purchase.ts   # User policy purchase tests
├── test-3-threshold-breach.ts  # Oracle monitoring tests
├── test-4-manual-threshold.ts  # Manual threshold adjustment tests
├── test-5-claim-payout.ts      # User claim payout tests
└── run-all-tests.ts            # Main test runner
```

## Utilities (setup.ts)

The `setup.ts` file provides:

- **Configuration**: RPC URL, service endpoints, contract addresses
- **Provider/Signers**: Admin signer, test wallet creation
- **Contract ABIs**: Pool, Factory, Policy contract interfaces
- **Helper Functions**: 
  - `waitForTx()` - Wait for transaction confirmation
  - `fundWallet()` - Fund test wallet with HBAR
  - `apiCall()` - Make HTTP requests to backend APIs
  - `waitForServices()` - Check service availability
  - `formatHbar()` / `parseHbar()` - HBAR amount conversion

## Expected Output

```
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║        PARAM INSURANCE E2E TEST SUITE                ║
║                                                       ║
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
...
✓ TEST 1 PASSED: Admin Pool Funding

[... Tests 2-5 ...]

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
Duration:     45.23s

╔═══════════════════════════════════════════════════════╗
║                                                       ║
║            ✓ ALL TESTS PASSED!                       ║
║                                                       ║
║  The Param insurance system is working correctly!    ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
```

## Troubleshooting

### Service Not Available
```
Error: Claims Service is not available
```
**Solution**: Make sure all backend services are running:
```bash
cd ../
docker-compose up -d
docker-compose ps  # Check all services are up
```

### Insufficient Admin Balance
```
Error: Admin needs at least 10 HBAR to run tests
```
**Solution**: Fund the admin wallet:
1. Go to https://faucet.hedera.com/
2. Paste your admin address
3. Request HBAR

### Contract Not Deployed
```
Error: Missing required environment variable: POOL_ADDRESS
```
**Solution**: Deploy contracts first:
```bash
cd ../../contracts
npx hardhat run scripts/deploy.js --network hederaTestnet
```

### Policy Already Claimed
```
⚠ Policy has already been claimed
```
This is expected if you run the tests multiple times. The test will use the existing claim.

## Integration with CI/CD

Add to your CI/CD pipeline:

```yaml
- name: Run E2E Tests
  run: |
    cd backend/e2e-tests
    npm install
    npm test
```

## Notes

- Tests use real blockchain transactions (testnet)
- Each test run costs a small amount of HBAR for gas
- Tests create new test wallets automatically
- Previous test data (policies, claims) persists in the database
- Tests can be run multiple times safely
- The system handles duplicate claims gracefully

## Support

For issues or questions:
1. Check service logs: `docker-compose logs -f`
2. Verify environment variables
3. Ensure admin wallet has sufficient balance
4. Check contract deployment status
