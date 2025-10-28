const { ethers } = require('ethers');
require('dotenv').config();

async function deployNewPool() {
  const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
  const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  
  console.log('=== DEPLOYING NEW INSURANCEPOOL CONTRACT ===\n');
  console.log('Deployer:', await signer.getAddress());
  console.log('');

  // Get the contract artifact
  const InsurancePool = require('./artifacts/contracts/InsurancePool.sol/InsurancePool.json');
  
  // Create factory and deploy
  const factory = new ethers.ContractFactory(InsurancePool.abi, InsurancePool.bytecode, signer);
  
  console.log('Deploying contract...');
  const pool = await factory.deploy({
    gasLimit: 1000000,
  });
  
  console.log('Contract deployed to:', pool.target);
  console.log('Waiting for confirmation...\n');
  
  // Wait for deployment
  const receipt = await pool.deploymentTransaction().wait();
  console.log('✅ Deployment confirmed at block:', receipt.blockNumber);
  console.log('Transaction hash:', receipt.hash);
  console.log('');

  console.log('🎯 NEW POOL ADDRESS:', pool.target);
  console.log('');
  console.log('Update your .env file:');
  console.log(`POOL_ADDRESS=${pool.target}`);
  console.log('');

  // Return the address for use in next steps
  return pool.target;
}

deployNewPool()
  .then(address => {
    console.log('Deployment successful! New pool:', address);
    process.exit(0);
  })
  .catch(error => {
    console.error('Deployment failed:', error.message);
    process.exit(1);
  });
