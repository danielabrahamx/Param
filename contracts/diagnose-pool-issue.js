const { ethers } = require('ethers');
require('dotenv').config();

async function diagnosePoolIssue() {
  const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
  
  console.log('=== DIAGNOSING POOL ISSUE ===\n');

  const newPoolAddress = '0xa9093D6A8be226380f61eCd8B464E176C80695FC';
  const oldPoolAddress = '0x5b58e4D1AeA72012e76b2f6dA1d9b800EC80f67B';

  // Check new pool
  const newBalance = await provider.getBalance(newPoolAddress);
  console.log('NEW POOL (0xa9093D6A8be226380f61eCd8B464E176C80695FC):');
  console.log('  Raw balance:', newBalance.toString());
  console.log('  In tinybar:', Number(newBalance));
  console.log('  In HBAR:', Number(newBalance) / 1e8);
  console.log('');

  // Check old pool
  const oldBalance = await provider.getBalance(oldPoolAddress);
  console.log('OLD POOL (0x5b58e4D1AeA72012e76b2f6dA1d9b800EC80f67B):');
  console.log('  Raw balance:', oldBalance.toString());
  console.log('  In tinybar:', Number(oldBalance));
  console.log('  In HBAR:', Number(oldBalance) / 1e8);
  console.log('');

  console.log('ISSUE ANALYSIS:');
  if (Number(newBalance) === 10000000000) {
    console.log('✅ New pool has exactly 100 HBAR (10000000000 tinybar)');
  } else if (Number(newBalance) < 1e8) {
    console.log('❌ New pool balance is less than 1 HBAR - PROBLEM!');
    console.log('   This explains why frontend shows 0.0000001 HBAR');
  }
}

diagnosePoolIssue().catch(console.error);
