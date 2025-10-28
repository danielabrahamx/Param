# E2E Tests Quick Reference

## Quick Start

```bash
cd backend/e2e-tests
npm install
npm test
```

## What Gets Tested

| Test | Feature | Verifies |
|------|---------|----------|
| 1 | Pool Funding | Admin deposits HBAR into insurance pool |
| 2 | Policy Purchase | User buys policy with premium payment |
| 3 | Threshold Breach | Oracle detects flood level exceeds threshold |
| 4 | Manual Threshold | Admin adjusts thresholds to trigger payouts |
| 5 | Claim Payout | User successfully claims insurance payout |

## Prerequisites Checklist

- [ ] Backend services running (`docker-compose up -d`)
- [ ] Contracts deployed to Hedera testnet
- [ ] `.env` file configured with contract addresses
- [ ] Admin wallet has ≥10 HBAR

## Run Individual Tests

```bash
npm run test:pool         # Test 1: Pool funding
npm run test:policy       # Test 2: Policy purchase
npm run test:oracle       # Test 3: Oracle monitoring
npm run test:threshold    # Test 4: Threshold adjustment
npm run test:claim        # Test 5: Claim payout
```

## Expected Duration

- Full test suite: ~30-60 seconds
- Individual tests: ~5-15 seconds each

## Success Output

```
✓ Test 1: Pool Funding - PASSED
✓ Test 2: Policy Purchase - PASSED
✓ Test 3: Threshold Breach - PASSED
✓ Test 4: Manual Threshold - PASSED
✓ Test 5: Claim Payout - PASSED

Total Tests:  5
Passed:       5
Failed:       0
```

## Common Issues

| Error | Solution |
|-------|----------|
| Service not available | `docker-compose up -d` |
| Admin needs HBAR | Visit https://faucet.hedera.com/ |
| Contract not deployed | Run deploy script first |
| Missing .env | Copy contract addresses to backend/.env |

## Test Flow

```
Admin Funds Pool (5 HBAR)
    ↓
User Buys Policy (1 HBAR premium, 10 HBAR coverage)
    ↓
Oracle Monitors Flood Level
    ↓
Admin Adjusts Threshold (triggers breach)
    ↓
User Claims Payout (receives 10 HBAR)
```

## Files

- `setup.ts` - Test utilities
- `test-1-pool-funding.ts` - Pool funding test
- `test-2-policy-purchase.ts` - Policy purchase test
- `test-3-threshold-breach.ts` - Oracle monitoring test
- `test-4-manual-threshold.ts` - Threshold adjustment test
- `test-5-claim-payout.ts` - Claim payout test
- `run-all-tests.ts` - Main test runner
- `README.md` - Full documentation

## Environment Variables Required

```env
RPC_URL=https://testnet.hashio.io/api
POOL_ADDRESS=0x...
POLICY_FACTORY_ADDRESS=0x...
PRIVATE_KEY=0x...
```

## Quick Troubleshooting

```bash
# Check services
docker-compose ps

# View service logs
docker-compose logs -f

# Restart services
docker-compose restart

# Check admin balance
# (Address shown in test output)

# Verify contracts deployed
# (Addresses in .env should not be empty)
```

## Test Coverage

✓ Admin pool operations  
✓ User policy operations  
✓ Oracle flood monitoring  
✓ Threshold management  
✓ Claims processing  
✓ Blockchain integration  
✓ Database synchronization  
✓ API functionality  

## Documentation

- **Full guide**: `backend/e2e-tests/README.md`
- **Summary**: `E2E_TEST_SUMMARY.md`
- **This file**: Quick reference for common tasks
