const { ethers } = require('ethers');
require('dotenv').config();

async function traceTransaction() {
  const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
  const txHash = '0x4d9346531ac682ee603e1ef08c0008a3c6a601c7929682f1734b9d6190f1b906';
  
  console.log('=== TRACING POLICY CREATION TRANSACTION ===\n');

  // Get the creation transaction for the policy (not the payout)
  // The policy address is 0x79ba31081D84eB669EF9052819822756b933942d
  // Let's find when it was created

  const policyAddress = '0x79ba31081D84eB669EF9052819822756b933942d';
  
  // Try to get the code at this address
  const code = await provider.getCode(policyAddress);
  if (code === '0x') {
    console.log('❌ Policy address has no code - not a contract!');
    return;
  }

  console.log('✅ Policy is a valid contract');
  console.log('');

  // Get transaction receipt for the payout
  const receipt = await provider.getTransactionReceipt(txHash);
  
  console.log('Payout Transaction Status:', receipt.status === 1 ? '✅ SUCCESS' : '❌ FAILED');
  console.log('Gas Used:', receipt.gasUsed.toString());
  console.log('');

  // Check if there were any calls to the pool.fundPolicy during POLICY CREATION
  // We need to find the PolicyCreated event

  const policyAbi = [
    'event PolicyCreated(address indexed policyAddress, uint256 coverage, uint256 premium, address indexed policyholder)',
  ];

  const factoryAbi = ['event PolicyCreated(address indexed policyAddress, uint256 coverage, uint256 premium, address indexed policyholder)'];
  const factory = new ethers.Contract(process.env.POLICY_FACTORY_ADDRESS, factoryAbi, provider);

  // Find when this policy was created
  const currentBlock = await provider.getBlockNumber();
  const fromBlock = Math.max(0, currentBlock - 261120); // 7 days

  console.log('Searching for PolicyCreated event for', policyAddress);
  console.log('From block:', fromBlock, 'to', currentBlock);
  console.log('');

  const events = await factory.queryFilter('PolicyCreated', fromBlock, currentBlock, {
    policyAddress: policyAddress,
  });

  if (events.length > 0) {
    const event = events[0];
    console.log('✅ PolicyCreated event found!');
    console.log('Block:', event.blockNumber);
    console.log('Policy Address:', event.args[0]);
    console.log('Coverage:', ethers.formatEther(event.args[1]), 'HBAR');
    console.log('Premium:', ethers.formatEther(event.args[2]), 'HBAR');
    console.log('Policyholder:', event.args[3]);
  } else {
    console.log('⚠️ No PolicyCreated event found for this address');
  }
}

traceTransaction().catch(console.error);
