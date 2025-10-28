const { ethers } = require('ethers');
require('dotenv').config();

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

const IndividualPolicyABI = require('./artifacts/contracts/IndividualPolicy.sol/IndividualPolicy.json').abi;
const InsurancePoolABI = require('./artifacts/contracts/InsurancePool.sol/InsurancePool.json').abi;

(async () => {
  try {
    const policyAddress = '0x22a6BE94f7B71F47375e8f7D239B54F44A7a5bFD';
    const poolAddress = process.env.POOL_ADDRESS;
    const userAccount = signer.address;

    console.log('=== FULL PAYOUT FLOW TEST ===\n');

    // Step 1: Check initial balances
    console.log('Step 1: Check Initial State');
    console.log('-'.repeat(40));

    const policyBalance = await provider.getBalance(policyAddress);
    const userBalance = await provider.getBalance(userAccount);
    const poolBalance = await provider.getBalance(poolAddress);

    console.log('Policy Balance:', ethers.formatEther(policyBalance), 'HBAR');
    console.log('User Balance:', ethers.formatEther(userBalance), 'HBAR');
    console.log('Pool Balance:', ethers.formatEther(poolBalance), 'HBAR\n');

    // Step 2: Verify policy is properly funded
    console.log('Step 2: Verify Policy Contract State');
    console.log('-'.repeat(40));

    const policy = new ethers.Contract(policyAddress, IndividualPolicyABI, signer);
    const coverage = await policy.coverage();
    const payoutTriggered = await policy.payoutTriggered();

    console.log('Policy Coverage (wei):', coverage.toString());
    console.log('Coverage (HBAR):', ethers.formatEther(coverage), 'HBAR');
    console.log('Payout Triggered:', payoutTriggered);
    console.log('Policy Balance:', ethers.formatEther(policyBalance), 'HBAR');
    console.log('Ready for payout:', policyBalance > 0n ? '✅ YES' : '❌ NO\n');

    if (policyBalance === 0n) {
      console.log('❌ ERROR: Policy contract has 0 HBAR!');
      console.log('Cannot trigger payout without funds.');
      process.exit(1);
    }

    console.log('\nStep 3: Trigger Payout');
    console.log('-'.repeat(40));

    const balanceBefore = await provider.getBalance(userAccount);
    console.log('Your balance before payout:', ethers.formatEther(balanceBefore), 'HBAR');

    const tx = await policy.triggerPayout({
      gasLimit: 300000,
    });

    console.log('Transaction sent:', tx.hash);
    const receipt = await tx.wait();
    console.log('✅ Payout triggered!');

    // Step 4: Verify payout success
    await provider.waitForBlock(receipt.blockNumber + 1);
    
    const balanceAfter = await provider.getBalance(userAccount);
    const policyBalanceAfter = await provider.getBalance(policyAddress);
    const payoutTriggeredAfter = await policy.payoutTriggered();

    console.log('\nStep 4: Verify Payout Completed');
    console.log('-'.repeat(40));
    console.log('Your balance after payout:', ethers.formatEther(balanceAfter), 'HBAR');
    console.log('Policy balance after payout:', ethers.formatEther(policyBalanceAfter), 'HBAR');
    console.log('Payout Triggered flag:', payoutTriggeredAfter);

    const amountReceived = balanceAfter - balanceBefore;
    console.log('\n✅ PAYOUT SUCCESSFUL!');
    console.log('Amount received:', ethers.formatEther(amountReceived), 'HBAR');

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.data) {
      console.error('Details:', error.data);
    }
    process.exit(1);
  }
})();
