# Paramify - Decentralized Flood Insurance Platform

**Project Overview**: A blockchain-based parametric insurance platform for flood insurance built on Hedera testnet. This project was created for a Hedera hackathon.

**Last Updated**: October 28, 2025

---

## Project Architecture

This is a full-stack decentralized application (dApp) consisting of:

### Frontend (Running on Replit)
- **Technology**: React + TypeScript + Vite
- **Web3 Integration**: Wagmi v2 for Hedera wallet connections
- **Styling**: Tailwind CSS
- **Port**: 5000
- **Status**: ✅ Fully configured and running

### Backend Services (Not running on Replit)
The backend consists of 6 microservices that require Docker, PostgreSQL, Redis, and blockchain connectivity:
- API Gateway (port 3000)
- Policy Service (port 3001) 
- Oracle Service (port 3002) - Fetches USGS flood data
- Claims Service (port 3003)
- Notification Service
- Analytics Service

**Note**: The backend services are designed to run locally with Docker Compose and are not configured in this Replit environment. The frontend will work for viewing the UI, but full functionality requires the backend services running separately.

### Smart Contracts
- **Blockchain**: Hedera Testnet (Chain ID: 296)
- **Development**: Hardhat + Solidity
- **Contracts**:
  - PolicyFactory: `0xd1f99c30b443bb43f0d3ebccd2ce357fefc94881`
  - OracleRegistry: `0x7676ee47aa8d780d26efb4e985b4e8b8d699cc03`
  - InsurancePool: `0x190e9ed37547edf2ebf3c828966f3708a5c3605f`
  - Governance: `0xc825debeb144fa319c643ac90c01d0721b7f3913`

---

## Replit Configuration

### Workflow
- **Name**: Frontend
- **Command**: `cd frontend && npm run dev`
- **Port**: 5000
- **Output**: Webview (user sees the website)

### Environment Variables
The frontend uses the following environment variables (configured in `frontend/.env`):
- `VITE_BACKEND_URL`: Backend API gateway URL
- `VITE_POLICY_FACTORY_ADDRESS`: PolicyFactory contract address
- `VITE_ORACLE_REGISTRY_ADDRESS`: OracleRegistry contract address  
- `VITE_POOL_ADDRESS`: InsurancePool contract address
- `VITE_GOVERNANCE_ADDRESS`: Governance contract address

### Vite Configuration
The `frontend/vite.config.ts` is configured for Replit's environment:
- **Host**: `0.0.0.0` (required for Replit)
- **Port**: `5000` (frontend port)
- **HMR**: Uses `REPLIT_DEV_DOMAIN` environment variable for hot module reload
  - This enables live code updates without refreshing the browser
  - The domain is automatically provided by Replit

### Deployment Settings
- **Type**: Autoscale (stateless website)
- **Build**: `npm run build --prefix frontend`
- **Run**: Production preview server on port 5000

---

## How It Works

### Parametric Insurance Model
1. **Oracle Data**: Water level monitoring from USGS (Potomac River near Washington, DC)
2. **Smart Contracts**: Automated claim processing based on predefined thresholds
3. **Decentralized Pool**: Community-funded insurance pool on Hedera blockchain
4. **Instant Payouts**: Automatic claims when flood levels breach thresholds

### User Flows
1. **Connect Wallet**: Users connect MetaMask to Hedera Testnet
2. **Buy Insurance**: Purchase flood insurance coverage with HBAR
3. **Monitor**: Dashboard shows real-time flood levels and policy status
4. **Claims**: Automatic claims triggered when flood thresholds are breached
5. **Pool Management**: View and manage the insurance liquidity pool

---

## Development Setup (Full Stack - Local)

For full local development with backend services, you need:

1. **Prerequisites**:
   - Node.js v18+
   - Docker & Docker Compose
   - PostgreSQL
   - MetaMask browser extension

2. **Backend Setup**:
   ```bash
   cd backend
   docker compose up -d
   ```

3. **Smart Contracts** (optional for local testing):
   ```bash
   cd contracts
   npx hardhat node
   npx hardhat run scripts/deploy.js --network localhost
   ```

4. **Frontend** (already configured on Replit):
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

---

## Testing on Hedera Testnet

### Get Test HBAR
- Visit the [Hedera Portal](https://portal.hedera.com/) to get free test HBAR
- Faucet available for testnet development

### Configure MetaMask
1. Add Hedera Testnet network:
   - **Network Name**: Hedera Testnet
   - **RPC URL**: https://testnet.hashio.io/api
   - **Chain ID**: 296
   - **Currency**: HBAR

2. Import test account or use your own funded account

### Connect to Paramify
- Click "Connect MetaMask" button
- Approve connection in MetaMask
- Access dashboard to view flood levels and insurance policies

---

## Project Structure

```
/
├── frontend/              # React frontend (RUNNING on Replit)
│   ├── src/
│   │   ├── pages/         # React pages (Dashboard, Claims, Pool, etc)
│   │   ├── wagmi.ts       # Web3 wallet configuration
│   │   └── App.tsx        # Main app component
│   ├── vite.config.ts     # Vite config (configured for Replit)
│   └── package.json
│
├── backend-simple/        # Simplified backend (RUNNING on Replit)
│   ├── server.js          # Express.js server (port 3000)
│   ├── middleware/        # Authentication middleware
│   ├── routes/            # API endpoints (policies, claims, admin, oracle)
│   └── db/                # PostgreSQL connection & schema
│
├── backend/               # Original microservices (NOT running - Docker only)
│   ├── api-gateway/
│   ├── policy-service/
│   ├── oracle-service/
│   ├── claims-service/
│   ├── notification-service/
│   └── analytics-service/
│
├── contracts/             # Solidity smart contracts
│   ├── contracts/
│   └── scripts/
│
└── Various .md files      # Comprehensive documentation
```

---

## Key Features

### Frontend Pages
1. **Connect** (`/connect`): Wallet connection page
2. **Dashboard** (`/dashboard`): Main hub with flood monitoring
3. **Buy Insurance** (`/buy-insurance`): Purchase policies
4. **Claims** (`/claims`): View and manage claims
5. **Pool** (`/pool`): Insurance pool liquidity management
6. **Analytics** (`/analytics`): Platform statistics

### Smart Contract Features
- Automated claim processing based on oracle data
- Decentralized governance for threshold management
- Transparent liquidity pool management
- Policy factory for creating individual policies
- Oracle registry for flood data verification

---

## Important Notes

### Replit Status
- ✅ **Backend RUNNING**: Simplified Express.js backend on port 3000 (no Docker needed)
- ✅ **Database CONFIGURED**: Using Replit's built-in PostgreSQL
- ✅ **Frontend fully functional**: React UI with Vite proxy to backend
- ✅ **Smart contracts deployed**: Contracts are live on Hedera testnet
- ✅ **Complete E2E flow**: Buy policy → Dashboard → Admin adjust threshold → Claim payout

### For Full Functionality
To test the complete platform with backend integration:
1. Clone the repository locally
2. Run Docker Compose for backend services
3. Connect to Hedera testnet with funded account
4. Deploy or use existing contract addresses

---

## Recent Changes (Replit Setup)

### October 28, 2025 - Production Ready: Real-Time USGS Flood Data ✅

**LATEST: Live USGS API Integration:**
- ✅ **Real-Time Flood Data**: Backend now fetches live water levels from USGS API
- ✅ **API Endpoint**: `https://waterservices.usgs.gov/nwis/iv/?format=json&sites=01646500&parameterCd=00065`
- ✅ **Current Reading**: 2.68 feet (268 in scaled units) - updates every 15 minutes
- ✅ **Fallback Mode**: If USGS API fails, falls back to database values
- ✅ **No Hardcoded Values**: All configuration (threshold, unit, level) stored in database

**Previous Critical Issues Fixed:**
- ✅ **Backend URL Fixed**: Changed from localhost to Vite proxy path (`/api`)
- ✅ **Duplicate API Calls Fixed**: Implemented transaction receipt tracking to prevent multiple saves
- ✅ **Database Response Format Fixed**: Proper atto-HBAR to HBAR conversion for display
- ✅ **Hardcoded Data Removed**: Dashboard now shows real data or loading states
- ✅ **Professional Architecture**: Clean, maintainable code structure
- ✅ **Complete E2E Flow Working**: Buy insurance → Transaction → Save to DB → Display on dashboard

**NEW: Simplified Backend Running on Replit:**
- ✅ **Consolidated Backend**: Replaced 6 Docker microservices with single Express.js backend (`backend-simple/`)
- ✅ **Replit PostgreSQL**: Uses built-in PostgreSQL database (no Docker required)
- ✅ **Complete API**: All endpoints functional with `/api/v1/` prefix (policies, claims, oracle, admin)
- ✅ **Vite Proxy**: Frontend configured to proxy API requests to backend on port 3000

**Security Implementation (Architect-Approved):**
- ✅ **Admin Authentication**: Admin endpoints require `X-Admin-Key` header (middleware at `backend-simple/middleware/auth.js`)
- ✅ **Protected Admin Routes**: `/api/v1/admin/*` endpoints enforce authentication (adjust threshold, flood level)
- ✅ **Claims Validation**: 
  - Requires blockchain transaction hash (`txHash`) to prove execution
  - Prevents duplicate claims (checks `policy.claimed` flag)
  - Blocks replay attacks (rejects duplicate transaction hashes)
- ✅ **Public Endpoints**: Policy listing, claims viewing, oracle data remain accessible without auth

**Architecture:**
```
backend-simple/
├── server.js              # Main Express server (port 3000)
├── middleware/auth.js     # Admin authentication middleware
├── routes/
│   ├── policies.js        # Policy CRUD endpoints
│   ├── claims.js          # Claims with validation
│   ├── admin.js           # Protected admin endpoints
│   └── oracle.js          # Flood level data
└── db/
    ├── connection.js      # PostgreSQL connection
    └── schema.sql         # Database schema
```

**Environment Variables Required:**
- `DATABASE_URL` - PostgreSQL connection (auto-provided by Replit)
- `ADMIN_API_KEY` - Admin authentication key (default: `demo-admin-key-123` for testing)

**Previous Bug Fixes:**
- ✅ **Fixed Policy Creation Bug**: Frontend decodes `PolicyCreated` event from blockchain
- ✅ **Fixed Backend Sync Blocking**: Policy service accepts policies without blocking
- ✅ **Fixed Claims Unit Mismatch**: Uses exact BigInt arithmetic for HBAR ↔ atto-HBAR conversion
- ✅ **Added Input Validation**: Claims service validates all monetary inputs
- ✅ **Dashboard Auto-Refresh**: 10-second polling displays policies correctly

**Technical Details:**
- All database monetary values stored in atto-HBAR (wei) for exact arithmetic
- Frontend sends decimal HBAR, backend converts using BigInt (10^18)
- Admin authentication uses header-based validation (simple for hackathon demo)
- Claims require blockchain proof via transaction hash

**Initial Setup:**
- ✅ Installed Node.js 20
- ✅ Configured Vite for Replit proxy (host: 0.0.0.0, port: 5000)
- ✅ Created `.env` file with Hedera testnet contract addresses
- ✅ Installed all frontend dependencies
- ✅ Set up workflow for frontend dev server
- ✅ Verified frontend loads correctly in browser
- ✅ Configured deployment settings for production

---

## Troubleshooting

### "Cannot connect to backend"
- The backend services are not running in this Replit environment
- For demo purposes, the frontend UI still works for wallet connection

### "MetaMask connection issues"
- Ensure MetaMask is configured for Hedera Testnet (Chain ID: 296)
- RPC URL should be: https://testnet.hashio.io/api
- Get test HBAR from Hedera Portal

### "Hot reload warnings"
- WebSocket connection warnings in console are normal for Replit
- They don't affect app functionality
- Changes to code will still trigger page refreshes

---

## Additional Documentation

Comprehensive documentation available in project root:
- `QUICK_START.md` - Getting started guide
- `ARCHITECTURE_DIAGRAMS.md` - System architecture
- `CONTRACTS.md` - Smart contract documentation
- `HEDERA_INTEGRATION.md` - Hedera blockchain integration
- `Phases.md` - Project development phases

---

## Contact & Resources

- **Hedera Portal**: https://portal.hedera.com/
- **Hedera Docs**: https://docs.hedera.com/
- **USGS Flood Data**: https://waterdata.usgs.gov/

---

**Status**: Frontend fully operational on Replit ✅  
**Next Steps**: Connect MetaMask wallet and explore the UI
