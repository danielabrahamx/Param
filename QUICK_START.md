# 🚀 Quick Start Guide - Paramify Platform

**Goal:** Get everything running and test the full platform end-to-end

---

## ⚡ 5-Minute Setup

### Prerequisites
- Node.js v18+
- MetaMask browser extension
- Docker & Docker Compose
- Git bash or PowerShell

### Step 1: Start All Services (5 terminals)

**Terminal 1 - Frontend:**
```bash
cd c:\Users\danie\Param\frontend
npm run dev
# Opens at http://localhost:5177
```

**Terminal 2 - Backend:**
```bash
cd c:\Users\danie\Param\backend
docker compose up -d
# Services on 3000-3003
```

**Terminal 3 - Smart Contracts (Local):**
```bash
cd c:\Users\danie\Param\contracts
npx hardhat node
# Runs at http://localhost:8545
```

**Terminal 4 - Deploy Contracts:**
```bash
cd c:\Users\danie\Param\contracts
# Wait for Terminal 3 to be ready, then:
npx hardhat run scripts/deploy.js --network localhost
# Copy the deployed addresses
```

**Terminal 5 - Monitor (Optional):**
```bash
cd c:\Users\danie\Param\backend
docker compose logs -f
```

---

## 🔌 Configure MetaMask

1. Open MetaMask extension
2. Click network dropdown → Add Network
3. Fill in:
   ```
   Name: Hardhat Localhost
   RPC URL: http://localhost:8545
   Chain ID: 31337
   Currency: ETH
   ```
4. Switch to Hardhat Localhost
5. Click "Import Account"
6. Paste: `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`
7. You now have 10,000 ETH for testing! 🎉

---

## 🎯 Test the Platform

### 1. Check Backend is Running
```
✅ API Gateway:   http://localhost:3000
✅ Policy Service: http://localhost:3001
✅ Oracle Service: http://localhost:3002
✅ Claims Service: http://localhost:3003
✅ Database:       http://localhost:5432
✅ Redis:          http://localhost:6379
```

### 2. Update Frontend .env
```bash
# Edit: c:\Users\danie\Param\frontend\.env
# Set addresses from Terminal 4 deployment output

VITE_BACKEND_URL=http://localhost:3000
VITE_POLICY_FACTORY_ADDRESS=0x...  # Copy from deploy output
VITE_ORACLE_REGISTRY_ADDRESS=0x... # Copy from deploy output
VITE_POOL_ADDRESS=0x...            # Copy from deploy output
VITE_GOVERNANCE_ADDRESS=0x...      # Copy from deploy output
```

### 3. Reload Frontend
Open http://localhost:5177 in browser and refresh (Ctrl+R)

---

## 🧪 Test User Flows

### Flow 1: Connect Wallet
1. Go to http://localhost:5177
2. Click "Connect Wallet"
3. Select MetaMask
4. Approve in MetaMask
5. ✅ Should see Dashboard with flood level

### Flow 2: Buy Insurance
1. Click "+ New Insurance" button
2. Enter coverage: `1.0`
3. Premium auto-calculates: `0.1`
4. Click "Buy Insurance"
5. Approve in MetaMask
6. ✅ Transaction succeeds, policy appears in dashboard

### Flow 3: View Dashboard
1. See real-time flood level
2. View your policies
3. Color-coded risk status (Safe/Risky/Critical)
4. ✅ Auto-refreshes every 10 seconds

### Flow 4: Monitor Claims
1. Click "Claims" in navigation
2. View claims with status badges
3. See pending claims (if any)
4. ✅ Admin can approve/reject

### Flow 5: Manage Pool
1. Click "Pool" in navigation
2. View TVL and reserve ratio
3. See pool health indicator
4. ✅ Can deposit/withdraw (if admin)

---

## 🐛 Troubleshooting

### "Cannot connect to localhost:8545"
```
❌ Problem: Hardhat node not running
✅ Solution: Check Terminal 3, restart if needed
   npx hardhat node
```

### "Contract addresses showing as 0x..."
```
❌ Problem: Frontend .env not updated
✅ Solution: 
   1. Check deploy output in Terminal 4
   2. Copy addresses to frontend/.env
   3. Refresh browser (Ctrl+Shift+R)
```

### "MetaMask keeps asking to switch network"
```
❌ Problem: Not on Hardhat Localhost
✅ Solution:
   1. Click MetaMask network dropdown
   2. Switch to "Hardhat Localhost"
   3. Refresh page
```

### "Transaction fails in MetaMask"
```
❌ Problem: Account doesn't have ETH or contract failed
✅ Solution:
   1. Check test account has 10,000 ETH
   2. Check contract addresses in .env
   3. Check Hardhat node is still running
```

### Backend service not responding
```
❌ Problem: Docker container crashed
✅ Solution:
   docker compose restart <service-name>
   # Example:
   docker compose restart policy-service
```

---

## 📊 Verify Everything Works

Run this checklist:

- [ ] Frontend loads at http://localhost:5177
- [ ] Can connect wallet in MetaMask
- [ ] Dashboard shows flood level
- [ ] Can navigate to all 5 pages
- [ ] Backend API endpoints return data:
  ```bash
  curl http://localhost:3000/api/v1/oracle/flood-level/1
  ```
- [ ] Database has data:
  ```bash
  docker compose exec postgres psql -U user -d param -c "SELECT * FROM policies;"
  ```

---

## 🎮 Testing Commands

### Backend API Tests
```bash
# Get flood level
curl http://localhost:3000/api/v1/oracle/flood-level/1

# Get policies
curl http://localhost:3000/api/v1/policies

# Get claims
curl http://localhost:3000/api/v1/claims

# Get pool stats
curl http://localhost:3000/api/v1/pool
```

### Database Queries
```bash
# Connect to database
docker compose exec postgres psql -U user -d param

# View policies
SELECT * FROM policies;

# View claims
SELECT * FROM claims;

# View flood readings
SELECT * FROM flood_readings;
```

### Smart Contract Interactions
```bash
# Hardhat console
cd contracts
npx hardhat console --network localhost

# Get governance
const gov = await ethers.getContractAt('GovernanceContract', '0x5FbDB2315678afecb367f032d93F642f64180aa3')
await gov.floodThreshold()
// Returns: BigNumber { value: "3000" }

# Get oracle flood level
const oracle = await ethers.getContractAt('OracleRegistry', '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0')
await oracle.getLatestFloodLevel(1)
// Returns current flood level
```

---

## 📈 What Each Page Does

| Page | URL | Feature | Test |
|------|-----|---------|------|
| Connect | `/connect` | Wallet connection | Try connecting |
| Dashboard | `/dashboard` | Main hub, flood monitor | View flood level |
| Buy Insurance | `/buy-insurance` | Purchase policy | Enter 1.0 ETH coverage |
| Claims | `/claims` | View claims | Check claims list |
| Pool | `/pool` | Manage liquidity | View TVL |

---

## 🚨 Emergency Commands

### Stop Everything
```bash
# Stop backend
cd c:\Users\danie\Param\backend
docker compose down

# Kill Hardhat node (Ctrl+C in Terminal 3)

# Kill frontend (Ctrl+C in Terminal 1)
```

### Clean Restart
```bash
# Remove Docker containers
docker compose down -v

# Start fresh
docker compose up -d
npx hardhat node
npm run dev
```

### View Logs
```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f policy-service

# Frontend (in Terminal 1)
# Already visible

# Contracts (in Terminal 3)
# Already visible
```

---

## ✅ Success Checklist

When everything is working, you should see:

```
✅ Frontend running at http://localhost:5177
✅ All 6 backend services healthy (docker compose ps)
✅ Hardhat node at http://localhost:8545
✅ MetaMask connected to Hardhat Localhost
✅ Test account with 10,000 ETH
✅ Dashboard shows flood level
✅ Can navigate all 5 pages
✅ API endpoints responding with data
```

---

## 📚 Documentation

For more details, see:
- `STATUS_REPORT.md` - Complete platform status
- `FRONTEND_TESTING_SUMMARY.md` - Frontend details
- `CONTRACT_DEPLOYMENT_GUIDE.md` - Contract deployment
- `CONTRACTS.md` - Smart contract documentation
- `Phases.md` - Project phases overview

---

## 🎯 Next Steps

1. **Deploy Contracts** (if not done)
   ```bash
   cd contracts
   npx hardhat run scripts/deploy.js --network localhost
   ```

2. **Update Frontend** with deployed addresses

3. **Test Full Flow** - Connect wallet → Buy insurance → View claims

4. **Verify Backend** - Check API endpoints return real data

5. **Deploy to Testnet** (when ready)
   ```bash
   npx hardhat run scripts/deploy.js --network polygonAmoy
   ```

---

## 💡 Pro Tips

1. **Use Hardhat's Built-in Accounts** - They have infinite ETH
2. **Keep Node Running** - Hardhat node must stay alive
3. **Check Docker Logs** - If API fails, check: `docker compose logs`
4. **Refresh Hard** - Sometimes need Ctrl+Shift+R for changes
5. **Update .env** - Always reload frontend after changing .env

---

**You're all set! Ready to test Paramify? 🚀**

Questions? Check the detailed documentation files.

Good luck! 🍀
