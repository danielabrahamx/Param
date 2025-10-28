const { ethers } = require('ethers');
require('dotenv').config();

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);

const InsurancePoolABI = require('./artifacts/contracts/InsurancePool.sol/InsurancePool.json').abi;
const GovernanceABI = require('./artifacts/contracts/GovernanceContract.sol/GovernanceContract.json').abi;

(async () => {
  try {
    const poolAddress = process.env.POOL_ADDRESS;
    const governanceAddress = process.env.GOVERNANCE_ADDRESS;

    console.log('Checking contract state...\n');

    const pool = new ethers.Contract(poolAddress, InsurancePoolABI, provider);
    const governance = new ethers.Contract(governanceAddress, GovernanceABI, provider);

    // Check pool state
    const poolBalance = await provider.getBalance(poolAddress);
    const policyFactory = await pool.policyFactory();
    
    console.log('Pool:');
    console.log('  Balance:', ethers.formatEther(poolBalance), 'HBAR');
    console.log('  policyFactory:', policyFactory);

    // Check governance
    const premiumRate = await governance.premiumRate();
    const floodThreshold = await governance.floodThreshold();
    const paused = await governance.paused();

    console.log('\nGovernance:');
    console.log('  premiumRate:', premiumRate.toString(), '%');
    console.log('  floodThreshold:', floodThreshold.toString());
    console.log('  paused:', paused);

  } catch (error) {
    console.error('Error:', error.message);
  }
})();
