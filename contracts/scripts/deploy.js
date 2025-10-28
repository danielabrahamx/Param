const hre = require('hardhat');

async function main() {
  const { ethers } = hre;
  const [deployer] = await ethers.getSigners();
  console.log('Deploying contracts with the account:', deployer.address);

  // Deploy GovernanceContract
  const GovernanceContract = await ethers.getContractFactory('GovernanceContract');
  const governance = await GovernanceContract.deploy(deployer.address);
  await governance.waitForDeployment();
  console.log('GovernanceContract deployed to:', await governance.getAddress());

  // Deploy InsurancePool
  const InsurancePool = await ethers.getContractFactory('InsurancePool');
  const pool = await InsurancePool.deploy();
  await pool.waitForDeployment();
  console.log('InsurancePool deployed to:', await pool.getAddress());

  // Deploy OracleRegistry
  const OracleRegistry = await ethers.getContractFactory('OracleRegistry');
  const oracle = await OracleRegistry.deploy(await governance.getAddress());
  await oracle.waitForDeployment();
  console.log('OracleRegistry deployed to:', await oracle.getAddress());

  // Deploy PolicyFactory
  const PolicyFactory = await ethers.getContractFactory('PolicyFactory');
  const factory = await PolicyFactory.deploy(await oracle.getAddress(), await governance.getAddress(), await pool.getAddress());
  await factory.waitForDeployment();
  console.log('PolicyFactory deployed to:', await factory.getAddress());
  
  // Set factory address on pool
  await pool.setPolicyFactory(await factory.getAddress());
  console.log('PolicyFactory address set on InsurancePool');

  console.log('Deployment complete!');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});