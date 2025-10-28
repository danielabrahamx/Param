const { ethers } = require('ethers');
require('dotenv').config();

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);

(async () => {
  try {
    const policyAddress = '0x22a6BE94f7B71F47375e8f7D239B54F44A7a5bFD';
    const poolAddress = process.env.POOL_ADDRESS;

    console.log('=== Checking Balances ===\n');

    // Check policy
    const policyBalance = await provider.getBalance(policyAddress);
    console.log('Policy Contract (0x22a6BE94f7B71F47375e8f7D239B54F44A7a5bFD):');
    console.log('  Balance (wei):', policyBalance.toString());
    console.log('  Balance (HBAR):', (Number(policyBalance) / 1e18).toString());

    // Check pool
    const poolBalance = await provider.getBalance(poolAddress);
    console.log('\nPool Contract (' + poolAddress + '):');
    console.log('  Balance (wei):', poolBalance.toString());
    console.log('  Balance (HBAR):', (Number(poolBalance) / 1e18).toString());

    // Check account
    const account = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';
    const accountBalance = await provider.getBalance(account);
    console.log('\nYour Account (' + account + '):');
    console.log('  Balance (wei):', accountBalance.toString());
    console.log('  Balance (HBAR):', (Number(accountBalance) / 1e18).toString());

    console.log('\n=== Analysis ===');
    console.log('Policy should have 3 HBAR but has:', (Number(policyBalance) / 1e18));
    console.log('Issue: fundPolicy() was not executed OR transfer failed silently');

  } catch (error) {
    console.error('Error:', error.message);
  }
})();
