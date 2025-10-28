const { ethers } = require('ethers');
require('dotenv').config();

// Using the WORKING factory that passed diagnostics
const POLICY_FACTORY_ADDRESS = '0xd1f99c30b443bb43f0d3ebccd2ce357fefc94881';
const GOVERNANCE_ADDRESS = '0xc825debeb144fa319c643ac90c01d0721b7f3913';
const POOL_ADDRESS = '0x190e9ed37547edf2ebf3c828966f3708a5c3605f';

async function checkHederaState() {
  try {
    console.log('🔍 Checking Hedera Testnet Contract State...\n');

    // Try multiple RPC endpoints
    const rpcEndpoints = [
      'https://testnet.hashio.io/api',
      'https://pool.arkhia.io/hedera/testnet/json-rpc/v1',
    ];

    let provider;
    for (const rpc of rpcEndpoints) {
      try {
        console.log(`Trying RPC: ${rpc}...`);
        provider = new ethers.JsonRpcProvider(rpc);
        const network = await provider.getNetwork();
        console.log(`✅ Connected to chain ID: ${network.chainId}\n`);
        break;
      } catch (err) {
        console.log(`❌ Failed: ${err.message}`);
      }
    }

    if (!provider) {
      console.error('❌ Could not connect to any Hedera RPC endpoint');
      return;
    }

    // Check Policy Factory
    console.log('📋 Policy Factory:', POLICY_FACTORY_ADDRESS);
    const factoryCode = await provider.getCode(POLICY_FACTORY_ADDRESS);
    console.log('   Contract exists:', factoryCode !== '0x');
    
    // Check Governance
    console.log('\n📋 Governance:', GOVERNANCE_ADDRESS);
    const govCode = await provider.getCode(GOVERNANCE_ADDRESS);
    console.log('   Contract exists:', govCode !== '0x');
    
    if (govCode !== '0x') {
      const govAbi = ['function premiumRate() view returns (uint256)'];
      const govContract = new ethers.Contract(GOVERNANCE_ADDRESS, govAbi, provider);
      try {
        const rate = await govContract.premiumRate();
        console.log('   Premium Rate:', rate.toString() + '%');
      } catch (err) {
        console.log('   ⚠️  Could not read premium rate:', err.message);
      }
    }

    // Check Pool
    console.log('\n📋 Pool:', POOL_ADDRESS);
    const poolCode = await provider.getCode(POOL_ADDRESS);
    console.log('   Contract exists:', poolCode !== '0x');
    
    if (poolCode !== '0x') {
      const balance = await provider.getBalance(POOL_ADDRESS);
      // Hedera uses 8 decimals (tinybar)
      const balanceHBAR = Number(balance) / 1e8;
      console.log('   Pool Balance:', balanceHBAR, 'HBAR');
    }

    // Test wallet info
    console.log('\n👛 Test Wallet:');
    const testWallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    console.log('   Address:', testWallet.address);
    const testBalance = await provider.getBalance(testWallet.address);
    const testBalanceHBAR = Number(testBalance) / 1e8;
    console.log('   Balance:', testBalanceHBAR, 'HBAR');

    // Simulate createPolicy call
    console.log('\n🧪 Simulating createPolicy transaction...');
    const coverage = ethers.parseEther('4'); // 4 HBAR coverage
    const premiumRate = 10n; // 10%
    const premium = (coverage * premiumRate) / 100n;
    const premiumTinybar = premium / (10n ** 10n);
    
    console.log('   Coverage (wei):', coverage.toString());
    console.log('   Premium (wei):', premium.toString());
    console.log('   Premium (tinybar):', premiumTinybar.toString());
    console.log('   Premium (HBAR):', ethers.formatEther(premium));

    const factoryAbi = [
      'function createPolicy(uint256 _coverage) external payable returns (address)',
    ];
    const factoryContract = new ethers.Contract(POLICY_FACTORY_ADDRESS, factoryAbi, testWallet);

    try {
      // Estimate gas - try with msg.value in wei
      console.log('\n   Trying with value in WEI (no conversion)...');
      console.log('   Sending coverage:', coverage.toString());
      console.log('   Sending value:', premium.toString());
      const gasEstimate1 = await factoryContract.createPolicy.estimateGas(coverage, {
        value: premium, // Send premium in wei (18 decimals)
      });
      console.log('   ✅ Gas estimate (wei):', gasEstimate1.toString());
      console.log('   Transaction should succeed with value in WEI!');
    } catch (err) {
      console.log('   ❌ Transaction would fail (wei):', err.reason || err.message.split('\n')[0]);
      console.log('   Error details:', err.message);
    }

    try {
      // Estimate gas - try with msg.value in tinybar  
      console.log('\n   Trying with value in TINYBAR (/ 10^10)...');
      console.log('   Sending coverage:', coverage.toString());
      console.log('   Sending value:', premiumTinybar.toString());
      const gasEstimate2 = await factoryContract.createPolicy.estimateGas(coverage, {
        value: premiumTinybar, // Send premium in tinybar (8 decimals)
      });
      console.log('   ✅ Gas estimate (tinybar):', gasEstimate2.toString());
      console.log('   Transaction should succeed with value in TINYBAR!');
    } catch (err) {
      console.log('   ❌ Transaction would fail (tinybar):', err.reason || err.message.split('\n')[0]);
      console.log('   Error details:', err.message);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkHederaState();
