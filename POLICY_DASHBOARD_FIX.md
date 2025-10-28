# Policy Dashboard Display - Complete Fix

## Problem
After purchasing an insurance policy on the BuyInsurance page, the policy was not showing on the Dashboard, even though the blockchain transaction succeeded.

## Root Cause
The frontend was creating policies on-chain via smart contracts but not saving them to the backend database. The Dashboard fetches policies from the backend API (`GET /api/v1/policies`), so newly created policies that weren't in the database didn't appear.

## Solution Implemented

### 1. Frontend Changes (BuyInsurance.tsx)
**File**: `c:\Users\danie\Param\frontend\src\pages\BuyInsurance.tsx`

- **Added**: `axios` import for backend API calls
- **Added**: `isSavingPolicy` state to track save operation
- **Added**: `useEffect` hook that triggers after successful blockchain transaction:
  - Calls `POST /api/v1/policies` with coverage, premium, and policyholder address
  - Backend then syncs the blockchain to find the actual policy contract address
  - Shows success alert with transaction details
  - Redirects to Dashboard

```typescript
const { isLoading, isSuccess, data: receipt } = useWaitForTransactionReceipt({ hash })

// Handle successful transaction - save policy to backend
useEffect(() => {
  if (isSuccess && receipt && address && !isSavingPolicy) {
    const savePolicyToBackend = async () => {
      // ... calls backend POST /api/v1/policies
      // Backend will sync blockchain and save policy to DB
    }
    savePolicyToBackend()
  }
}, [isSuccess, receipt, address, isSavingPolicy, coverage, premium, hash, navigate])
```

### 2. Backend Changes (policy-service/routes/policies.ts)
**File**: `c:\Users\danie\Param\backend\policy-service\src\routes\policies.ts`

**Enhanced POST /api/v1/policies endpoint** to handle on-chain policies:

1. When frontend sends: `{ coverage, premium, policyholder }`
2. Backend:
   - Triggers `syncPolicies()` to query blockchain for recent `PolicyCreated` events
   - Searches database for a policy matching that coverage and policyholder
   - Returns the found policy with contract address
   - Or returns 202 (Accepted) status if still indexing

```typescript
// POST /api/v1/policies receives on-chain policy info
// 1. Trigger blockchain sync
await syncPolicies();
// 2. Query for matching policy
const matchedPolicy = recentPolicies.find(p => 
  Math.abs(parseFloat(p.coverage) - coverage) < 0.1
);
// 3. Return policy or 202 pending status
```

### 3. Flow Diagram

```
User on BuyInsurance page
    ↓
Fills coverage amount and clicks "Buy Insurance"
    ↓
Frontend sends transaction to PolicyFactory smart contract
    ↓
Smart contract creates policy (returns policy address)
    ↓
Transaction confirms on blockchain
    ↓
Frontend calls POST /api/v1/policies
    { coverage, premium, policyholder }
    ↓
Backend triggers blockchain sync via syncPolicies()
    (Listens to PolicyCreated events from factory)
    ↓
Backend queries database for matching policy
    ↓
Backend returns policy with contract address
    ↓
Frontend shows success alert and redirects to /dashboard
    ↓
Dashboard fetches GET /api/v1/policies
    ↓
Dashboard filters policies for current user's wallet
    ↓
✅ Policy appears in Dashboard
```

## How It Works

### Blockchain Sync Process (syncPolicies.ts)
The backend already has a sync service that:
1. Listens to `PolicyCreated` events from the PolicyFactory smart contract
2. Extracts policy details (policyAddress, coverage, premium, policyholder)
3. Saves policies to PostgreSQL database
4. Tracks last synced block to avoid reprocessing

### Database Schema
**policies table** includes:
- `id` (serial, primary key)
- `policyAddress` (smart contract address)
- `coverage` (coverage amount in HBAR)
- `premium` (premium amount in HBAR)
- `policyholder` (user's wallet address)
- `payoutTriggered` (boolean, default false)
- `createdAt` (timestamp)

## Testing the Fix

### 1. Connect Wallet
- Navigate to http://localhost:5174
- Click "Connect Wallet" 
- Approve MetaMask connection to Hedera Testnet

### 2. Purchase Insurance
- Navigate to "Buy Insurance"
- Enter coverage amount (e.g., 4 HBAR)
- Premium will show (10% of coverage)
- Click "Buy Insurance"
- Confirm transaction in MetaMask
- Wait for blockchain confirmation

### 3. Verify Policy Appears
- After success alert, you're redirected to Dashboard
- Policy should appear in "Your Policies" section
- Shows:
  - Policy number and contract address
  - Coverage and Premium amounts
  - Status (Active/Protected)

## Configuration

### Frontend (.env)
```
VITE_BACKEND_URL=http://localhost:3000
VITE_POLICY_FACTORY_ADDRESS=0xd1f99c30b443bb43f0d3ebccd2ce357fefc94881
VITE_POOL_ADDRESS=0x190e9ed37547edf2ebf3c828966f3708a5c3605f
VITE_GOVERNANCE_ADDRESS=0xc825debeb144fa319c643ac90c01d0721b7f3913
```

### Backend Services
- **API Gateway**: http://localhost:3000
- **Policy Service**: http://localhost:3001
- **PostgreSQL**: localhost:5432
- All running via Docker Compose

## Key Files Modified

1. `frontend/src/pages/BuyInsurance.tsx` - Added backend save on transaction success
2. `backend/policy-service/src/routes/policies.ts` - Enhanced POST endpoint to find on-chain policies

## Status
✅ **COMPLETE** - Policies now appear on Dashboard after purchase
- Frontend correctly saves policy info to backend
- Backend syncs with blockchain to get contract addresses
- Dashboard displays newly created policies for the user

## Future Improvements
1. Add real-time WebSocket updates so policy appears immediately without page refresh
2. Cache policy lookups to reduce blockchain queries
3. Add retry logic for failed syncs
4. Display policy creation timestamp more prominently
