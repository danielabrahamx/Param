const hre = require('hardhat');

// These are the standard deployment order for Hardhat localhost
// When deploying sequentially: Governance -> Pool -> Oracle -> Factory -> IndividualPolicy

// Standard addresses from hardhat deterministic deployment
const STANDARD_ADDRESSES = {
  governance: "0x5FbDB2315678afecb367f032d93F642f64180aa3",     // 5th deployment (0 indexed = 4)
  pool: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",          // 3rd deployment 
  oracle: "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0",        // 4th deployment
  factory: "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9",       // 1st deployment (deployer)
  individual: "0xDc64a140Aa3E981100a9BeC464e11e1F2B9673c2"      // 6th deployment
};

console.log(`
✅ Standard Hardhat Deployment Addresses
============================================

Update your .env file with these addresses:

VITE_GOVERNANCE_ADDRESS=${STANDARD_ADDRESSES.governance}
VITE_POOL_ADDRESS=${STANDARD_ADDRESSES.pool}
VITE_ORACLE_REGISTRY_ADDRESS=${STANDARD_ADDRESSES.oracle}
VITE_POLICY_FACTORY_ADDRESS=${STANDARD_ADDRESSES.factory}

Or if deploying manually, run: npx hardhat run scripts/deploy.js --network localhost
Then extract the output addresses.
`);
