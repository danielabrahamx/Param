const { ethers } = require('ethers');
require('dotenv').config();

async function checkPoolBalance() {
  const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
  const poolAddress = process.env.POOL_ADDRESS;

  console.log('=== POOL BALANCE CHECK ===\n');
  console.log('Pool Address:', poolAddress);
  console.log('');

  const balanceWei = await provider.getBalance(poolAddress);
  
  console.log('Balance (raw wei):', balanceWei.toString());
  console.log('Balance (tinybar units):', Number(balanceWei));
  console.log('Balance (using formatEther):', ethers.formatEther(balanceWei), 'HBAR');
  console.log('');

  // The correct way to display Hedera balance
  console.log('Correct interpretation:');
  if (Number(balanceWei) >= 1e8) {
    const hbarAmount = Number(balanceWei) / 1e8;
    console.log('Balance:', hbarAmount, 'HBAR');
  } else {
    console.log('Balance is less than 1 HBAR');
  }
}

checkPoolBalance().catch(console.error);
