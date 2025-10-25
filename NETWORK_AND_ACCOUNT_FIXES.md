# Network Configuration & Account Logic Fixes

## 🚨 Critical Issues Identified

### 1. Network Configuration Contradictions

**Problem:**
You're seeing Polygon network warnings because:
- Your `.env` file contains **Hardhat localhost** contract addresses
- These addresses (`0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9`) only exist on local Hardhat, NOT on Polygon or Hedera
- MetaMask detects you're trying to send a transaction to a non-existent address on Polygon

**Root Cause:**
The contracts have NOT been deployed to Hedera Testnet yet. You need to:

1. Deploy contracts to Hedera Testnet
2. Update `.env` with the new Hedera addresses
3. Ensure MetaMask is connected to Hedera Testnet (Chain ID 296)

---

## ✅ Solution Steps

### Step 1: Deploy Contracts to Hedera Testnet

```powershell
cd c:\Users\danie\Param\contracts

# Make sure you have your private key in .env
# Add to contracts/.env:
# PRIVATE_KEY=your_private_key_here

# Deploy to Hedera Testnet
npx hardhat run scripts/deploy.js --network hederaTestnet
```

**Expected Output:**
```
Deploying contracts with the account: 0x...
GovernanceContract deployed to: 0xABC...
InsurancePool deployed to: 0xDEF...
OracleRegistry deployed to: 0xGHI...
PolicyFactory deployed to: 0xJKL...
Deployment complete!
```

### Step 2: Update Frontend `.env` File

After deployment, update `c:\Users\danie\Param\frontend\.env`:

```properties
VITE_BACKEND_URL=http://localhost:3000

# Replace these with YOUR Hedera deployment addresses:
VITE_POLICY_FACTORY_ADDRESS=0x... # From deployment output
VITE_ORACLE_REGISTRY_ADDRESS=0x... # From deployment output
VITE_POOL_ADDRESS=0x... # From deployment output
VITE_GOVERNANCE_ADDRESS=0x... # From deployment output
```

### Step 3: Connect MetaMask to Hedera Testnet

In MetaMask:
1. Click network dropdown
2. Add network manually:
   - **Network Name**: Hedera Testnet
   - **RPC URL**: https://testnet.hashio.io/api
   - **Chain ID**: 296
   - **Currency Symbol**: HBAR
   - **Block Explorer**: https://hashscan.io/testnet

3. Get test HBAR: https://portal.hedera.com/

### Step 4: Restart Frontend Dev Server

```powershell
cd c:\Users\danie\Param\frontend
npm run dev
```

---

## 🔧 Account Logic Analysis

### Current Implementation (Phase 1)

**Status:** ✅ **Working as Designed**

According to `Phases.md`, Phase 1 is intentionally simple:
- Single wallet can do everything (buy insurance, view dashboard, etc.)
- No role separation yet
- Focus is on core smart contract functionality

### Future Implementation (Phase 4+)

**From `Phases.md` - Phase 4:**
```
* GovernanceContract.sol → manages roles, parameters, and contract pause/unpause
* claims-service → Auto-trigger payouts when thresholds breached
* Manual admin review endpoint for claims
```

**Recommended Account Separation:**

| Account Type | Purpose | Phase |
|-------------|---------|-------|
| **User Accounts** | Buy insurance policies | Phase 1 ✅ |
| **Oracle Account** | Update flood data on-chain | Phase 2 |
| **Admin Account** | Governance, parameter updates | Phase 4 |
| **Claims Reviewer** | Manual claim approvals | Phase 4 |
| **Pool Manager** | Liquidity management | Phase 4 |

### For Phase 1 (Current)
**No changes needed.** The current setup where one account handles everything is correct for the MVP.

### For Phase 4 (Future Planning)

1. **Create Separate Accounts:**
   ```
   Account 1: Admin (deployer) - 0x123...
   Account 2: Oracle Updater - 0x456...
   Account 3-N: Regular Users - 0x789...
   ```

2. **Update GovernanceContract:**
   ```solidity
   // Add role-based access control
   bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
   bytes32 public constant ORACLE_ROLE = keccak256("ORACLE_ROLE");
   
   // Only admin can pause contracts
   function pauseContract() external onlyRole(ADMIN_ROLE) { ... }
   
   // Only oracle can update flood data
   function updateFloodLevel() external onlyRole(ORACLE_ROLE) { ... }
   ```

3. **Backend Service Accounts:**
   - `oracle-service`: Has ORACLE_ROLE, updates on-chain data
   - `claims-service`: Has CLAIMS_ROLE, triggers payouts
   - Users: Can only buy insurance and file claims

---

## 🎯 Immediate Action Items

### Must Do Now:
- [ ] Deploy contracts to Hedera Testnet
- [ ] Update frontend `.env` with Hedera addresses
- [ ] Ensure MetaMask is on Hedera Testnet (Chain ID 296)
- [ ] Test buying insurance on Hedera

### Optional Configuration Cleanup:

Remove Polygon Amoy from `wagmi.ts` since you're not using it:

```typescript
// frontend/src/wagmi.ts
export const config = createConfig({
  chains: [hederaTestnet, hardhat], // Remove polygonAmoy
  connectors: [metaMask()],
  transports: {
    [hardhat.id]: http('http://127.0.0.1:8545'),
    [hederaTestnet.id]: http('https://testnet.hashio.io/api'),
    // Remove polygonAmoy transport
  },
})
```

### Save for Later (Phase 4):
- [ ] Implement role-based access control in GovernanceContract
- [ ] Create separate accounts for different roles
- [ ] Update backend services to use service accounts
- [ ] Add admin portal for governance actions

---

## 📋 Summary

**Network Issue:** ✅ Fixed (removed Polygon references from UI)
**Core Problem:** ⚠️ Contracts need to be deployed to Hedera Testnet
**Account Logic:** ✅ Current implementation is correct for Phase 1

**Next Step:** Deploy contracts to Hedera and update your `.env` file with the new addresses.
