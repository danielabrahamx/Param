const { ethers } = require('ethers');
require('dotenv').config();

async function findPolicyEvents() {
  const rpcUrl = process.env.RPC_URL || 'https://testnet.hashio.io/api';
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const policyFactoryAddress = process.env.POLICY_FACTORY_ADDRESS;

  console.log('RPC URL:', rpcUrl);
  console.log('PolicyFactory Address:', policyFactoryAddress);

  const policyFactoryAbi = [
    'event PolicyCreated(address indexed policyAddress, uint256 coverage, uint256 premium, address indexed policyholder)',
  ];

  const contract = new ethers.Contract(policyFactoryAddress, policyFactoryAbi, provider);

  // Get current block
  const currentBlock = await provider.getBlockNumber();
  console.log(`Current block: ${currentBlock}\n`);

  // Search with a larger range - go back 5000 blocks
  const fromBlock = Math.max(0, currentBlock - 5000);
  console.log(`Searching for PolicyCreated events from block ${fromBlock} to ${currentBlock}...`);

  try {
    const events = await contract.queryFilter('PolicyCreated', fromBlock, currentBlock);
    console.log(`\nFound ${events.length} PolicyCreated events\n`);

    for (const event of events) {
      const eventLog = event;
      console.log('Event found:');
      console.log(`  Block: ${event.blockNumber}`);
      console.log(`  TxHash: ${event.transactionHash}`);
      console.log(`  Policy Address: ${eventLog.args?.[0]}`);
      console.log(`  Coverage (wei): ${eventLog.args?.[1]}`);
      console.log(`  Premium (wei): ${eventLog.args?.[2]}`);
      console.log(`  Policyholder: ${eventLog.args?.[3]}`);
      console.log('');
    }
  } catch (error) {
    console.error('Error querying events:', error);
  }
}

findPolicyEvents();
