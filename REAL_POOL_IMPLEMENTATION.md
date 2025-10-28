# Real On-Chain Insurance Pool Implementation

## ✅ What's Now Implemented

The insurance pool is now a **fully functional on-chain mechanism** where real HBAR flows through the system:

### 🏦 Pool Mechanics

1. **Admin Deposits**: Admin deposits HBAR into the `InsurancePool` contract
2. **Premium Collection**: When customers buy policies, premiums go into the pool
3. **Policy Funding**: Pool automatically funds each policy contract with the coverage amount
4. **Claims Payment**: Policy contracts pay out from their funded balance
5. **Reserve Management**: Pool maintains 150% reserve ratio for solvency

## 🔄 How It Works

```
┌─────────────┐
│   Admin     │ Deposits HBAR
│   Wallet    │────────────────┐
└─────────────┘                │
                               ▼
                        ┌──────────────┐
                        │ Insurance    │
    Customer ──────────►│   Pool       │
    (pays premium)      │  Contract    │
                        └──────┬───────┘
                               │
                               │ Funds policy
                               │ with coverage
                               ▼
                        ┌──────────────┐
                        │  Individual  │
                        │   Policy     │───► Pays customer
                        │  Contract    │    on valid claim
                        └──────────────┘
```

## 📝 Smart Contract Changes

### InsurancePool.sol
- ✅ `deposit()` - Admin deposits HBAR into pool
- ✅ `receivePremium()` - Receives premiums from policy creation
- ✅ `fundPolicy()` - Transfers coverage amount to policy contract
- ✅ `setPolicyFactory()` - Authorize factory to fund policies
- ✅ Reserve ratio checks (150% minimum)

### PolicyFactory.sol
- ✅ `createPolicy()` now **payable** - requires premium payment
- ✅ Forwards premium to pool via `receivePremium()`
- ✅ Calls `fundPolicy()` to send coverage to policy contract
- ✅ Refunds excess payment to customer

### IndividualPolicy.sol
- ✅ Accepts funding from pool (receive function)
- ✅ `triggerPayout()` transfers coverage to policyholder from contract balance
- ✅ `getBalance()` to check contract funding
- ✅ Real on-chain payout, not just database record

## 🚀 Usage

### 1. Deploy Contracts

```bash
cd contracts
npx hardhat run scripts/deploy.js --network hederaTestnet
```

### 2. Fund the Pool (Required!)

The pool MUST have funds before customers can buy policies.

**Option A: Using Script**
```bash
# Fund with 100 HBAR
npx hardhat run scripts/fund-pool.js --network hederaTestnet 100

# Or interactive mode
npx hardhat run scripts/fund-pool.js --network hederaTestnet
```

**Option B: Using Frontend**
1. Go to Pool page in the UI
2. Use "Add Liquidity" section
3. Enter amount and deposit

**Option C: Using Backend API**
```bash
curl -X POST http://localhost:3000/api/v1/pool/deposit \
  -H "Content-Type: application/json" \
  -d '{"amount": 100}'
```

### 3. Buy a Policy (Customer)

When a customer buys a policy:
1. They pay the **premium** (10% of coverage)
2. Premium goes into the pool
3. Pool funds the policy contract with **full coverage amount**
4. Policy is ready to pay out

Example: Customer wants 10 HBAR coverage
- Customer pays: 1 HBAR (premium)
- Pool funds policy with: 10 HBAR
- Net pool change: -9 HBAR

**This is why the pool needs initial funding!**

### 4. Pool Reserve Requirements

The pool uses a 150% reserve ratio:
- To fund a policy with 10 HBAR coverage, pool needs 15 HBAR in reserves
- Premium of 1 HBAR is added to pool
- But 10 HBAR is sent to policy contract
- Net: Pool loses 9 HBAR per policy

**Example Calculation:**
```
Initial pool deposit: 100 HBAR
Reserve ratio: 150%
Max fundable coverage: 100 / 1.5 = 66.67 HBAR

Can support:
- 6 policies at 10 HBAR coverage each (60 HBAR total)
- Or 66 policies at 1 HBAR coverage each
```

## 💡 Key Differences from Before

### Before (Broken)
- ❌ Pool was just a database table
- ❌ No real HBAR in contracts
- ❌ Claims couldn't actually pay out
- ❌ Premium stayed with customer
- ❌ Just simulation/tracking

### After (Working)
- ✅ Pool is a funded smart contract
- ✅ Real HBAR flows through system
- ✅ Policies have balance to pay claims
- ✅ Premiums go into pool
- ✅ Actual on-chain insurance

## 🔍 Verification

### Check Pool Balance
```bash
# Using Hashscan
https://hashscan.io/testnet/contract/<POOL_ADDRESS>

# Using Script
npx hardhat run scripts/fund-pool.js --network hederaTestnet
```

### Check Policy Balance
```bash
# In backend logs when policy created
# Or check contract on Hashscan
https://hashscan.io/testnet/contract/<POLICY_ADDRESS>
```

### Test Full Flow
1. Admin deposits 50 HBAR to pool
2. Customer buys 10 HBAR coverage policy (pays 1 HBAR premium)
3. Pool should have: 50 + 1 - 10 = 41 HBAR
4. Policy contract should have: 10 HBAR
5. Claim triggers: Customer receives 10 HBAR from policy contract

## ⚠️ Important Notes

### Initial Funding Required
You **MUST** fund the pool before anyone can buy policies. The pool needs sufficient reserves to fund policy contracts.

### Reserve Ratio Protection
The pool will reject policy creation if it doesn't have enough reserves (150% of coverage amount).

### Admin Private Key
The `PRIVATE_KEY` in `.env` is the admin wallet that:
- Owns the pool contract
- Deposits funds into the pool
- Creates policies on behalf of customers
- Must have HBAR balance for gas fees

### Gas Fees
Every transaction costs gas:
- Deploying contracts: ~1-2 HBAR
- Depositing to pool: ~0.01 HBAR
- Creating policy: ~0.5-1 HBAR (includes funding transfer)
- Triggering payout: ~0.01 HBAR

## 📊 Monitoring

### Backend Logs
The policy service logs when:
- Premiums are received
- Policies are funded
- On-chain sync completes

### Frontend Pool Page
Shows real-time:
- Total Value Locked (TVL)
- Available Reserves
- Reserve Ratio
- All from on-chain data

## 🎯 Next Steps

1. **Fund the pool** with sufficient HBAR (start with 50-100 HBAR)
2. **Test policy creation** - ensure premium is paid and policy is funded
3. **Verify balances** - check pool and policy contract balances on Hashscan
4. **Test claims** - trigger a payout and verify customer receives HBAR
5. **Monitor reserves** - ensure ratio stays above 150%

## 🐛 Troubleshooting

### "Insufficient reserves to fund policy"
- Pool doesn't have enough HBAR
- Solution: Deposit more HBAR into pool

### "Insufficient premium payment"
- Customer didn't send enough HBAR with transaction
- Backend should send correct premium amount

### "Policy has insufficient balance for payout"
- Policy wasn't funded properly during creation
- Check pool had sufficient balance when policy was created

### Transaction Reverted
- Check admin wallet has HBAR for gas
- Verify all contract addresses in `.env` are correct
- Ensure pool factory address is set on pool contract
