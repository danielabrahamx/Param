const hre = require('hardhat');
require('dotenv').config();

async function main() {
  const { ethers } = hre;
  const [deployer] = await ethers.getSigners();
  
  console.log('Granting POLICY_CREATOR_ROLE to:', deployer.address);
  
  // Get deployed contract addresses
  const GOVERNANCE_ADDRESS = '0x8Aa1810947707735fd75aD20F57117d05256D229';
  
  // Get contract instance
  const GovernanceContract = await ethers.getContractFactory('GovernanceContract');
  const governance = GovernanceContract.attach(GOVERNANCE_ADDRESS);
  
  // Get the role hash
  const POLICY_CREATOR_ROLE = await governance.POLICY_CREATOR_ROLE();
  console.log('POLICY_CREATOR_ROLE:', POLICY_CREATOR_ROLE);
  
  // Grant role to deployer
  const tx = await governance.grantRole(POLICY_CREATOR_ROLE, deployer.address);
  await tx.wait();
  
  console.log('✅ Role granted! Transaction:', tx.hash);
  console.log('You can now create policies!');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
