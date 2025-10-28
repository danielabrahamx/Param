const hre = require('hardhat');
require('dotenv').config();

async function main() {
  const { ethers } = hre;
  const [deployer] = await ethers.getSigners();

  const adminAddress = '0xa3f3599f3B375F95125c4d9402140c075F733D8e';
  console.log('Granting ADMIN_ROLE to:', adminAddress);

  // Get deployed contract addresses
  const GOVERNANCE_ADDRESS = '0x8Aa1810947707735fd75aD20F57117d05256D229';

  // Get contract instance
  const GovernanceContract = await ethers.getContractFactory('GovernanceContract');
  const governance = GovernanceContract.attach(GOVERNANCE_ADDRESS);

  // Get the role hash
  const ADMIN_ROLE = await governance.ADMIN_ROLE();
  console.log('ADMIN_ROLE:', ADMIN_ROLE);

  // Grant role to the specific address
  const tx = await governance.grantRole(ADMIN_ROLE, adminAddress);
  await tx.wait();

  console.log('✅ Role granted! Transaction:', tx.hash);
  console.log('Admin role granted to the specified address!');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
