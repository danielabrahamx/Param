# Quick Reference: New Dashboard Features

## 🎯 What's New

### 1. Enhanced Flood Monitor

#### Features
- **Data Source Info**: See where flood data comes from (NOAA)
- **Last Updated**: Real-time timestamp of latest reading
- **Adjustable Thresholds**: Click "⚙️ Configure" to customize warning/critical levels
- **Detailed Metrics**: Current level in mm, severity percentage, and risk zones

#### How to Use
1. View the Dashboard at `/dashboard`
2. Scroll to "Flood Level Monitor" section
3. Click "⚙️ Configure" to adjust thresholds
4. Input new values for Warning and Critical levels
5. Click "✓ Done" to hide the editor

### 2. Analytics Dashboard

#### Access
- From Dashboard, click the purple "📊 Analytics" card
- Or navigate directly to `/analytics`

#### What You'll See
- Total policies count
- Total coverage amount
- Claims paid count
- Pool balance
- Premium revenue
- System health status
- Flood level history chart
- Risk distribution breakdown
- Network information

#### Auto-Refresh
- Metrics refresh every 30 seconds
- Manual refresh: reload the page

### 3. Hedera Blockchain

#### Switching to Hedera
1. Open MetaMask
2. Click network dropdown
3. Select "Add Network" if not listed
4. Enter these details:
   - **Network Name**: Hedera Testnet
   - **RPC URL**: https://testnet.hashio.io/api
   - **Chain ID**: 296
   - **Currency Symbol**: HBAR
   - **Block Explorer**: https://hashscan.io/testnet

#### Get Test HBAR
1. Visit https://portal.hedera.com/
2. Create an account (free)
3. Request test HBAR from faucet
4. Receive 10,000 test HBAR instantly

#### View Transactions
- Visit https://hashscan.io/testnet
- Paste your transaction hash or wallet address
- See all contract interactions

## 🔄 Dashboard Flow

```
Connect Wallet → Main Dashboard → Choose:
├── 📊 Analytics (System metrics)
├── 📋 Claims (Your claims)
├── 💰 Pool (Liquidity)
└── 🔌 Wallet (Connection)
```

## 🎨 Visual Indicators

### Status Colors
- 🟢 **Green**: Safe conditions (0 - Warning threshold)
- 🟠 **Orange**: Warning level (Warning - Critical threshold)
- 🔴 **Red**: Critical alert (Above critical threshold)

### Badges
- ✅ SAFE - Water levels normal
- ⚠️ WARNING - Elevated risk
- 🚨 CRITICAL - Automatic payouts triggered

## 💡 Pro Tips

### Threshold Configuration
- Set Warning lower than Critical
- Recommended ranges:
  - Warning: 2000-2500mm
  - Critical: 2800-3500mm
- Changes persist in your session

### Best Networks
1. **Hedera Testnet** (Recommended)
   - Fastest finality (3-5 seconds)
   - Lowest cost (~$0.01 per transaction)
   - Carbon negative

2. **Polygon Amoy** (Alternative)
   - Well-known testnet
   - Higher gas fees
   - Slower finality

3. **Local Hardhat** (Development)
   - Instant transactions
   - No real funds needed
   - Testing only

## 🔧 Troubleshooting

### Issue: Flood data shows "Loading..."
**Solution**: Check backend services are running:
```bash
cd backend
docker compose ps
```

### Issue: Can't see Analytics dashboard
**Solution**: Ensure you're connected (MetaMask icon shows connected)

### Issue: Thresholds won't save
**Solution**: Threshold changes are session-based. Future updates will persist to database.

### Issue: Wrong network
**Solution**: Switch MetaMask to Hedera Testnet (Chain ID 296)

## 📱 Mobile Responsive

All dashboards are fully responsive:
- ✅ Desktop (1920px+)
- ✅ Laptop (1280px+)
- ✅ Tablet (768px+)
- ✅ Mobile (320px+)

## 🎯 Common Tasks

### Check System Health
1. Go to Dashboard
2. Look at flood monitor status badge
3. Green = All clear, Red = Action needed

### View Historical Data
1. Click "📊 Analytics"
2. Scroll to "Flood Level History"
3. See last 3 readings (expandable)

### Customize Risk Levels
1. Dashboard → Flood Monitor
2. Click "⚙️ Configure"
3. Adjust Warning threshold
4. Adjust Critical threshold
5. Click "✓ Done"

### Monitor Pool Health
1. Click "💰 Pool" from Dashboard
2. View TVL (Total Value Locked)
3. See liquidity providers
4. Check APY rates

## 🚀 Keyboard Shortcuts

- `Ctrl/Cmd + R` - Refresh data
- `Esc` - Close modals
- `Tab` - Navigate forms

## 📊 Data Refresh Rates

- **Dashboard**: Every 10 seconds
- **Analytics**: Every 30 seconds
- **Flood Monitor**: Real-time (5 min oracle updates)
- **Pool Data**: Every 15 seconds

## 🔐 Security Notes

- Never share private keys
- Only use testnet for testing
- Verify contract addresses before transactions
- Use hardware wallet for mainnet
- Check network before signing

## 📞 Need Help?

- Read `HEDERA_INTEGRATION.md` for blockchain details
- Check `IMPROVEMENTS_SUMMARY.md` for feature overview
- Review inline code documentation
- Visit Hedera docs: https://docs.hedera.com

---

**Enjoy the enhanced dashboard! 🎉**
