const { ethers } = require('ethers');
require('dotenv').config();

async function diagnoseTransaction() {
  const provider = new ethers.JsonRpcProvider(process.env.HEDERA_TESTNET_RPC);
  const privateKey = process.env.PRIVATE_KEY;
  const wallet = new ethers.Wallet(privateKey, provider);

  const policyFactoryAddress = process.env.POLICY_FACTORY_ADDRESS;
  const poolAddress = process.env.POOL_ADDRESS;
  const governanceAddress = process.env.GOVERNANCE_ADDRESS;

  if (!policyFactoryAddress || !poolAddress || !governanceAddress) {
    console.error('❌ Missing contract addresses in .env');
    return;
  }

  console.log('\n📊 TRANSACTION FLOW DIAGNOSIS');
  console.log('============================\n');

  // 1. Check pool balance
  const poolBalance = await provider.getBalance(poolAddress);
  console.log(`Pool Balance: ${poolBalance.toString()} (raw tinybar)`);
  console.log(`Pool Balance: ${ethers.formatEther(poolBalance)} (wei format)`);
  console.log(`Pool Balance: ${poolBalance / 100000000n} HBAR (actual tinybar)\n`);

  // 2. Load contracts and check governance
  const PolicyFactoryABI = [
    'function createPolicy(uint256 _coverage) external payable returns (address)',
  ];
  const GovernanceABI = [
    'function premiumRate() external view returns (uint256)',
  ];
  const PoolABI = [
    'function getBalance() external view returns (uint256)',
    'function fundPolicy(address payable policyAddress, uint256 coverageAmount) external',
  ];

  const governance = new ethers.Contract(governanceAddress, GovernanceABI, provider);
  const pool = new ethers.Contract(poolAddress, PoolABI, provider);

  const premiumRate = await governance.premiumRate();
  console.log(`Governance Premium Rate: ${premiumRate.toString()}%\n`);

  const getBalanceResult = await pool.getBalance();
  console.log(`Pool.getBalance() returns: ${getBalanceResult.toString()} (wei, already converted)`);
  console.log(`Pool.getBalance() formatted: ${ethers.formatEther(getBalanceResult)} HBAR\n`);

  // 3. Simulate transaction parameters
  const coverageHBAR = '10'; // User wants 10 HBAR coverage
  const coverageWei = ethers.parseEther(coverageHBAR); // 10 * 10^18
  const premiumWei = (coverageWei * BigInt(premiumRate)) / 100n;

  console.log('SIMULATED USER ACTION:');
  console.log(`Coverage: ${coverageHBAR} HBAR`);
  console.log(`Coverage in Wei: ${coverageWei.toString()}`);
  console.log(`Premium Rate: ${premiumRate.toString()}%`);
  console.log(`Premium in Wei: ${premiumWei.toString()}`);
  console.log(`Premium in HBAR: ${ethers.formatEther(premiumWei)}\n`);

  // 4. Analyze fundPolicy check
  console.log('FUNDPOLICY CHECK ANALYSIS:');
  console.log(`address(this).balance (tinybar): ${poolBalance.toString()}`);
  console.log(`coverageAmount (wei from frontend): ${coverageWei.toString()}`);
  console.log(`Check: ${poolBalance} >= ${coverageWei}?`);
  console.log(`Result: ${poolBalance >= coverageWei ? '✅ PASS' : '❌ FAIL'}\n`);

  // 5. Show the fix
  console.log('DIAGNOSIS:');
  console.log('The fundPolicy function receives coverageAmount in 18-decimal wei format');
  console.log('But address(this).balance is in 8-decimal tinybar format');
  console.log('The check fails because tinybar values are ~10^10 smaller than wei values\n');

  console.log('SOLUTION:');
  console.log('fundPolicy must divide coverageAmount by 10^10 to convert wei to tinybar');
  console.log('Example: require(address(this).balance >= coverageAmount / 10**10, ...)\n');
}

diagnoseTransaction().catch(console.error);
