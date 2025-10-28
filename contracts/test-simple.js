const { ethers } = require('ethers');
require('dotenv').config();

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

const PolicyFactoryABI = require('./artifacts/contracts/PolicyFactory.sol/PolicyFactory.json').abi;

(async () => {
  try {
    const factoryAddress = process.env.POLICY_FACTORY_ADDRESS;
    const coverage = ethers.parseEther('2'); // 2 HBAR
    const premiumEstimate = ethers.parseEther('0.2'); // 0.2 HBAR

    console.log('Creating policy...');
    console.log('Coverage:', ethers.formatEther(coverage), 'HBAR');
    console.log('Premium:', ethers.formatEther(premiumEstimate), 'HBAR\n');

    const factory = new ethers.Contract(factoryAddress, PolicyFactoryABI, signer);

    // Try with estim ated gas first
    let estimatedGas;
    try {
      estimatedGas = await factory.createPolicy.estimateGas(coverage, {
        value: premiumEstimate,
      });
      console.log('Estimated gas:', estimatedGas.toString());
    } catch (e) {
      console.log('Gas estimation failed:', e.message);
      estimatedGas = BigInt(1000000);
    }

    const tx = await factory.createPolicy(coverage, {
      value: premiumEstimate,
      gasLimit: estimatedGas * BigInt(2), // 2x the estimate
    });

    console.log('Transaction sent:', tx.hash);
    const receipt = await tx.wait();
    console.log('✅ Policy created!');

  } catch (error) {
    console.error('Error:', error.message);
    if (error.data) {
      console.log('Error data:', error.data);
    }
  }
})();
