const { ethers } = require('ethers');
require('dotenv').config();

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

const PolicyFactoryABI = require('./artifacts/contracts/PolicyFactory.sol/PolicyFactory.json').abi;
const IndividualPolicyABI = require('./artifacts/contracts/IndividualPolicy.sol/IndividualPolicy.json').abi;

(async () => {
  try {
    const factoryAddress = process.env.POLICY_FACTORY_ADDRESS;
    const coverage = ethers.parseEther('5'); // 5 HBAR
    const premiumEstimate = coverage / BigInt(10); // 10% premium

    console.log('=== TESTING NEW DEPLOYMENT ===\n');
    console.log('Creating policy with 5 HBAR coverage...');
    console.log('Premium estimate: ', ethers.formatEther(premiumEstimate), 'HBAR\n');

    const factory = new ethers.Contract(factoryAddress, PolicyFactoryABI, signer);

    const tx = await factory.createPolicy(coverage, {
      value: premiumEstimate,
      gasLimit: 1000000, // High gas limit
    });

    console.log('Transaction sent:', tx.hash);
    const receipt = await tx.wait();
    console.log('✅ Policy created!\n');

    // Extract policy address
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
      console.log('Policy Address:', policyAddress);
      console.log('Coverage:', ethers.formatEther(event.args.coverage), 'HBAR');
      console.log('Premium:', ethers.formatEther(event.args.premium), 'HBAR\n');

      // Check policy balance immediately
      const policyBalance = await provider.getBalance(policyAddress);
      console.log('📊 Policy Balance: ', ethers.formatEther(policyBalance), 'HBAR');

      if (policyBalance > 0n) {
        console.log('✅ SUCCESS! Policy was funded by the pool!\n');

        // Now test the payout
        console.log('Testing payout...');
        const policy = new ethers.Contract(policyAddress, IndividualPolicyABI, signer);
        const balanceBefore = await provider.getBalance(signer.address);

        const payoutTx = await policy.triggerPayout({
          gasLimit: 300000,
        });

        console.log('Payout transaction sent:', payoutTx.hash);
        const payoutReceipt = await payoutTx.wait();
        console.log('✅ Payout sent!\n');

        const balanceAfter = await provider.getBalance(signer.address);
        const received = balanceAfter - balanceBefore;

        console.log('Balance received:', ethers.formatEther(received), 'HBAR');
        console.log('✅ FULL PAYOUT FLOW WORKS!');

      } else {
        console.log('❌ ERROR: Policy has 0 HBAR!');
      }
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
})();
