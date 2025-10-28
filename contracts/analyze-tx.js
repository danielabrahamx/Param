const { ethers } = require('ethers');
require('dotenv').config();

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const txHash = '0xf548e357f59c26d31b65ac43a95eb29c7ecdc1238c20ae4dc7d543b0bb08dce9';

async function main() {
  console.log('=== ANALYZING TRANSACTION ===\n');
  
  const receipt = await provider.getTransactionReceipt(txHash);
  console.log('Transaction Confirmed:', receipt?.blockNumber);
  console.log('Status:', receipt?.status === 1 ? '✅ SUCCESS' : '❌ FAILED');
  console.log('Gas Used:', receipt?.gasUsed.toString());
  console.log('');

  if (receipt?.logs.length) {
    console.log('Events Generated:', receipt.logs.length);
    receipt.logs.forEach((log, i) => {
      console.log(`\nLog ${i + 1}:`);
      console.log('  Address:', log.address);
      console.log('  Topics:', log.topics.length);
      console.log('  Data:', log.data?.slice(0, 66) + '...');
    });
  }

  console.log('\n=== CHECKING FOR POLICY FROM THIS TRANSACTION ===\n');

  const policyFactoryAbi = [
    'event PolicyCreated(address indexed policyAddress, uint256 coverage, uint256 premium, address indexed policyholder)',
  ];
  
  const factory = new ethers.Contract(
    process.env.POLICY_FACTORY_ADDRESS,
    policyFactoryAbi,
    provider
  );

  const currentBlock = await provider.getBlockNumber();
  const searchBlock = receipt?.blockNumber || currentBlock;
  
  console.log('Searching for PolicyCreated events at block', searchBlock);
  const events = await factory.queryFilter('PolicyCreated', searchBlock, searchBlock + 10);
  
  console.log(`Found ${events.length} PolicyCreated events\n`);
  
  events.forEach((event) => {
    const policyAddress = event.args?.[0];
    const coverage = event.args?.[1];
    const premium = event.args?.[2];
    const policyholder = event.args?.[3];
    
    console.log('Policy Created:');
    console.log('  Address:', policyAddress);
    console.log('  Coverage:', ethers.formatEther(coverage), 'HBAR');
    console.log('  Premium:', ethers.formatEther(premium), 'HBAR');
    console.log('  Policyholder:', policyholder);
    console.log('  Tx Hash:', event.transactionHash);
    console.log('  Block:', event.blockNumber);
  });
}

main().catch(console.error);
