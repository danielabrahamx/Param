# Hedera Blockchain Integration Guide

## Overview
This insurance platform is now integrated with **Hedera Testnet**, a high-performance, environmentally sustainable public distributed ledger.

## Why Hedera?

### Key Advantages
- **Low & Predictable Fees**: Transactions cost fractions of a cent
- **High Throughput**: 10,000+ TPS with 3-5 second finality
- **Energy Efficient**: Carbon negative network
- **Enterprise Grade**: Governed by global enterprises (Google, IBM, Boeing, etc.)
- **EVM Compatible**: Deploy Solidity smart contracts seamlessly

## Network Configuration

### Hedera Testnet Details
- **Chain ID**: 296
- **RPC URL**: https://testnet.hashio.io/api
- **Explorer**: https://hashscan.io/testnet
- **Faucet**: https://portal.hedera.com/
- **Native Token**: HBAR (test HBAR on testnet)

## Setup Instructions

### 1. Get Test HBAR
1. Visit [Hedera Portal](https://portal.hedera.com/)
2. Create a testnet account
3. Request test HBAR from the faucet
4. You'll receive 10,000 test HBAR

### 2. Configure MetaMask for Hedera

Add Hedera Testnet to MetaMask:
- **Network Name**: Hedera Testnet
- **RPC URL**: https://testnet.hashio.io/api
- **Chain ID**: 296
- **Currency Symbol**: HBAR
- **Block Explorer**: https://hashscan.io/testnet

### 3. Set Environment Variables

Create a `.env` file in the `contracts` directory:

```bash
PRIVATE_KEY=your_private_key_here
HEDERA_ACCOUNT_ID=0.0.xxxxx  # Your Hedera account ID
```

⚠️ **Never commit your private key to version control!**

## Deployment

### Deploy to Hedera Testnet

```bash
cd contracts
npx hardhat run scripts/deploy.js --network hederaTestnet
```

The deployment script will:
1. Deploy all 5 insurance smart contracts
2. Save contract addresses to `deployed-addresses.json`
3. Verify contracts can be viewed on HashScan

### Deployed Contracts Structure

```
GovernanceContract   - DAO governance for protocol upgrades
OracleRegistry      - Oracle data management
PolicyFactory       - Create new insurance policies
IndividualPolicy    - Policy logic template
InsurancePool       - Liquidity pool management
```

## Contract Interaction

### Using Hardhat Console

```bash
npx hardhat console --network hederaTestnet
```

Then interact with contracts:
```javascript
const PolicyFactory = await ethers.getContractFactory("PolicyFactory")
const factory = PolicyFactory.attach("0x...")
const tx = await factory.createPolicy(coverage, premium, duration)
await tx.wait()
```

### Using Frontend

The frontend automatically detects Hedera testnet if:
1. MetaMask is connected to Hedera testnet (Chain ID 296)
2. You have test HBAR for gas fees

## Cost Estimates

### Hedera Testnet Transaction Costs
- Deploy PolicyFactory: ~$0.10 USD in HBAR
- Create Policy: ~$0.01 USD in HBAR
- Process Claim: ~$0.02 USD in HBAR
- Oracle Update: ~$0.005 USD in HBAR

*Mainnet costs are similar, making Hedera extremely cost-effective*

## Monitoring & Debugging

### View Transactions
Visit [HashScan Testnet](https://hashscan.io/testnet) and search by:
- Transaction hash
- Contract address
- Account ID

### Check Contract State
```bash
npx hardhat run scripts/get-addresses.js --network hederaTestnet
```

## Migration from Other Networks

### From Polygon/Avalanche
No code changes needed! Hedera is EVM-compatible:
```bash
# Simply deploy to Hedera instead
npx hardhat run scripts/deploy.js --network hederaTestnet
```

### Frontend Updates
The wagmi config now includes Hedera:
```typescript
chains: [hardhat, hederaTestnet, polygonAmoy]
```

Users can switch networks in MetaMask without app changes.

## Production Deployment (Mainnet)

### Hedera Mainnet Configuration

```javascript
hederaMainnet: {
  url: "https://mainnet.hashio.io/api",
  accounts: [process.env.PRIVATE_KEY],
  chainId: 295,
}
```

### Pre-Mainnet Checklist
- [ ] Smart contracts audited by security firm
- [ ] All tests passing (100% coverage)
- [ ] Oracle data sources validated
- [ ] Emergency pause mechanism tested
- [ ] Multi-sig governance wallet configured
- [ ] Gas fee buffers calculated
- [ ] Real HBAR acquired for deployment (~$20 USD recommended)

### Mainnet Deployment
```bash
npx hardhat run scripts/deploy.js --network hederaMainnet
```

## Troubleshooting

### Common Issues

**Issue**: "Insufficient HBAR balance"
- **Solution**: Visit faucet and request test HBAR

**Issue**: "Network not detected"
- **Solution**: Add Hedera testnet to MetaMask manually

**Issue**: "Transaction reverted"
- **Solution**: Check contract logic and ensure sufficient gas

**Issue**: "Cannot connect to RPC"
- **Solution**: Verify hashio.io is accessible, try alternative RPC

### Alternative RPC Endpoints
- Primary: https://testnet.hashio.io/api
- Mirror Node: https://testnet.mirrornode.hedera.com

## Resources

### Official Documentation
- [Hedera Docs](https://docs.hedera.com)
- [Smart Contract Service](https://docs.hedera.com/guides/core-concepts/smart-contracts)
- [Hedera JSON-RPC Relay](https://docs.hedera.com/hedera/core-concepts/smart-contracts/json-rpc-relay)

### Developer Tools
- [Hedera Portal](https://portal.hedera.com/) - Account management
- [HashScan](https://hashscan.io/) - Block explorer
- [Hedera SDK](https://docs.hedera.com/hedera/sdks-and-apis/sdks) - Native SDK for advanced features

### Community
- [Discord](https://hedera.com/discord)
- [GitHub](https://github.com/hashgraph)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/hedera-hashgraph)

## Benefits for Insurance DApp

### Why Hedera is Ideal for Insurance
1. **Low Premiums**: Minimal gas costs keep insurance affordable
2. **Fast Claims**: 3-5 second finality means instant payouts
3. **Reliable Oracle Updates**: Frequent updates without high costs
4. **Enterprise Trust**: Governed by Fortune 500 companies
5. **Regulatory Compliance**: Built with governance in mind

## Next Steps

1. Deploy contracts to Hedera testnet
2. Update frontend environment variables
3. Test end-to-end flows on testnet
4. Monitor HashScan for transaction details
5. Prepare for mainnet deployment

---

**Questions?** Refer to [Hedera Documentation](https://docs.hedera.com) or open an issue in this repository.
