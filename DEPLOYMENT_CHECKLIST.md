# 🚀 Deployment Checklist - Real On-Chain Insurance Pool

Use this checklist when deploying the updated system.

## ✅ Pre-Deployment

- [ ] Admin wallet has sufficient HBAR (~10 HBAR for gas + initial pool funding)
- [ ] All `.env` files are configured with `PRIVATE_KEY` and `RPC_URL`
- [ ] Contracts compile successfully: `npx hardhat compile`
- [ ] Backend Docker containers are stopped: `docker compose down`

## 📝 Deployment Steps

### 1. Deploy Smart Contracts
```powershell
cd contracts
npx hardhat run scripts/deploy.js --network hederaTestnet
```

- [ ] GovernanceContract deployed ✓
- [ ] InsurancePool deployed ✓
- [ ] OracleRegistry deployed ✓
- [ ] PolicyFactory deployed ✓
- [ ] Factory address set on pool ✓

**Save all addresses!** You'll need them for the next steps.

---

### 2. Update Backend Environment
Copy contract addresses to `backend/.env`:

```env
POOL_ADDRESS=0x...
POLICY_FACTORY_ADDRESS=0x...
ORACLE_ADDRESS=0x...
GOVERNANCE_ADDRESS=0x...
```

- [ ] All addresses copied to `backend/.env`
- [ ] `RPC_URL` set to `https://testnet.hashio.io/api`
- [ ] `PRIVATE_KEY` matches admin wallet

---

### 3. Fund the Insurance Pool

**CRITICAL**: Pool must have funds before anyone can buy policies!

```powershell
cd contracts
npx hardhat run scripts/fund-pool.js --network hederaTestnet 50
```

- [ ] Funded pool with at least 50 HBAR
- [ ] Transaction confirmed on Hashscan
- [ ] Pool balance visible at: `https://hashscan.io/testnet/contract/<POOL_ADDRESS>`

**Recommended amounts:**
- Testing: 20-50 HBAR
- Demo: 100 HBAR  
- Production: 500+ HBAR

---

### 4. Start Backend Services
```powershell
cd backend
docker compose up -d
```

- [ ] All containers started successfully
- [ ] Check status: `docker compose ps`
- [ ] Check logs: `docker compose logs policy-service --tail=20`
- [ ] No error messages in logs

---

### 5. Verify Backend Connectivity

Test pool endpoint:
```powershell
curl http://localhost:3000/api/v1/pool
```

Expected response:
```json
{
  "tvl": 50,
  "availableBalance": 50,
  "reserveRatio": 100
}
```

- [ ] Pool endpoint returns correct TVL
- [ ] TVL matches funded amount
- [ ] No errors in response

---

### 6. Test Policy Creation

Create a test policy:
```powershell
curl -X POST http://localhost:3000/api/v1/policies `
  -H "Content-Type: application/json" `
  -d '{"coverage": 5, "policyholder": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"}'
```

- [ ] Policy created successfully
- [ ] Returns policy address
- [ ] Backend logs show "Premium received" and "Policy funded"

**Verify on Hashscan:**
1. [ ] Policy contract exists at returned address
2. [ ] Policy contract has 5 HBAR balance
3. [ ] Pool balance decreased by ~4.5 HBAR (5 coverage - 0.5 premium)

---

### 7. Start Frontend
```powershell
cd frontend
npm run dev
```

- [ ] Frontend starts on http://localhost:5173
- [ ] No console errors
- [ ] Can navigate to dashboard

---

### 8. Verify Frontend Pool Page

Visit: http://localhost:5173/pool

- [ ] Shows correct TVL from pool contract
- [ ] Shows correct reserve ratio
- [ ] Pool stats match Hashscan
- [ ] "Add Liquidity" button visible
- [ ] No loading errors

---

## 🧪 Post-Deployment Testing

### Test 1: Full Policy Lifecycle
- [ ] Customer buys 5 HBAR coverage policy
- [ ] Customer pays 0.5 HBAR premium (via backend)
- [ ] Policy contract receives 5 HBAR from pool
- [ ] Pool balance: Initial - 4.5 HBAR
- [ ] Policy shows in dashboard
- [ ] Claim can be triggered
- [ ] Customer receives 5 HBAR on claim

### Test 2: Pool Management
- [ ] Admin can deposit more HBAR via UI
- [ ] Pool stats update correctly
- [ ] Reserve ratio recalculates
- [ ] Transaction shows on Hashscan

### Test 3: Reserve Limits
- [ ] Try to create policy exceeding reserves
- [ ] Should fail with "Insufficient reserves"
- [ ] Error message clear and helpful

---

## 🔍 Verification Commands

### Check Pool Balance
```powershell
cd contracts
npx hardhat run scripts/fund-pool.js --network hederaTestnet
```

### Check Backend Logs
```powershell
cd backend
docker compose logs policy-service claims-service -f
```

### Check Containers
```powershell
cd backend
docker compose ps
```

### Test All Endpoints
```powershell
# Pool stats
curl http://localhost:3000/api/v1/pool

# All policies
curl http://localhost:3000/api/v1/policies

# Analytics
curl http://localhost:3000/api/v1/analytics/summary
```

---

## 📊 Expected State After Deployment

| Component | State |
|-----------|-------|
| Pool Contract | Funded with 50+ HBAR |
| Pool Reserves | 100% ratio (before policies) |
| Backend Services | All running, no errors |
| Frontend | Showing live pool data |
| Database | Synced with blockchain |

---

## 🐛 Troubleshooting

### Issue: "Insufficient reserves to fund policy"
**Cause**: Pool not funded or insufficient balance  
**Fix**: 
```powershell
cd contracts
npx hardhat run scripts/fund-pool.js --network hederaTestnet 50
```

### Issue: "Transaction reverted"
**Cause**: Admin wallet has no HBAR for gas  
**Fix**: Get HBAR from https://faucet.hedera.com

### Issue: Pool shows 0 balance in UI
**Cause**: Contract addresses not set in backend .env  
**Fix**: Copy addresses from deployment to backend/.env and restart containers

### Issue: Policy creation fails
**Cause**: Factory address not set on pool  
**Fix**: Check deployment logs, or manually call:
```javascript
await pool.setPolicyFactory(factoryAddress)
```

### Issue: Backend can't connect to contracts
**Cause**: Wrong RPC_URL or contract addresses  
**Fix**: Verify .env files have correct values

---

## 🎉 Success Criteria

Your deployment is successful when:

✅ Pool contract has HBAR balance on Hashscan  
✅ Backend can create policies with premium payment  
✅ Policy contracts receive coverage funding  
✅ Pool balance decreases by (coverage - premium)  
✅ Frontend shows accurate on-chain pool data  
✅ Claims can trigger and pay out to customers  
✅ All Docker containers running without errors  
✅ No transaction reverts or failed calls  

---

## 📞 Support Resources

- **Architecture**: `REAL_POOL_IMPLEMENTATION.md`
- **Quick Start**: `POOL_QUICKSTART.md`
- **Changes Summary**: `ON_CHAIN_POOL_SUMMARY.md`
- **Hashscan Testnet**: https://hashscan.io/testnet
- **Hedera Faucet**: https://faucet.hedera.com
- **RPC Endpoint**: https://testnet.hashio.io/api

---

## 📝 Notes

- Keep track of all contract addresses
- Monitor pool reserves regularly
- Ensure reserve ratio stays > 150%
- Fund pool before production launch
- Test thoroughly before announcing

---

**Date Deployed**: __________  
**Pool Address**: __________  
**Factory Address**: __________  
**Initial Funding**: __________ HBAR  
**Network**: Hedera Testnet  
