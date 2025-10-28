const { ethers } = require('ethers');
require('dotenv').config();

async function fundBrokenPolicy() {
  const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
  const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  
  const poolAddress = process.env.POOL_ADDRESS;
  const policyAddress = '0x79ba31081D84eB669EF9052819822756b933942d';
  const coverageAmount = ethers.parseEther('5'); // 5 HBAR in wei format
  
  console.log('=== MANUALLY FUNDING BROKEN POLICY ===\n');
  console.log('Pool:', poolAddress);
  console.log('Policy:', policyAddress);
  console.log('Coverage Amount:', ethers.formatEther(coverageAmount), 'HBAR');
  console.log('');

  const InsurancePoolABI = require('./artifacts/contracts/InsurancePool.sol/InsurancePool.json').abi;
  const pool = new ethers.Contract(poolAddress, InsurancePoolABI, signer);

  // Check pool balance first
  const poolBalance = await provider.getBalance(poolAddress);
  console.log('Pool Balance (tinybar):', poolBalance.toString());
  console.log('Pool Balance (HBAR):', Number(poolBalance) / 1e8);
  console.log('');

  // Check if pool has enough
  if (poolBalance < BigInt('500000000')) { // 5 HBAR = 5 * 10^8 tinybar
    console.log('❌ Pool does not have enough funds!');
    return;
  }

  console.log('Calling pool.fundPolicy()...');
  const tx = await pool.fundPolicy(policyAddress, coverageAmount, {
    gasLimit: 300000,
  });

  console.log('Transaction sent:', tx.hash);
  const receipt = await tx.wait();
  console.log('✅ Policy funded!');
  console.log('Block:', receipt.blockNumber);
  console.log('');

  // Check policy balance
  const policyBalance = await provider.getBalance(policyAddress);
  console.log('📊 Policy Balance (tinybar):', policyBalance.toString());
  console.log('📊 Policy Balance (HBAR):', Number(policyBalance) / 1e8);

  if (Number(policyBalance) >= 500000000) {
    console.log('✅ Policy successfully funded with 5 HBAR!');
  } else {
    console.log('⚠️ Warning: Policy balance is less than expected');
  }
}

fundBrokenPolicy().catch(error => {
  console.error('Error:', error.message);
  process.exit(1);
});
