const { ethers } = require('ethers');
require('dotenv').config();

const poolAddress = process.env.POOL_ADDRESS;
const factoryAddress = process.env.POLICY_FACTORY_ADDRESS;
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);

const poolAbi = [
  'function policyFactory() external view returns (address)',
  'function availableBalance() external view returns (uint256)',
];

async function checkPool() {
  console.log('=== CHECKING INSURANCE POOL STATE ===\n');
  console.log('Pool Address:', poolAddress);
  console.log('Factory Address:', factoryAddress);
  console.log('');

  const pool = new ethers.Contract(poolAddress, poolAbi, provider);

  try {
    const policyFactory = await pool.policyFactory();
    const balance = await provider.getBalance(poolAddress);
    
    console.log('Pool.policyFactory:', policyFactory);
    console.log('Expected:', factoryAddress);
    console.log('');

    if (policyFactory.toLowerCase() === factoryAddress.toLowerCase()) {
      console.log('✅ policyFactory IS correctly set');
    } else {
      console.log('❌ ERROR: policyFactory is NOT set to factory address!');
      console.log('   This means pool.fundPolicy() will fail authorization!');
    }

    console.log('');
    console.log('Pool Balance:', ethers.formatEther(balance), 'HBAR');

  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkPool().catch(console.error);
