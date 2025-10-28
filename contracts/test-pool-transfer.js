const { ethers } = require('ethers');
require('dotenv').config();

async function testPoolTransfer() {
  const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
  const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  
  console.log('=== TESTING POOL TRANSFER LOGIC ===\n');

  const poolAddress = process.env.POOL_ADDRESS;
  const PoolABI = require('./artifacts/contracts/InsurancePool.sol/InsurancePool.json').abi;
  const pool = new ethers.Contract(poolAddress, PoolABI, provider);

  // Get pool balance
  const balance = await provider.getBalance(poolAddress);
  console.log('Pool balance (raw from RPC):', balance.toString());
  console.log('Pool balance (as number):', Number(balance));
  console.log('Pool balance (HBAR if tinybar):', Number(balance) / 1e8);
  console.log('Pool balance (HBAR if wei):', ethers.formatEther(balance));
  console.log('');

  // Try calling getBalance from contract (if it exists)
  try {
    const contractBalance = await pool.getBalance();
    console.log('Pool.getBalance() returns:', contractBalance.toString());
    console.log('Formatted:', ethers.formatEther(contractBalance));
  } catch (error) {
    console.log('getBalance() not available');
  }

  console.log('\n=== TRANSFER TEST ===\n');
  
  // To transfer 5 HBAR, we need to know:
  // If balance is 10000000000 (tinybar), that's 100 HBAR
  // To transfer 5 HBAR = 500000000 tinybar
  
  const coverageWei = ethers.parseEther('5');
  console.log('Coverage in wei:', coverageWei.toString());
  console.log('Coverage as 5 HBAR (if sent as-is):', ethers.formatEther(coverageWei));
  
  const coverageTinybar = coverageWei / BigInt(10n ** 10n);
  console.log('Coverage converted to tinybar:', coverageTinybar.toString());
  console.log('Coverage in tinybar as HBAR:', Number(coverageTinybar) / 1e8);
  
  console.log('\nPoolBalance comparison:');
  console.log('Pool has:', balance.toString());
  console.log('Need (tinybar):', coverageTinybar.toString());
  console.log('Has enough?', balance >= coverageTinybar);
}

testPoolTransfer().catch(console.error);
