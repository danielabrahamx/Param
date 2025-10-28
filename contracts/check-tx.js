const { ethers } = require('ethers');
require('dotenv').config();

const txHash = '0xf548e357f59c26d31b65ac43a95eb29c7ecdc1238c20ae4dc7d543b0bb08dce9';
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL || 'https://testnet.hashio.io/api');

async function main() {
  console.log('=== TRANSACTION DIAGNOSTIC ===\n');
  console.log('Transaction Hash:', txHash);
  console.log('RPC URL:', process.env.RPC_URL);
  console.log('');

  try {
    const tx = await provider.getTransaction(txHash);
    if (tx) {
      console.log('✅ Transaction FOUND on-chain!');
      console.log('To:', tx.to);
      console.log('From:', tx.from);
      console.log('Block:', tx.blockNumber);
    } else {
      console.log('❌ Transaction NOT found on-chain!');
    }
  } catch (error) {
    console.log('❌ Transaction error:', error.message);
  }
}

main().catch(console.error);
