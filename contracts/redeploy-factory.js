const { ethers } = require('ethers');
require('dotenv').config();

async function redeployPolicyFactory() {
  const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
  const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  
  console.log('=== REDEPLOYING POLICYFACTORY ===\n');
  console.log('Deployer:', await signer.getAddress());
  console.log('Oracle:', process.env.ORACLE_ADDRESS);
  console.log('Governance:', process.env.GOVERNANCE_ADDRESS);
  console.log('Pool:', process.env.POOL_ADDRESS);
  console.log('');

  // Get the contract artifact
  const PolicyFactory = require('./artifacts/contracts/PolicyFactory.sol/PolicyFactory.json');
  
  // Create factory and deploy
  const factory = new ethers.ContractFactory(PolicyFactory.abi, PolicyFactory.bytecode, signer);
  
  console.log('Deploying contract...');
  const policyFactory = await factory.deploy(
    process.env.ORACLE_ADDRESS,
    process.env.GOVERNANCE_ADDRESS,
    process.env.POOL_ADDRESS,
    {
      gasLimit: 1000000,
    }
  );
  
  console.log('Contract deployed to:', policyFactory.target);
  console.log('Waiting for confirmation...\n');
  
  // Wait for deployment
  const receipt = await policyFactory.deploymentTransaction().wait();
  console.log('✅ Deployment confirmed at block:', receipt.blockNumber);
  console.log('Transaction hash:', receipt.hash);
  console.log('');

  console.log('🎯 NEW POLICYFACTORY ADDRESS:', policyFactory.target);
  console.log('');

  return policyFactory.target;
}

redeployPolicyFactory()
  .then(address => {
    console.log('Redeployment successful! New factory:', address);
    console.log('Now update:');
    console.log('  - contracts/.env POLICY_FACTORY_ADDRESS=' + address);
    console.log('  - backend/.env POLICY_FACTORY_ADDRESS=' + address);
    console.log('  - frontend/.env.local VITE_POLICY_FACTORY_ADDRESS=' + address);
    process.exit(0);
  })
  .catch(error => {
    console.error('Redeployment failed:', error.message);
    process.exit(1);
  });
