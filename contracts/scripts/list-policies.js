const hre = require('hardhat');
require('dotenv').config();

async function main() {
  const { ethers } = hre;
  
  // Get deployed contract addresses
  const POLICY_FACTORY_ADDRESS = '0x89321F04D5D339c6Ad5f621470f922a39042c7F5';
  
  // Get contract instance
  const PolicyFactory = await ethers.getContractFactory('PolicyFactory');
  const factory = PolicyFactory.attach(POLICY_FACTORY_ADDRESS);
  
  console.log('📋 Fetching PolicyCreated events...\n');
  
  // Get all PolicyCreated events
  const filter = factory.filters.PolicyCreated();
  const events = await factory.queryFilter(filter);
  
  console.log(`Found ${events.length} policies:\n`);
  
  for (const event of events) {
    console.log('Policy Address:', event.args.policyAddress);
    console.log('Coverage:', ethers.formatEther(event.args.coverage), 'HBAR');
    console.log('Premium:', ethers.formatEther(event.args.premium), 'HBAR');
    console.log('Policyholder:', event.args.policyholder);
    console.log('---');
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
