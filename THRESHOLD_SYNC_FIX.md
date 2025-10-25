# ✅ Frontend-Backend Threshold Synchronization

## Problem Solved

The frontend now **automatically fetches the flood threshold from the smart contract** instead of using hardcoded values. This ensures the UI and blockchain are always in sync.

## How It Works

### 1. Frontend Reads Contract Threshold
```typescript
// Uses wagmi's useReadContract hook
const { data: contractThreshold } = useReadContract({
  address: governanceAddress,
  abi: governanceAbi,
  functionName: 'floodThreshold',
})

// Determines if claims are enabled
const isRisky = floodLevel && effectiveThreshold ? floodLevel > effectiveThreshold : false
```

### 2. UI Displays Contract Threshold
- **Flood Level Monitor**: Shows "Smart Contract Threshold" with current value
- **Blue Info Box**: Displays contract threshold and eligibility status
- **Claim Button Tooltip**: Shows threshold requirement

### 3. Claim Button Logic
- **Enabled**: Only when `floodLevel > contractThreshold` (blockchain rule)
- **Disabled**: When below threshold, tooltip shows contract requirement

## Changes Made

### `frontend/src/pages/Dashboard.tsx`
1. **Added `useReadContract` hook** to fetch threshold from governance contract
2. **Read threshold on page load** - no manual script needed
3. **Display contract threshold** in monitoring section
4. **Added info box** showing contract threshold and claim eligibility
5. **Updated button logic** to use `effectiveThreshold` from contract
6. **Updated tooltips** to show contract threshold value

## User Experience

### Before
❌ Frontend threshold (1000) ≠ Contract threshold (3000)  
❌ Button enabled but transaction fails  
❌ Confusing error messages  
❌ Manual script needed to sync

### After  
✅ Frontend reads from contract automatically  
✅ Button only enabled when contract allows  
✅ Clear threshold display in UI  
✅ No manual synchronization needed

## UI Elements

### Monitoring Section
```
Smart Contract Threshold: 3000 feet x 100
```

### Info Box (Blue)
```
⛓️ Smart Contract Threshold
Claims can only be processed when flood level exceeds 3000 feet x 100.
Current level: 269
```

### When Eligible
```
✓ Currently eligible for claims!
```

## Testing

1. **Check threshold is loaded**:
   - Open Dashboard
   - Look for "Smart Contract Threshold" in monitoring section
   - Should show: `3000 feet x 100` (or current contract value)

2. **Verify button logic**:
   - If flood level < 3000: Button disabled
   - If flood level > 3000: Button enabled
   - Tooltip shows threshold requirement

3. **Test claim flow**:
   - Raise flood level above contract threshold
   - Button should enable
   - Click to trigger MetaMask
   - Transaction should succeed

## Updating Threshold

To change the threshold for testing, update the smart contract:

```bash
cd contracts
# Set environment variable
$env:GOVERNANCE_ADDRESS="0x8Aa1810947707735fd75aD20F57117d05256D229"

# Run update script
npx hardhat run scripts/update-threshold.js --network hederaTestnet
```

Frontend will **automatically** reflect the new threshold (may need to refresh page).

## Architecture

```
Smart Contract (GovernanceContract.sol)
    ↓ (reads via useReadContract)
Frontend (Dashboard.tsx)
    ↓ (validates)
Claim Button State
    ↓ (triggers if valid)
MetaMask Transaction
    ↓ (executes)
Blockchain Payout
```

## Key Benefits

1. **Single Source of Truth**: Contract threshold is authoritative
2. **Automatic Sync**: No manual scripts or coordination needed
3. **Clear Communication**: Users see exact threshold requirement
4. **Prevents Errors**: Button disabled when claim would fail
5. **Real-time Updates**: Reflects contract changes immediately

## Future Enhancements

1. **Admin Panel**: Allow updating threshold via UI (requires admin role)
2. **Historical Tracking**: Show threshold change history
3. **Multi-region Support**: Different thresholds per region
4. **Predictive Alerts**: Warn when approaching threshold
5. **Governance Voting**: Community-driven threshold updates
