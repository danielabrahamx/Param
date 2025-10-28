const { ethers } = require('ethers');
require('dotenv').config();

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

const InsurancePoolABI = require('./artifacts/contracts/InsurancePool.sol/InsurancePool.json').abi;

(async () => {
  try {
    const poolAddress = process.env.POOL_ADDRESS;
    const factoryAddress = process.env.POLICY_FACTORY_ADDRESS;

    console.log('Setting PolicyFactory on Pool...');
    console.log('Pool:', poolAddress);
    console.log('Factory:', factoryAddress);

    const pool = new ethers.Contract(poolAddress, InsurancePoolABI, signer);

    // Call setPolicyFactory
    const tx = await pool.setPolicyFactory(factoryAddress);
    console.log('Transaction sent:', tx.hash);

    const receipt = await tx.wait();
    console.log('✅ Transaction confirmed!');
    console.log('Block:', receipt.blockNumber);

    // Verify it was set
    const setFactory = await pool.policyFactory();
    console.log('\n✓ Pool policyFactory is now set to:', setFactory);

  } catch (error) {
    console.error('Error:', error.message);
  }
})();
