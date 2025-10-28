const hre = require('hardhat');
const readline = require('readline');

async function main() {
  const { ethers } = hre;
  const [deployer] = await ethers.getSigners();
  
  // Get pool address from environment
  const poolAddress = process.env.POOL_ADDRESS;
  
  if (!poolAddress) {
    console.error('❌ POOL_ADDRESS not set in .env file');
    process.exit(1);
  }
  
  console.log('\n💰 POOL FUNDING TOOL');
  console.log('===================\n');
  console.log('Admin Wallet:', deployer.address);
  
  // Check admin balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log('Admin Balance:', ethers.formatEther(balance), 'HBAR\n');
  
  // Get pool contract
  const poolAbi = [
    "function deposit() external payable",
    "function totalBalance() view returns (uint256)",
    "function getBalance() view returns (uint256)"
  ];
  
  const pool = new ethers.Contract(poolAddress, poolAbi, deployer);
  
  // Get current pool stats
  try {
    const balance = await pool.getBalance();
    
    console.log('📊 CURRENT POOL STATUS:');
    console.log('Pool Address:', poolAddress);
    console.log('Pool Balance:', ethers.formatEther(balance), 'HBAR\n');
  } catch (error) {
    console.log('⚠️  Could not fetch pool stats (contract may not be deployed yet)\n');
  }
  
  // Get amount from command line or prompt
  const args = process.argv.slice(2);
  let amount;
  
  if (args.length > 0) {
    amount = args[0];
  } else {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    amount = await new Promise((resolve) => {
      rl.question('Enter amount to deposit (in HBAR): ', (answer) => {
        rl.close();
        resolve(answer);
      });
    });
  }
  
  const amountFloat = parseFloat(amount);
  
  if (isNaN(amountFloat) || amountFloat <= 0) {
    console.error('❌ Invalid amount');
    process.exit(1);
  }
  
  // Check if admin has enough balance
  if (balance < ethers.parseEther(amount)) {
    console.error(`❌ Insufficient balance. You have ${ethers.formatEther(balance)} HBAR but trying to deposit ${amount} HBAR`);
    process.exit(1);
  }
  
  console.log(`\n💸 Depositing ${amount} HBAR to pool...`);
  
  try {
    const tx = await pool.deposit({ value: ethers.parseEther(amount) });
    console.log('Transaction submitted:', tx.hash);
    
    const receipt = await tx.wait();
    console.log('✅ Transaction confirmed!');
    console.log('Block:', receipt.blockNumber);
    console.log('Gas used:', receipt.gasUsed.toString());
    
    // Get updated pool stats
    const newBalance = await pool.getBalance();
    
    console.log('\n📊 UPDATED POOL STATUS:');
    console.log('Pool Balance:', ethers.formatEther(newBalance), 'HBAR');
    console.log('\n💡 Pool can now fund policies up to:', ethers.formatEther(newBalance), 'HBAR total coverage');
    
  } catch (error) {
    console.error('❌ Deposit failed:', error.message);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
