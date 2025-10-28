# 🔧 Buy Insurance Fix - COMPLETED

**Date**: October 27, 2025  
**Issue**: Transaction failing when buying insurance

---

## 🐛 Root Causes Identified

### 1. **PolicyFactory Contract Bug**
The `createPolicy` function had a comment `// Accept any payment for now`, meaning it didn't require users to pay the premium. Users could create policies for free!

**Original Code:**
```solidity
function createPolicy(uint256 _coverage) external payable returns (address) {
    uint256 premium = (_coverage * governance.premiumRate()) / 100;
    // Accept any payment for now  ❌ BUG!
    
    // Send whatever was paid to pool
    if (msg.value > 0) {
        pool.receivePremium{value: msg.value}();
    }
    // ...
}
```

### 2. **Frontend Not Sending Premium**
The frontend transaction didn't include the premium value:
```typescript
writeContract({
  address: policyFactoryAddress,
  abi: policyFactoryAbi,
  functionName: 'createPolicy',
  args: [coverageWei],
  // DO NOT send value - the contract is not payable  ❌ WRONG!
  chainId: hederaTestnet.id,
})
```

### 3. **Mismatched Contract Addresses**
- Frontend/Backend: `0xDFa8b6E34A578AB12D2E57B7933b8c3E3b6Ab8A8`
- Contracts folder: `0x0aC8c90F6B4552B2F0F0039e0D0778c861f6d4Dd` (OLD)

---

## ✅ Fixes Applied

### 1. **Fixed PolicyFactory Contract**
```solidity
function createPolicy(uint256 _coverage) external payable returns (address) {
    uint256 premium = (_coverage * governance.premiumRate()) / 100;
    
    // ✅ Require user to pay the premium
    require(msg.value >= premium, "Insufficient premium payment");
    
    // Create the policy contract
    IndividualPolicy policy = new IndividualPolicy(_coverage, premium, msg.sender, oracle, address(governance), payable(address(pool)));
    
    // ✅ Send premium to pool
    pool.receivePremium{value: premium}();
    
    // ✅ Refund excess payment if any
    if (msg.value > premium) {
        payable(msg.sender).transfer(msg.value - premium);
    }
    
    // Fund the policy contract with coverage amount from pool
    pool.fundPolicy(payable(address(policy)), _coverage);
    
    emit PolicyCreated(address(policy), _coverage, premium, msg.sender);
    
    return address(policy);
}
```

### 2. **Fixed Frontend to Send Premium**
```typescript
export default function BuyInsurance() {
  const [coverage, setCoverage] = useState('')
  const coverageWei = coverage ? BigInt(Math.floor(parseFloat(coverage) * 10 ** 18)) : BigInt(0)
  const premium = coverage ? (parseFloat(coverage) * 0.1).toString() : '0'
  const premiumWei = coverage ? BigInt(Math.floor(parseFloat(coverage) * 0.1 * 10 ** 18)) : BigInt(0)  // ✅ Calculate premium
  
  const handleBuy = () => {
    // ...
    writeContract({
      address: policyFactoryAddress,
      abi: policyFactoryAbi,
      functionName: 'createPolicy',
      args: [coverageWei],
      value: premiumWei,  // ✅ Send the premium as payment
      chainId: hederaTestnet.id,
    })
  }
}
```

### 3. **Redeployed Contracts**
New deployment on Hedera Testnet:
```
GovernanceContract: 0x149972F7B4C5F9248C476f48552A1b1e9aD3A31E
InsurancePool:      0xd6ec409DAbaB38E6c8f12816873239024c732363
OracleRegistry:     0xaF7b7ea5f4CDC94E33e40f6b41205DE4a5D0c880
PolicyFactory:      0x001598f263B8869A0bffAE0E6c2327c69C87fb37
```

### 4. **Updated All Environment Files**
- ✅ `frontend/.env`
- ✅ `backend/.env`
- ✅ `backend/policy-service/.env`
- ✅ `contracts/.env`

### 5. **Funded Pool**
Deposited funds to the new pool contract for policy funding.

### 6. **Restarted Services**
- ✅ Backend services rebuilt and restarted
- ✅ Frontend dev server restarted
- ✅ All services running on http://localhost:5174

---

## 🧪 How to Test

1. **Open the app**: http://localhost:5174
2. **Connect MetaMask**: Make sure you're on Hedera Testnet
3. **Navigate to "Buy Insurance"**
4. **Enter coverage**: e.g., `2 HBAR`
5. **View premium**: Should show `0.2 HBAR` (10%)
6. **Click "Buy Insurance"**
7. **Approve in MetaMask**: Transaction will include 0.2 HBAR payment
8. **Wait for confirmation**: Should succeed and navigate to dashboard

---

## 📊 Expected Transaction Flow

```
User enters: 2 HBAR coverage
            ↓
Frontend calculates:
  - coverageWei = 2000000000000000000
  - premiumWei = 200000000000000000 (10%)
            ↓
Calls createPolicy with:
  - args: [2000000000000000000]
  - value: 200000000000000000
            ↓
PolicyFactory contract:
  - Requires msg.value >= 0.2 HBAR ✅
  - Creates policy with 2 HBAR coverage
  - Sends 0.2 HBAR premium to pool
  - Pool funds policy with 2 HBAR
  - Emits PolicyCreated event
            ↓
User gets policy ✅
```

---

## 🎯 What Was Wrong

**Before:**
- User clicks "Buy Insurance" with 2 HBAR coverage
- Frontend sends transaction with 0 HBAR value
- Contract accepts it (bug!)
- Policy created without payment
- Pool tries to fund policy but has no funds from premium
- Transaction fails ❌

**After:**
- User clicks "Buy Insurance" with 2 HBAR coverage  
- Frontend sends transaction with 0.2 HBAR value (premium)
- Contract requires payment ✅
- Premium goes to pool
- Pool funds policy with full coverage
- Transaction succeeds ✅

---

## 📁 Files Modified

### Smart Contracts
- `contracts/contracts/PolicyFactory.sol` - Added premium requirement

### Frontend
- `frontend/src/pages/BuyInsurance.tsx` - Send premium with transaction
- `frontend/.env` - Updated contract addresses

### Backend
- `backend/.env` - Updated contract addresses
- `backend/policy-service/.env` - Updated contract addresses

### Scripts
- `contracts/.env` - Updated contract addresses
- `contracts/scripts/deposit-to-pool.js` - Fixed pool ABI

---

## ✅ Status: READY FOR TESTING

All fixes applied, services restarted, and ready to test the buy insurance flow!

**Test URL**: http://localhost:5174

---

## 🚀 Next Steps

1. Test buying insurance with different coverage amounts
2. Verify premium calculation (10%)
3. Check that transactions succeed
4. Verify policies appear in dashboard
5. Monitor pool balance changes

---

**Fixed by**: Professional Blockchain Engineer 🔧
