# Quick Start: Real On-Chain Insurance Pool

## 🚀 Deploy and Test in 5 Steps

### Step 1: Deploy Contracts to Hedera Testnet

```powershell
cd contracts
npx hardhat run scripts/deploy.js --network hederaTestnet
```

**Save the contract addresses** that are printed:
- GovernanceContract
- InsurancePool  
- OracleRegistry
- PolicyFactory

### Step 2: Update .env Files

**contracts/.env** (already has addresses from deployment)
```env
POOL_ADDRESS=0x...
POLICY_FACTORY_ADDRESS=0x...
ORACLE_ADDRESS=0x...
GOVERNANCE_ADDRESS=0x...
```

**backend/.env** (copy addresses from contracts/.env)
```env
POOL_ADDRESS=0x...
POLICY_FACTORY_ADDRESS=0x...
ORACLE_ADDRESS=0x...
GOVERNANCE_ADDRESS=0x...
RPC_URL=https://testnet.hashio.io/api
PRIVATE_KEY=0x...
```

### Step 3: Fund the Pool (REQUIRED!)

Pool needs initial capital before customers can buy policies.

**Recommended: Start with 50 HBAR**

```powershell
cd contracts
npx hardhat run scripts/fund-pool.js --network hederaTestnet
# When prompted, enter: 50
```

Or fund a specific amount directly:
```powershell
npx hardhat run scripts/fund-pool.js --network hederaTestnet 100
```

**Verify on Hashscan:**
```
https://hashscan.io/testnet/contract/<POOL_ADDRESS>
```
Should show ~50 HBAR balance

### Step 4: Start Backend Services

```powershell
cd backend
docker compose up -d
```

Verify services are running:
```powershell
docker compose ps
```

### Step 5: Test Policy Creation

**Option A: Using Frontend**
1. Start frontend: `cd frontend; npm run dev`
2. Go to http://localhost:5173
3. Click "Buy Policy"
4. Enter coverage amount (e.g., 5 HBAR)
5. Note: Backend creates policy and pays premium from admin wallet

**Option B: Using API**
```powershell
curl -X POST http://localhost:3000/api/v1/policies \
  -H "Content-Type: application/json" \
  -d '{
    "coverage": 5,
    "policyholder": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
  }'
```

## ✅ Verification Checklist

After Step 5, verify:

### 1. Pool Balance Decreased
```powershell
npx hardhat run scripts/fund-pool.js --network hederaTestnet
```
- If you funded with 50 HBAR and created a 5 HBAR policy
- Pool should now have: 50 + 0.5 (premium) - 5 (funding) = 45.5 HBAR

### 2. Policy Contract Has Balance
Check the policy address on Hashscan:
```
https://hashscan.io/testnet/contract/<POLICY_ADDRESS>
```
- Should have 5 HBAR (the coverage amount)

### 3. Backend Logs Show Success
```powershell
cd backend
docker compose logs policy-service --tail=50
```
Should see:
- "Premium received"
- "Policy funded"
- "Synced policy"

### 4. Frontend Pool Page Shows Correct Stats
Visit http://localhost:5173/pool
- TVL should match pool balance
- Reserve ratio should be healthy (>150%)

## 🧪 Test Complete Flow

### Create and Claim a Policy

1. **Fund pool**: 50 HBAR
2. **Create policy**: 5 HBAR coverage (costs 0.5 HBAR premium)
3. **Check policy balance**: Should be 5 HBAR
4. **Trigger claim** (backend does this automatically when conditions met)
5. **Verify payout**: Customer wallet receives 5 HBAR

### Monitor in Real-Time

**Terminal 1 - Backend Logs:**
```powershell
cd backend
docker compose logs -f policy-service claims-service
```

**Terminal 2 - Frontend:**
```powershell
cd frontend
npm run dev
```

**Browser - Hashscan:**
```
Pool: https://hashscan.io/testnet/contract/<POOL_ADDRESS>
Policy: https://hashscan.io/testnet/contract/<POLICY_ADDRESS>
```

## 📊 Understanding the Numbers

### Example with 100 HBAR Pool

```
Initial Pool: 100 HBAR
Reserve Ratio: 150%

Maximum fundable coverage: 100 / 1.5 = 66.67 HBAR

Can create:
- One 50 HBAR policy → Pool becomes: 100 + 5 - 50 = 55 HBAR
- Or ten 5 HBAR policies → Pool becomes: 100 + 5 - 50 = 55 HBAR  
- Or 66 policies at 1 HBAR each
```

### Why Pool Needs Initial Funding

Each policy:
- **Takes**: Coverage amount (e.g., 10 HBAR)
- **Gives**: Premium (e.g., 1 HBAR = 10% of coverage)
- **Net**: Pool loses 9 HBAR per policy

The initial funding covers this difference!

## 🎯 Recommended Test Scenarios

### Scenario 1: Basic Flow ✅
1. Fund pool: 30 HBAR
2. Create 3 policies: 5 HBAR each
3. Pool balance: 30 + 1.5 - 15 = 16.5 HBAR
4. Each policy has 5 HBAR
5. Trigger 1 claim: Customer gets 5 HBAR

### Scenario 2: Reserve Limit ⚠️
1. Fund pool: 15 HBAR  
2. Try to create 20 HBAR policy
3. Should FAIL: "Insufficient reserves"
4. Pool needs 20 * 1.5 = 30 HBAR minimum

### Scenario 3: Multiple Claims 💰
1. Fund pool: 50 HBAR
2. Create 5 policies: 5 HBAR each
3. Pool: 50 + 2.5 - 25 = 27.5 HBAR
4. Trigger all 5 claims
5. All customers get paid 5 HBAR each
6. Pool: 27.5 HBAR remaining

## 🐛 Common Issues

### "Insufficient reserves to fund policy"
**Problem**: Pool doesn't have enough HBAR  
**Solution**: 
```powershell
npx hardhat run scripts/fund-pool.js --network hederaTestnet 50
```

### "Transaction reverted"  
**Problem**: Admin wallet needs HBAR for gas  
**Solution**: Get HBAR from faucet at https://faucet.hedera.com

### "Cannot read properties of null"
**Problem**: Contract addresses not set in .env  
**Solution**: Copy addresses from deployment to backend/.env

### Pool shows 0 balance in frontend
**Problem**: RPC_URL incorrect or pool not funded  
**Solution**: Check .env has correct RPC_URL and fund pool

## 🎉 Success Indicators

You'll know everything works when:

✅ Pool contract has HBAR balance on Hashscan  
✅ Policy creation succeeds and returns policy address  
✅ Policy contract has coverage amount on Hashscan  
✅ Pool balance decreases by (coverage - premium)  
✅ Claims trigger and pay out to customer wallet  
✅ Frontend Pool page shows accurate on-chain data  

## 📚 More Info

See `REAL_POOL_IMPLEMENTATION.md` for detailed architecture and mechanics.
