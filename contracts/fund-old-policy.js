const { ethers } = require('ethers');
require('dotenv').config();

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

const InsurancePoolABI = require('./artifacts/contracts/InsurancePool.sol/InsurancePool.json').abi;

(async () => {
  try {
    const poolAddress = process.env.POOL_ADDRESS;
    const oldPolicyAddress = '0x22a6BE94f7B71F47375e8f7D239B54F44A7a5bFD';
    const coverageAmount = ethers.parseEther('3'); // 3 HBAR

    console.log('Funding old policy retroactively...');
    console.log('Pool:', poolAddress);
    console.log('Old Policy:', oldPolicyAddress);
    console.log('Coverage:', ethers.formatEther(coverageAmount), 'HBAR\n');

    const pool = new ethers.Contract(poolAddress, InsurancePoolABI, signer);

    // Call fundPolicy directly (only owner can call it)
    const tx = await pool.fundPolicy(oldPolicyAddress, coverageAmount, {
      gasLimit: 200000,
    });

    console.log('Transaction sent:', tx.hash);
    const receipt = await tx.wait();
    console.log('✅ Transaction confirmed!');

    // Verify policy now has funds
    const balance = await provider.getBalance(oldPolicyAddress);
    console.log('\n📊 Old Policy Balance:', ethers.formatEther(balance), 'HBAR');
    console.log(ethers.formatEther(balance) === '3.0' ? '✅ SUCCESS!' : '⚠️ Balance mismatch');

  } catch (error) {
    console.error('Error:', error.message);
    if (error.data) {
      console.error('Details:', error.data);
    }
  }
})();
