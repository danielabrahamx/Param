# Transaction Failure Analysis & Fix

## Issues Found

### 1. ✅ FIXED: TypeScript Errors
- **Problem**: `governanceAddress` was undefined in Dashboard.tsx
- **Fix**: Changed to use `NORMALIZED_ADDRESSES.GOVERNANCE`
- **Problem**: `contractThreshold` type was `unknown`
- **Fix**: Added explicit type casting to `bigint`
- **Problem**: Unused import `getAddress` in wagmi.ts
- **Fix**: Removed unused import

### 2. Current State Analysis

#### Smart Contracts (Deployed on Hedera Testnet)
- ✅ GovernanceContract: `0x8Aa1810947707735fd75aD20F57117d05256D229`
- ✅ InsurancePool: `0xA64B631F05E12f6010D5010bC28E0F18C5895b26`
- ✅ OracleRegistry: `0x010AD086bbfb482cd9c48F71221e702d924bCE70`
- ✅ PolicyFactory: `0x89321F04D5D339c6Ad5f621470f922a39042c7F5`

#### Frontend Configuration
- ✅ Environment variables correctly set in `frontend/.env`
- ✅ Wagmi config properly configured for Hedera Testnet (Chain ID: 296)
- ✅ Contract addresses loaded via `NORMALIZED_ADDRESSES`
- ✅ Error handling in place for transactions

#### Backend Services
- ✅ All services running (verified with docker compose ps)
- ✅ API Gateway on port 3000
- ✅ Policy Service on port 3001
- ✅ Claims Service on port 3003

### 3. Transaction Flow Analysis

#### Buying Insurance (createPolicy)
```typescript
// Frontend (BuyInsurance.tsx)
writeContract({
  address: policyFactoryAddress,  // From NORMALIZED_ADDRESSES.POLICY_FACTORY
  abi: policyFactoryAbi,
  functionName: 'createPolicy',
  args: [coverageWei],  // BigInt coverage in wei
  chainId: hederaTestnet.id,  // 296
})
```

**Smart Contract (PolicyFactory.sol)**:
```solidity
function createPolicy(uint256 _coverage) external returns (address) {
    uint256 premium = (_coverage * governance.premiumRate()) / 100;
    IndividualPolicy policy = new IndividualPolicy(...);
    emit PolicyCreated(address(policy), _coverage, premium, msg.sender);
    return address(policy);
}
```

**Key Points**:
- ✅ Function is NOT payable (no ETH/HBAR payment required)
- ✅ Premium calculated internally (10% of coverage)
- ✅ Creates new IndividualPolicy contract
- ✅ Emits PolicyCreated event

#### Claim Payout (triggerPayout)
```typescript
// Frontend (Dashboard.tsx)
writeContract({
  address: policy.policyAddress,  // Individual policy contract address
  abi: policyAbi,
  functionName: 'triggerPayout',
})
```

**Smart Contract (IndividualPolicy.sol)**:
```solidity
function triggerPayout() external {
    require(!payoutTriggered, "Payout already triggered");
    require(!governance.paused(), "Contract is paused");
    // Flood level check is currently disabled
    payoutTriggered = true;
}
```

### 4. Potential Root Causes

#### Most Likely Issues:

1. **User Not Connected to Hedera Testnet**
   - Solution: Force network switch in UI (already implemented)
   - User needs to add Hedera Testnet to MetaMask

2. **Insufficient HBAR for Gas**
   - User needs test HBAR from: https://portal.hedera.com/
   - Gas fees on Hedera are minimal but still required

3. **MetaMask Not Connected**
   - Solution: Redirect to /connect page (already implemented)

4. **Contract Interaction Timing**
   - The frontend immediately redirects on success
   - Backend sync might not have time to complete

#### Less Likely Issues:

5. **Environment Variables Not Loading**
   - Check: Vite requires `VITE_` prefix (✅ correct)
   - Check: .env in correct location (✅ correct)
   
6. **ABI Mismatch**
   - Current ABI is minimal (only createPolicy function)
   - Should work if contract is deployed correctly

### 5. Diagnostic Steps for User

**Step 1: Verify MetaMask Setup**
```
- Check network: Should be "Hedera Testnet" (296)
- Check balance: Should have > 0 HBAR
- Check connection: Wallet should be connected
```

**Step 2: Check Browser Console**
```
- Open DevTools (F12)
- Check Console for errors
- Check Network tab for failed RPC calls
```

**Step 3: Verify Contract Deployment**
```
Visit: https://hashscan.io/testnet/contract/0x89321F04D5D339c6Ad5f621470f922a39042c7F5
Should show deployed PolicyFactory contract
```

### 6. Quick Fixes Applied

#### Fix 1: TypeScript Errors (COMPLETED)
- Fixed `governanceAddress` undefined error
- Fixed `contractThreshold` type errors
- Removed unused imports

#### Fix 2: Error Display (ALREADY IMPLEMENTED)
- Error messages shown in UI
- Transaction hash displayed on success
- Loading states properly managed

### 7. Testing Checklist

- [ ] Frontend compiles without TypeScript errors ✅
- [ ] Backend services running ✅
- [ ] Dev server running ✅
- [ ] Can connect MetaMask wallet
- [ ] Can switch to Hedera Testnet
- [ ] Can buy insurance (createPolicy)
- [ ] Policy appears in dashboard
- [ ] Can trigger claim payout
- [ ] Claim appears in claims list

### 8. Next Steps

**For User Testing:**
1. Open http://localhost:5173
2. Click "Connect Wallet"
3. Approve MetaMask connection
4. Switch to Hedera Testnet if prompted
5. Go to "Buy Insurance"
6. Enter coverage amount (e.g., 10 HBAR)
7. Click "Buy Insurance"
8. Approve transaction in MetaMask
9. Wait for confirmation
10. Check Dashboard for new policy

**If Transaction Fails:**
- Check MetaMask console for specific error
- Verify HBAR balance > 0
- Verify on correct network (Hedera Testnet, ChainID 296)
- Check contract address is correct
- Verify contract is deployed on HashScan

## Summary

✅ **TypeScript errors fixed** - Code now compiles without errors
✅ **Configuration verified** - All addresses and settings correct  
✅ **Backend running** - All services operational
✅ **Frontend running** - Dev server active on port 5173

**Most likely user issues:**
1. Not connected to Hedera Testnet
2. No test HBAR for gas fees
3. MetaMask not connected/approved

**Code is ready for testing!**
