const { ethers } = require('ethers');
require('dotenv').config();

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

const PolicyFactoryABI = require('./artifacts/contracts/PolicyFactory.sol/PolicyFactory.json').abi;

(async () => {
  try {
    const factoryAddress = process.env.POLICY_FACTORY_ADDRESS;
    console.log('Creating test policy...\n');

    const factory = new ethers.Contract(factoryAddress, PolicyFactoryABI, signer);

    // Coverage: 2 HBAR (2 * 10^18 wei)
    const coverage = ethers.parseEther('2');
    console.log('Coverage:', ethers.formatEther(coverage), 'HBAR');

    // Send transaction (premium will be calculated by contract)
    // Premium should be 2 * 10% = 0.2 HBAR
    const premiumEstimate = coverage / BigInt(10); // 10% premium rate
    console.log('Expected premium:', ethers.formatEther(premiumEstimate), 'HBAR');
    console.log('Sending transaction with', ethers.formatEther(premiumEstimate), 'HBAR for premium...\n');

    const tx = await factory.createPolicy(coverage, {
      value: premiumEstimate,
      gasLimit: 500000,
    });

    console.log('Transaction sent:', tx.hash);
    const receipt = await tx.wait();
    console.log('✅ Policy created!');
    console.log('Block:', receipt.blockNumber);

    // Extract policy address from logs
    const event = receipt.logs
      .map(log => {
        try {
          return factory.interface.parseLog(log);
        } catch {
          return null;
        }
      })
      .find(e => e && e.name === 'PolicyCreated');

    if (event) {
      const policyAddress = event.args.policyAddress;
      console.log('\n✓ New Policy Address:', policyAddress);
      console.log('✓ Coverage:', ethers.formatEther(event.args.coverage), 'HBAR');
      console.log('✓ Premium:', ethers.formatEther(event.args.premium), 'HBAR');

      // Check policy balance
      const balance = await provider.getBalance(policyAddress);
      console.log('\n📊 Policy Contract Balance:', ethers.formatEther(balance), 'HBAR');
      console.log(balance.toString() === '0' ? '❌ ERROR: Policy received 0 HBAR' : '✅ SUCCESS: Policy funded!');
    }

  } catch (error) {
    console.error('Error:', error.message);
    if (error.data) {
      console.error('Revert reason:', error.data);
    }
  }
})();
