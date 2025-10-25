# MetaMask Claims Implementation

## ✅ Complete Implementation

The claims system now triggers **actual MetaMask transactions** that execute blockchain payouts.

## How It Works

### Flow Overview

```
User Clicks "Claim Payout" Button
    ↓
Frontend calls writeContract() with MetaMask
    ↓
MetaMask popup appears for user to sign
    ↓
User signs transaction
    ↓
Transaction sent to Hedera blockchain
    ↓
Smart contract executes triggerPayout()
    ↓
InsurancePool.payOut() sends HBAR to policyholder
    ↓
Transaction confirmed on blockchain
    ↓
Frontend records claim in backend database
    ↓
UI updates to show "Claim Already Processed"
```

### Frontend Implementation

**File**: `frontend/src/pages/Dashboard.tsx`

**Key Changes**:

1. **Added Wagmi Hooks**:
   ```typescript
   const { writeContract, data: claimTxHash, error: claimError, isPending: isClaimPending } = useWriteContract()
   const { isLoading: isClaimConfirming, isSuccess: isClaimSuccess } = useWaitForTransactionReceipt({ 
     hash: claimTxHash 
   })
   ```

2. **Contract ABI for triggerPayout**:
   ```typescript
   const policyAbi = [
     {
       inputs: [],
       name: 'triggerPayout',
       outputs: [],
       stateMutability: 'nonpayable',
       type: 'function',
     },
   ]
   ```

3. **Blockchain Transaction Handler**:
   ```typescript
   const handleClaimPayout = async (policy: Policy) => {
     // Call triggerPayout() on the IndividualPolicy contract
     writeContract({
       address: policy.policyAddress as `0x${string}`,
       abi: policyAbi,
       functionName: 'triggerPayout',
     })
   }
   ```

4. **Transaction Success Handler**:
   - Waits for blockchain confirmation
   - Records claim in backend database
   - Updates UI with transaction hash
   - Refreshes policy status

### Smart Contract Flow

**IndividualPolicy.sol**:
```solidity
function triggerPayout() external {
    require(!payoutTriggered, "Payout already triggered");
    require(!governance.paused(), "Contract is paused");
    uint256 floodLevel = oracle.getLatestFloodLevel(REGION_ID);
    require(floodLevel > governance.floodThreshold(), "Flood level not high enough for payout");

    payoutTriggered = true;
    pool.payOut(policyholder, premium);
}
```

**InsurancePool.sol**:
```solidity
function payOut(address policyholder, uint256 amount) external whenNotPaused {
    require(totalReserves >= amount * RESERVE_RATIO / 100, "Insufficient reserves for payout");
    require(address(this).balance >= amount, "Insufficient balance");
    totalReserves -= amount;
    payable(policyholder).transfer(amount);
    emit Payout(msg.sender, policyholder, amount);
}
```

## User Experience

### Before Claiming
1. User sees "💰 Claim Payout Now (via MetaMask)" button
2. Button is enabled only when flood level exceeds warning threshold
3. Button shows if policy hasn't been claimed yet

### During Transaction
1. User clicks button
2. **MetaMask popup appears** asking user to sign transaction
3. Button shows "Processing..." with spinner
4. After user signs, shows "Confirming Transaction..." while waiting for blockchain

### After Success
1. Alert shows:
   - ✅ Success message
   - Transaction hash
   - Claim ID from database
   - Confirmation that payout was sent to wallet
2. Button changes to "✅ Claim Already Processed" (disabled)
3. Policy card shows "✓ Payout Sent" badge
4. Link to view transaction on HashScan appears

### Error Handling
- User rejects transaction: Shows rejection message
- Transaction fails: Shows error from smart contract
- Backend database error: Transaction still completes on-chain, user gets warning

## Testing Instructions

### Prerequisites
- MetaMask installed and connected
- Wallet connected to Hedera Testnet
- At least one active policy
- Flood level above warning threshold (1000mm by default)

### Test Steps

1. **Navigate to Dashboard**
   ```
   Open app and connect wallet
   Go to Dashboard page
   ```

2. **Verify Policy Status**
   ```
   - Policy should show "Active" status
   - Flood level should be above warning threshold
   - "Claim Payout" button should be enabled
   ```

3. **Initiate Claim**
   ```
   - Click "Claim Payout Now (via MetaMask)" button
   - MetaMask popup should appear
   ```

4. **Sign Transaction**
   ```
   - Review transaction details in MetaMask
   - Click "Confirm" to sign
   - Button should show "Processing..."
   ```

5. **Wait for Confirmation**
   ```
   - Button shows "Confirming Transaction..."
   - Wait 3-5 seconds for Hedera confirmation
   ```

6. **Verify Success**
   ```
   - Alert appears with success message and TX hash
   - Policy status changes to "Payout Sent"
   - Transaction link appears
   - HBAR should be received in wallet
   ```

7. **Verify Duplicate Prevention**
   ```
   - Try to claim same policy again
   - Button should be disabled
   - Shows "Claim Already Processed"
   ```

### Verification Commands

**Check wallet balance** (should increase by coverage amount):
```bash
# In Hedera wallet or HashScan
```

**Verify transaction on HashScan**:
```
https://hashscan.io/testnet/transaction/{txHash}
```

**Check backend database**:
```bash
curl http://localhost:3003/api/v1/claims
# Should show new claim with status "approved"

curl http://localhost:3001/api/v1/policies
# Policy should have payoutTriggered: true
```

## Key Features

### ✅ Real Blockchain Transactions
- Actual HBAR transfers via smart contract
- User signs with MetaMask (not server-side)
- Transparent on-chain verification

### ✅ Duplicate Prevention
- Smart contract checks `payoutTriggered` flag
- Backend validates before recording
- Frontend disables button after claim

### ✅ Transaction Tracking
- Transaction hash displayed to user
- Link to view on HashScan explorer
- Database records for analytics

### ✅ Error Handling
- MetaMask rejection handled gracefully
- Smart contract errors shown to user
- Network issues caught and reported

## Differences from Previous Implementation

### Before (Mock Implementation)
- ❌ Only updated database
- ❌ No actual HBAR transfer
- ❌ No user transaction signing
- ❌ Pool balance only tracked in DB

### After (Real Blockchain)
- ✅ Triggers MetaMask transaction
- ✅ Actual HBAR sent to user wallet
- ✅ User signs transaction
- ✅ On-chain pool balance updated
- ✅ Transaction verifiable on HashScan

## Important Notes

### Contract Requirements
- `InsurancePool` must have sufficient HBAR balance
- Pool reserves must meet 150% reserve ratio
- Oracle must report flood level above threshold
- Contract must not be paused

### Gas Fees
- User pays transaction fee in HBAR
- Typical cost: 0.001-0.01 HBAR
- Displayed in MetaMask before signing

### Transaction Time
- Submission: Instant (MetaMask popup)
- Confirmation: 3-5 seconds on Hedera
- Total time: ~10 seconds

### Security
- Private keys never exposed to frontend
- User explicitly signs each transaction
- Smart contract validates all conditions
- On-chain verification of all payouts

## Troubleshooting

### MetaMask Doesn't Appear
- Check if MetaMask is installed
- Verify wallet is connected
- Check browser console for errors

### Transaction Fails
- Verify flood level is above threshold
- Check pool has sufficient balance
- Ensure policy hasn't been claimed
- Check contract isn't paused

### Claim Records But No HBAR Received
- Check transaction on HashScan
- Verify wallet address matches policy holder
- Check if transaction was actually confirmed
- Look for error events in transaction logs

## Next Steps

### Recommended Enhancements
1. Add transaction pending state in UI
2. Show estimated gas fee before signing
3. Add retry mechanism for failed transactions
4. Implement transaction queue for multiple claims
5. Add email/SMS notification after payout

### Production Considerations
1. Ensure pool is funded with sufficient HBAR
2. Monitor pool balance alerts
3. Set up transaction failure monitoring
4. Implement rate limiting on claims
5. Add multi-sig for pool funding operations
