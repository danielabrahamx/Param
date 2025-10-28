const { ethers } = require('ethers');
require('dotenv').config();

async function diagnoseExactProblem() {
  const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
  const poolAddress = process.env.POOL_ADDRESS;
  const policyAddress = '0x79ba31081D84eB669EF9052819822756b933942d';

  console.log('=== HEDERA DECIMAL HANDLING DIAGNOSIS ===\n');

  // Get pool balance
  const balanceWei = await provider.getBalance(poolAddress);
  console.log('Pool Balance (reported in wei by RPC):', balanceWei.toString());
  console.log('Pool Balance (formatted as HBAR):', ethers.formatEther(balanceWei));
  console.log('Pool Balance (raw):', Number(balanceWei));
  console.log('');

  // Get policy balance
  const policyBalanceWei = await provider.getBalance(policyAddress);
  console.log('Policy Balance (reported in wei by RPC):', policyBalanceWei.toString());
  console.log('Policy Balance (formatted as HBAR):', ethers.formatEther(policyBalanceWei));
  console.log('');

  console.log('=== UNDERSTANDING THE TRANSFER ===\n');

  // When fundPolicy does: transfer(coverageAmountTinybar)
  // where coverageAmountTinybar = 5*10^18 / 10^10 = 5*10^8
  
  const coverageWei = ethers.parseEther('5'); // 5 * 10^18 wei (from JS side)
  console.log('Coverage amount from JS side (wei):', coverageWei.toString());
  
  const coverageAmountTinybar = coverageWei / BigInt(10**10); // What the contract calculates
  console.log('Coverage converted to tinybar in contract:', coverageAmountTinybar.toString());
  console.log('This equals (tinybar):', Number(coverageAmountTinybar), 'tinybar');
  console.log('This equals (HBAR):', Number(coverageAmountTinybar) / 1e8, 'HBAR');
  console.log('');

  console.log('=== THE ACTUAL TRANSFER ===\n');
  console.log('When Solidity does: policyAddress.transfer(500000000)');
  console.log('This sends 500000000 wei to the policy');
  console.log('BUT Hedera converts this from wei to tinybar:');
  console.log('500000000 wei / 10^10 = 0.00000005 HBAR ← THIS IS THE BUG!\n');

  console.log('=== WHAT SHOULD HAPPEN ===\n');
  console.log('To send 5 HBAR, we need to send 5 * 10^8 = 500000000 tinybar');
  console.log('In wei terms (how RPC sees it): 500000000 * 10^10 = 5000000000000000000 wei');
  console.log('So the contract should do: transfer(coverageAmount) not transfer(coverageAmount / 10^10)\n');

  console.log('=== THE FIX ===\n');
  console.log('Option 1: Change fundPolicy to NOT divide by 10^10');
  console.log('  - transfer(coverageAmount) directly');
  console.log('  - Hedera RPC converts wei→tinybar automatically\n');

  console.log('Option 2: Multiply by 10^10 instead of dividing');
  console.log('  - transfer(coverageAmount * 10^10)');
  console.log('  - But this seems wrong for the amount\n');

  console.log('CORRECT SOLUTION:');
  console.log('The contract receives coverageAmount in wei (5*10^18)');
  console.log('Hedera RPC automatically converts this to tinybar for balance checks');
  console.log('So fundPolicy should send the FULL wei amount, not convert it!');
}

diagnoseExactProblem().catch(console.error);
