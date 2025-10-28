const hre = require('hardhat');

async function main() {
  const { ethers } = hre;
  const [deployer] = await ethers.getSigners();
  console.log('Deploying with account:', deployer.address);

  const governance = '0x3Df2FEaAe411BC65cd4d87Ff18025490646aaF0e';
  const pool = '0x32E880be96BDb9bb1Dc27cd27AFb748fB5158F81';
  const oracle = '0xE10BCF50Fc0D204Bf09e62Ce620714C3a1E1Add2';

  // Deploy PolicyFactory
  const PolicyFactory = await ethers.getContractFactory('PolicyFactory');
  const factory = await PolicyFactory.deploy(oracle, governance, pool);
  await factory.waitForDeployment();
  const factoryAddress = await factory.getAddress();
  console.log('PolicyFactory deployed to:', factoryAddress);

  // Set factory on pool
  const poolContract = await ethers.getContractAt('InsurancePool', pool);
  await poolContract.setPolicyFactory(factoryAddress);
  console.log('Factory set on pool');

  console.log('\nUpdate your .env files with:');
  console.log('GOVERNANCE_ADDRESS=' + governance);
  console.log('POOL_ADDRESS=' + pool);
  console.log('ORACLE_ADDRESS=' + oracle);
  console.log('POLICY_FACTORY_ADDRESS=' + factoryAddress);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
