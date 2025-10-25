# 🚀 Hedera Deployment Setup Guide

## ⚠️ You Need Your Private Key First!

To deploy to Hedera Testnet, you need to set up your private key.

### Step 1: Get Your Private Key from MetaMask

1. Open MetaMask extension
2. Click the **three dots menu** (⋮) next to your account
3. Select **Account details**
4. Click **Show private key**
5. Enter your MetaMask password
6. Copy the private key (64 character hex string)

### Step 2: Create `.env` File

Create a file at `c:\Users\danie\Param\contracts\.env` with:

```bash
PRIVATE_KEY=your_64_character_hex_string_here
```

⚠️ **IMPORTANT SECURITY NOTES:**
- Never share your private key
- Never commit `.env` to git (it's already in .gitignore)
- This key has access to your funds!
- Use a testnet account with only test HBAR

### Step 3: Get Test HBAR

1. Visit https://portal.hedera.com/
2. Login/Create account
3. Go to **Testnet** section
4. Request test HBAR (you'll get 10,000 test HBAR)
5. Your account will be funded in ~30 seconds

### Step 4: Deploy to Hedera

Once your `.env` is set up, run:

```powershell
cd c:\Users\danie\Param\contracts
npx hardhat run scripts/deploy.js --network hederaTestnet
```

### Step 5: Update Frontend Configuration

Copy the deployed addresses from the terminal output and update:
`c:\Users\danie\Param\frontend\.env`

---

## 🏃 Quick Alternative: Use Hardhat Localhost First

If you want to test immediately without deploying to Hedera:

1. Hardhat node is already running (✅)
2. Frontend `.env` already has localhost addresses (✅)
3. Just connect MetaMask to **Localhost 8545**:
   - Network: Localhost
   - RPC: http://127.0.0.1:8545
   - Chain ID: 31337

Then import a Hardhat test account:
- Private Key: `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`
- This gives you 10000 ETH for testing

---

## 📋 What I've Done So Far

✅ Created `.env.example` template in contracts folder
✅ Removed Polygon references from Connect.tsx UI
✅ Documented the deployment process

## 🎯 What You Need To Do

Choose one path:

### Path A: Deploy to Hedera (Recommended for Production)
1. Get your private key from MetaMask
2. Create `contracts/.env` with your key
3. Get test HBAR from Hedera portal
4. Let me know and I'll deploy for you

### Path B: Test on Localhost First
1. Connect MetaMask to Localhost 8545
2. Import Hardhat test account
3. Test the app locally
4. Deploy to Hedera later

Which path would you like to take?
