const { ethers } = require('ethers');
require('dotenv').config();

const txHash = '0x4d9346531ac682ee603e1ef08c0008a3c6a601c7929682f1734b9d6190f1b906';
const userWallet = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);

async function diagnose() {
  console.log('=== PAYOUT TRANSACTION DIAGNOSIS ===\n');
  console.log('Transaction Hash:', txHash);
  console.log('User Wallet:', userWallet);
  console.log('');

  try {
    // Get transaction details
    const tx = await provider.getTransaction(txHash);
    console.log('✅ Transaction found on-chain');
    console.log('From:', tx.from);
    console.log('To:', tx.to);
    console.log('Value (wei):', tx.value.toString());
    console.log('Value (HBAR):', ethers.formatEther(tx.value));
    console.log('Block:', tx.blockNumber);
    console.log('');

    // Get receipt
    const receipt = await provider.getTransactionReceipt(txHash);
    if (!receipt) {
      console.log('⏳ Receipt not available yet');
      return;
    }

    console.log('Receipt Status:', receipt.status === 1 ? '✅ SUCCESS' : '❌ FAILED');
    console.log('Gas Used:', receipt.gasUsed.toString());
    console.log('');

    // Decode transaction data
    console.log('Transaction Data:', tx.data?.slice(0, 10) + '...');
    console.log('');

    // Check logs
    if (receipt.logs && receipt.logs.length > 0) {
      console.log('Events Generated:', receipt.logs.length);
      receipt.logs.forEach((log, i) => {
        console.log(`\nLog ${i + 1}:`);
        console.log('  From:', log.address);
        console.log('  Topics:', log.topics.length);
      });
    } else {
      console.log('⚠️ No events generated');
    }

    // Check if user received funds
    console.log('\n=== CHECKING WALLET STATE ===\n');
    const userBalance = await provider.getBalance(userWallet);
    console.log('Wallet Balance:', ethers.formatEther(userBalance), 'HBAR');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

diagnose().catch(console.error);
