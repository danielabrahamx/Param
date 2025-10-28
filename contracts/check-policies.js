const { ethers } = require('ethers');
require('dotenv').config();

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);

const factoryAbi = [
  'function getAllPolicies() external view returns (address[])',
  'event PolicyCreated(address indexed policyAddress, address indexed policyholder, uint256 coverageAmount, uint256 premium)'
];

const policyAbi = [
  'function policyholder() external view returns (address)',
  'function coverage() external view returns (uint256)',
  'function premium() external view returns (uint256)'
];

async function main() {
  try {
    console.log('PolicyFactory Address:', process.env.POLICY_FACTORY_ADDRESS);
    console.log('');

    const factory = new ethers.Contract(
      process.env.POLICY_FACTORY_ADDRESS,
      factoryAbi,
      provider
    );

    const policies = await factory.getAllPolicies();
    console.log('Total policies:', policies.length);
    console.log('');

    for (let i = 0; i < policies.length; i++) {
      const policyAddress = policies[i];
      console.log(`Policy ${i + 1}: ${policyAddress}`);
      
      const policy = new ethers.Contract(policyAddress, policyAbi, provider);
      const policyholder = await policy.policyholder();
      const coverage = await policy.coverage();
      const premium = await policy.premium();
      const balance = await provider.getBalance(policyAddress);

      console.log('  Policyholder:', policyholder);
      console.log('  Coverage:', ethers.formatEther(coverage), 'HBAR');
      console.log('  Premium:', ethers.formatEther(premium), 'HBAR');
      console.log('  Balance:', ethers.formatEther(balance), 'HBAR');
      console.log('');
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

main();
