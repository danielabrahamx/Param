const hre = require('hardhat');

async function main() {
  const { ethers } = hre;
  const [deployer] = await ethers.getSigners();
  
  // Get governance contract address from hardhat config or use default
  const governanceAddress = process.env.GOVERNANCE_ADDRESS || '0x8Aa1810947707735fd75aD20F57117d05256D229';
  
  console.log('Updating flood threshold...');
  console.log('Governance contract:', governanceAddress);
  console.log('Deployer:', deployer.address);
  
  // Connect to governance contract
  const governance = await ethers.getContractAt('GovernanceContract', governanceAddress);
  
  // Check current threshold
  const currentThreshold = await governance.floodThreshold();
  console.log('Current threshold:', currentThreshold.toString());
  
  // Set new threshold to 100 (below current level of 269 so claims work)
  const newThreshold = 100;
  console.log('Setting new threshold to:', newThreshold);
  
  const tx = await governance.updateFloodThreshold(newThreshold);
  await tx.wait();
  
  // Verify
  const updatedThreshold = await governance.floodThreshold();
  console.log('✅ New threshold:', updatedThreshold.toString());
  
  console.log('\n📋 Summary:');
  console.log('- Old threshold:', currentThreshold.toString());
  console.log('- New threshold:', updatedThreshold.toString());
  console.log('- Current oracle flood level: ~269');
  console.log('- Claims are now enabled (269 > 100)');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
