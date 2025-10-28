const { ethers } = require('ethers');
require('dotenv').config();

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

const InsurancePoolABI = require('./artifacts/contracts/InsurancePool.sol/InsurancePool.json').abi;

(async () => {
  try {
    const poolAddress = process.env.POOL_ADDRESS;
    // HEDERA USES 8 DECIMALS (tinybar), not 18 (wei)
    // Send 100 HBAR = 100 * 10^8 tinybar
    const depositAmount = ethers.parseUnits('100', 8); // 100 tinybar units

    console.log('Funding new pool with 100 HBAR...');
    console.log('Pool:', poolAddress);
    console.log('Amount (tinybar):', depositAmount.toString());
    console.log('Amount (HBAR):', Number(depositAmount) / 1e8, 'HBAR\n');

    const pool = new ethers.Contract(poolAddress, InsurancePoolABI, signer);

    // Call deposit()
    const tx = await pool.deposit({
      value: depositAmount,
      gasLimit: 200000,
    });

    console.log('Transaction sent:', tx.hash);
    const receipt = await tx.wait();
    console.log('✅ Pool funded!');
    console.log('Block:', receipt.blockNumber);

    // Check balance
    const balance = await provider.getBalance(poolAddress);
    console.log('\n📊 Pool Balance:', ethers.formatEther(balance), 'HBAR');

  } catch (error) {
    console.error('Error:', error.message);
  }
})();
