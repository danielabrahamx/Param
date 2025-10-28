const { ethers } = require('ethers');
require('dotenv').config();

const policyAddress = '0x79ba31081D84eB669EF9052819822756b933942d';
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);

const policyAbi = [
  'function policyholder() external view returns (address)',
  'function coverage() external view returns (uint256)',
  'function premium() external view returns (uint256)',
  'function payoutTriggered() external view returns (bool)',
];

async function diagnoseDecimals() {
  console.log('=== DECIMAL DIAGNOSIS ===\n');

  const policy = new ethers.Contract(policyAddress, policyAbi, provider);
  const coverage = await policy.coverage();

  console.log('Coverage (raw):', coverage.toString());
  console.log('Coverage (wei):', ethers.formatEther(coverage));
  console.log('');

  // What the pool should transfer
  const coverageWei = coverage;
  const coverageTinybar = coverageWei / BigInt(10 ** 10);
  console.log('Pool should transfer (tinybar):', coverageTinybar.toString());
  console.log('Pool should transfer (HBAR):', Number(coverageTinybar) / 1e8);
  console.log('');

  // Check actual pool balance
  const poolBalance = await provider.getBalance(process.env.POOL_ADDRESS);
  const poolBalanceHbar = Number(poolBalance) / 1e8;
  console.log('Actual Pool Balance (tinybar):', poolBalance.toString());
  console.log('Actual Pool Balance (HBAR):', poolBalanceHbar);
  console.log('');

  if (Number(coverageTinybar) > Number(poolBalance)) {
    console.log('❌ POOL DOES NOT HAVE ENOUGH TINYBAR!');
    console.log('   Coverage needed:', coverageTinybar.toString(), 'tinybar');
    console.log('   Pool has:', poolBalance.toString(), 'tinybar');
  } else {
    console.log('✅ Pool has enough balance');
  }
}

diagnoseDecimals().catch(console.error);
