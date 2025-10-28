const hre = require('hardhat');

async function diagnose() {
  console.log('🔍 Diagnosing PolicyFactory Transaction...\n');
  
  const provider = new hre.ethers.JsonRpcProvider('https://testnet.hashio.io/api');
  const factoryAddress = '0xe5fe644199256122B7DFc8ce80eacc9a2B5Ee78F'; // NEW DEPLOYMENT
  
  const factoryAbi = [
    'function createPolicy(uint256 _coverage) external returns (address)',
    'event PolicyCreated(address indexed policyAddress, uint256 coverage, uint256 premium, address indexed policyholder)'
  ];
  
  const factory = new hre.ethers.Contract(factoryAddress, factoryAbi, provider);
  
  // Try to estimate gas for the transaction
  const coverageAmount = hre.ethers.parseEther('10'); // 10 HBAR
  
  console.log('Transaction Parameters:');
  console.log('- Factory Address:', factoryAddress);
  console.log('- Coverage Amount:', hre.ethers.formatEther(coverageAmount), 'HBAR');
  console.log('- Coverage (wei):', coverageAmount.toString());
  console.log('');
  
  try {
    // This will fail without a signer, but might give us useful error info
    console.log('Attempting gas estimation...');
    const gasEstimate = await factory.createPolicy.estimateGas(coverageAmount);
    console.log('✅ Estimated Gas:', gasEstimate.toString());
  } catch (error) {
    console.error('❌ Gas Estimation Failed:');
    console.error('Error:', error.shortMessage || error.message);
    console.error('');
    console.error('Full Error:', error);
  }
}

diagnose().catch(console.error);
