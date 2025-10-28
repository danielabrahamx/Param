const { ethers } = require('ethers');
require('dotenv').config();

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);

async function main() {
  const currentBlock = await provider.getBlockNumber();
  const policyBlock = 26764877;
  const fromBlock = Math.max(0, currentBlock - 5000);
  
  console.log('Current Block:', currentBlock);
  console.log('Policy Block:', policyBlock);
  console.log('Sync From Block:', fromBlock);
  console.log('Sync To Block:', currentBlock);
  console.log('');
  
  if (policyBlock >= fromBlock && policyBlock <= currentBlock) {
    console.log('✅ Policy block is IN sync range');
  } else {
    console.log('❌ Policy block is OUT of sync range');
    console.log('   Difference:', currentBlock - policyBlock, 'blocks');
  }
}

main().catch(console.error);
