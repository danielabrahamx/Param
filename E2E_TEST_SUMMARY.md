# E2E Test Suite Summary

## Overview

A comprehensive end-to-end test suite has been created for the Param insurance backend system. The tests verify the complete workflow from admin pool funding through user policy purchase to claim payouts.

## Test Files Created

```
backend/e2e-tests/
├── setup.ts                    # Test utilities and configuration
├── test-1-pool-funding.ts      # Admin funds insurance pool
├── test-2-policy-purchase.ts   # User buys insurance policy  
├── test-3-threshold-breach.ts  # Oracle detects flood threshold
├── test-4-manual-threshold.ts  # Admin adjusts thresholds
├── test-5-claim-payout.ts      # User claims insurance payout
├── run-all-tests.ts            # Main test orchestrator
├── package.json                # Dependencies and scripts
├── tsconfig.json               # TypeScript configuration
├── run-tests.ps1               # PowerShell quick start script
└── README.md                   # Complete documentation
```

## What Gets Tested

### 1. Admin Pool Funding ✓
- Admin wallet has sufficient HBAR balance
- Admin can deposit funds into pool contract
- Pool balance increases correctly on-chain
- Backend services can query pool status

### 2. User Policy Purchase ✓
- Test user wallet is created and funded
- User can purchase insurance policy via API
- Premium (10% of coverage) is calculated and paid
- Policy is created on-chain with correct parameters
- Policy is synced to backend database
- User becomes the policyholder

### 3. Oracle Threshold Breach Detection ✓
- Oracle service fetches real flood level data
- Configured thresholds are retrieved
- System detects when flood level exceeds critical threshold
- Flood history is available
- Policies are identified as eligible for payout
- Oracle monitoring job is continuously running

### 4. Manual Threshold Adjustment ✓
- Admin can retrieve current thresholds
- Admin can update thresholds via API
- Lowering threshold below current level triggers breach
- System responds to manually adjusted thresholds
- Original thresholds can be restored

### 5. User Claim Payout ✓
- User can submit claim for their policy
- Claim is auto-approved when threshold is breached
- Payout amount matches coverage amount
- Policy is marked as claimed in database
- Claims pool balance is decreased
- Total claims processed is increased
- On-chain policy state is updated

## Running the Tests

### Quick Start
```bash
cd backend/e2e-tests
./run-tests.ps1
```

### Manual Setup
```bash
cd backend/e2e-tests
npm install
npm test
```

### Individual Tests
```bash
npm run test:pool         # Test pool funding
npm run test:policy       # Test policy purchase
npm run test:oracle       # Test oracle monitoring
npm run test:threshold    # Test threshold adjustment
npm run test:claim        # Test claim payout
```

## Prerequisites

1. **Backend services running** via `docker-compose up -d`
2. **Contracts deployed** to Hedera testnet
3. **Environment variables** set in `backend/.env`:
   - `RPC_URL` - Hedera testnet RPC endpoint
   - `POOL_ADDRESS` - Deployed pool contract address
   - `POLICY_FACTORY_ADDRESS` - Deployed factory contract address
   - `PRIVATE_KEY` - Admin wallet private key
4. **Admin wallet funded** with at least 10 HBAR

## Test Flow

```
┌─────────────────────────────────────────────────────────┐
│ 1. Admin Funds Pool                                     │
│    Admin deposits 5 HBAR → Insurance Pool Contract      │
└──────────────────┬──────────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────────┐
│ 2. User Buys Policy                                      │
│    User pays 1 HBAR premium → Gets 10 HBAR coverage     │
└──────────────────┬──────────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────────┐
│ 3. Oracle Monitors Flood Level                          │
│    Fetches USGS data → Compares to thresholds           │
└──────────────────┬──────────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────────┐
│ 4. Admin Adjusts Threshold (Optional)                   │
│    Lowers threshold → Triggers breach detection          │
└──────────────────┬──────────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────────┐
│ 5. User Claims Payout                                    │
│    Submits claim → Gets 10 HBAR payout                  │
└─────────────────────────────────────────────────────────┘
```

## Key Features

### Comprehensive Coverage
- Tests all major backend APIs (policy, oracle, claims services)
- Verifies blockchain interactions (pool, factory, policy contracts)
- Checks database consistency
- Validates business logic (premium calculation, payout eligibility)

### Realistic Testing
- Uses actual Hedera testnet blockchain
- Fetches real flood data from USGS
- Creates real transactions with gas fees
- Tests with real user wallets

### Detailed Output
- Step-by-step progress logging
- Color-coded success/failure indicators
- Transaction hashes and confirmations
- Balance and status checks at each stage
- Comprehensive test summary

### Robust Error Handling
- Graceful handling of duplicate claims
- Service availability checks
- Transaction confirmation waits
- Fallback mechanisms for API failures

## Sample Output

```
╔═══════════════════════════════════════════════════════╗
║        PARAM INSURANCE E2E TEST SUITE                ║
╚═══════════════════════════════════════════════════════╝

✓ Environment configured
✓ All services ready

═══════════════════════════════════════════════════════
TEST 1: Admin Pool Funding
═══════════════════════════════════════════════════════
Step 1: Checking admin wallet balance...
Admin balance: 45.23 HBAR
✓ Admin has sufficient balance

Step 2: Checking initial pool balance...
Initial pool balance: 10.0 HBAR

Step 3: Admin depositing 5 HBAR into pool via API...
✓ Deposit transaction sent: 0x1234...
✓ Deposited: 5 HBAR

Step 4: Verifying pool balance after deposit...
Previous balance: 10.0 HBAR
Current balance:  15.0 HBAR
Expected balance: 15.0 HBAR
✓ Pool balance increased correctly

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
Duration:     42.15s

╔═══════════════════════════════════════════════════════╗
║            ✓ ALL TESTS PASSED!                       ║
║  The Param insurance system is working correctly!    ║
╚═══════════════════════════════════════════════════════╝
```

## Benefits

### For Development
- Verify complete system integration
- Catch bugs across service boundaries
- Test real blockchain interactions
- Ensure API contracts are met

### For Deployment
- Validate production readiness
- Smoke test after deployment
- Verify contract configurations
- Check service connectivity

### For Maintenance
- Regression testing after changes
- Verify bug fixes
- Test new features
- Documentation through tests

## Troubleshooting

### Services Not Running
```bash
cd backend
docker-compose up -d
docker-compose ps  # Verify all services are "Up"
```

### Admin Needs HBAR
Visit https://faucet.hedera.com/ and paste your admin address from `.env`

### Contracts Not Deployed
```bash
cd contracts
npx hardhat run scripts/deploy.js --network hederaTestnet
# Copy addresses to backend/.env
```

### Test Timeout
Increase wait times in tests or check network connectivity

## Integration

### CI/CD Pipeline
```yaml
test-e2e:
  steps:
    - name: Start Services
      run: docker-compose up -d
    - name: Run E2E Tests
      run: |
        cd backend/e2e-tests
        npm install
        npm test
```

### Pre-Deployment Check
```bash
# Before deploying to production
npm run test
```

### Monitoring
Run tests periodically to verify system health

## Future Enhancements

- [ ] Add performance benchmarks
- [ ] Test concurrent policy purchases
- [ ] Test pool fund depletion scenarios
- [ ] Add negative test cases (invalid inputs)
- [ ] Test edge cases (zero coverage, max coverage)
- [ ] Add load testing scenarios
- [ ] Test service failure recovery
- [ ] Add test data cleanup utilities

## Documentation

Full documentation available in:
- `backend/e2e-tests/README.md` - Complete testing guide
- Individual test files - Inline comments and documentation
- `setup.ts` - API and utility documentation

## Success Criteria

All tests must pass for the system to be considered production-ready:

✓ Admin can fund the insurance pool  
✓ Users can purchase insurance policies  
✓ Oracle monitors flood levels continuously  
✓ Thresholds can be adjusted manually  
✓ Users can claim payouts when eligible  
✓ All on-chain and off-chain data stays in sync  
✓ Backend APIs respond correctly  
✓ Smart contracts execute as expected  

## Conclusion

The E2E test suite provides comprehensive coverage of the Param insurance system's core functionality. It tests the complete workflow from initial setup through user interactions to final payouts, ensuring the system works correctly end-to-end.

The tests are designed to be:
- **Comprehensive** - Cover all major features
- **Realistic** - Use real blockchain and data sources
- **Maintainable** - Clear structure and documentation
- **Repeatable** - Can be run multiple times
- **Informative** - Detailed output and error messages

Run these tests regularly to ensure system reliability and catch issues early.
