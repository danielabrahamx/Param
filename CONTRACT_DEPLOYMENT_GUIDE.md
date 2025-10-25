# Contract Deployment Guide

## Overview

The smart contracts need to be deployed to interact with the frontend. You have two options:

1. **Local Testing** (using Hardhat node)
2. **Testnet Deployment** (Polygon Amoy or Avalanche Fuji)

---

## Option 1: Local Deployment (RECOMMENDED FOR TESTING)

### Step 1: Start Hardhat Node
```bash
cd c:\Users\danie\Param\contracts
npx hardhat node
```

**Output:**
```
Started HTTP and WebSocket JSON-RPC server at http://127.0.0.1:8545/
```

This node runs at `http://localhost:8545` with 20 pre-funded test accounts.

### Step 2: Deploy Contracts
In a **new terminal**, run:
```bash
cd c:\Users\danie\Param\contracts
npx hardhat run scripts/deploy.js --network localhost
```

**Expected Output:**
```
Deploying contracts with the account: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
GovernanceContract deployed to: 0x5FbDB2315678afecb367f032d93F642f64180aa3
InsurancePool deployed to: 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
OracleRegistry deployed to: 0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0
PolicyFactory deployed to: 0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9
```

### Step 3: Update Frontend .env
Copy the deployed addresses and update `frontend/.env`:
```properties
VITE_BACKEND_URL=http://localhost:3000
VITE_POLICY_FACTORY_ADDRESS=<deployed address>
VITE_ORACLE_REGISTRY_ADDRESS=<deployed address>
VITE_POOL_ADDRESS=<deployed address>
VITE_GOVERNANCE_ADDRESS=<deployed address>
```

### Step 4: Connect MetaMask to Local Network
1. Open MetaMask
2. Click Network dropdown → Add Network
3. Fill in:
   - **Network Name:** Hardhat Localhost
   - **RPC URL:** http://localhost:8545
   - **Chain ID:** 31337
   - **Currency:** ETH
4. Click Save
5. Switch to the new network

### Step 5: Import Test Account
1. In MetaMask, click "Import Account"
2. Private Key: `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`
3. This account has 10,000 ETH for testing

---

## Option 2: Testnet Deployment

### Prerequisites
- MetaMask wallet with test ETH
- Access to testnet faucets

### Polygon Amoy Testnet

#### Get Test ETH
1. Visit: https://faucet.polygon.technology/
2. Select "Mumbai" or "Amoy"
3. Paste your address
4. Claim test ETH

#### Deploy
```bash
cd contracts
npx hardhat run scripts/deploy.js --network polygonAmoy
```

### Avalanche Fuji Testnet

#### Get Test AVAX
1. Visit: https://faucet.avax.network/
2. Paste your address
3. Claim test AVAX

#### Deploy
```bash
cd contracts
npx hardhat run scripts/deploy.js --network avalancheFuji
```

---

## Testing Workflow

### 1. All Services Running
```bash
# Terminal 1: Frontend
cd frontend
npm run dev
# → localhost:5177

# Terminal 2: Backend
cd backend
docker compose up -d
# → Services on 3000-3003

# Terminal 3: Contracts
cd contracts
npx hardhat node
# → localhost:8545

# Terminal 4: Deploy
cd contracts
npx hardhat run scripts/deploy.js --network localhost
```

### 2. Test in Browser
1. Go to http://localhost:5177
2. Click "Connect Wallet"
3. Select MetaMask
4. Switch to Hardhat Localhost network
5. Select the test account
6. Dashboard should load

### 3. Test Buying Insurance
1. Go to "Buy Insurance"
2. Enter coverage: `1.0`
3. Premium auto-calculates: `0.1`
4. Click "Buy Insurance"
5. Approve in MetaMask
6. Transaction should succeed

### 4. View Claims
1. Go to "Dashboard" - should show your policy
2. Go to "Claims" - view submitted claims
3. Go to "Pool" - see liquidity stats

---

## Troubleshooting

### "Cannot connect to the network localhost"
**Solution:** Make sure Hardhat node is still running in Terminal 3

### MetaMask keeps asking for network
**Solution:** Make sure you added the Hardhat network and switched to it

### Contract addresses don't match
**Solution:** Re-deploy contracts with:
```bash
npx hardhat run scripts/deploy.js --network localhost
```
Then update `.env` with the new addresses.

### Frontend shows "undefined" addresses
**Solution:** 
1. Check `frontend/.env` has all addresses filled
2. Restart the frontend dev server: `npm run dev`
3. Hard refresh browser: Ctrl+Shift+R

### Transaction fails
**Possible issues:**
- Account doesn't have ETH - use the test account with 10,000 ETH
- Contract addresses wrong - verify in .env
- Network mismatch - ensure MetaMask is on Hardhat Localhost

---

## Contract Interactions

### What Each Contract Does

1. **GovernanceContract**
   - Controls admin roles
   - Sets flood threshold (3000 units)
   - Sets premium rate (10%)

2. **PolicyFactory**
   - Creates new policies
   - Requires `POLICY_CREATOR_ROLE`
   - Emits `PolicyCreated` events

3. **IndividualPolicy**
   - Stores policy details
   - Triggers payouts when flood > 3000
   - Prevents multiple payouts

4. **OracleRegistry**
   - Stores flood level data
   - Only updatable by `ORACLE_UPDATER_ROLE`
   - Used by claims service to trigger payouts

5. **InsurancePool**
   - Manages liquidity
   - Ensures 150% reserve ratio
   - Handles payout disbursements

---

## Key Addresses (Local)

```json
{
  "accounts": [
    {
      "address": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
      "privateKey": "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
      "balance": "10000 ETH"
    }
  ],
  "contracts": {
    "governance": "0x5FbDB2315678afecb367f032d93F642f64180aa3",
    "pool": "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
    "oracle": "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0",
    "factory": "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9"
  }
}
```

---

## Verifying Deployment

### Check Contracts Were Deployed
```bash
# In Hardhat console
cd contracts
npx hardhat console --network localhost

> const governance = await ethers.getContractAt('GovernanceContract', '0x5FbDB2315678afecb367f032d93F642f64180aa3')
> await governance.floodThreshold()
> BigNumber { value: "3000" }
```

### Check Backend Can Connect
```bash
# Backend logs should show:
> Contracts initialized successfully
```

### Check Frontend Can See Data
Dashboard should display:
- ✓ Flood level reading
- ✓ User policies (if any)
- ✓ Pool stats

---

## Next: End-to-End Testing

Once deployed and verified:

1. **Buy Insurance**
   - Enter coverage amount
   - Submit transaction
   - Confirm in MetaMask
   - Check dashboard for new policy

2. **Trigger Oracle Update**
   - Backend oracle service updates flood level
   - Dashboard shows new level
   - If > 3000: auto-trigger payouts

3. **Monitor Claims**
   - Claims service detects triggered policies
   - Creates claims in database
   - View in Claims page

---

## Files to Reference

- **Deployment Script:** `contracts/scripts/deploy.js`
- **Hardhat Config:** `contracts/hardhat.config.js`
- **Smart Contracts:** `contracts/contracts/`
  - GovernanceContract.sol
  - InsurancePool.sol
  - OracleRegistry.sol
  - PolicyFactory.sol
  - IndividualPolicy.sol

---

**Status:** Ready to deploy! 🚀
