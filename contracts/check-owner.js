const { ethers } = require('ethers');
require('dotenv').config();

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

const GovernanceABI = require('./artifacts/contracts/GovernanceContract.sol/GovernanceContract.json').abi;

(async () => {
  try {
    const governanceAddress = process.env.GOVERNANCE_ADDRESS;

    console.log('Checking Governance Contract Owner...\n');

    const governance = new ethers.Contract(governanceAddress, GovernanceABI, signer);
    
    try {
      const owner = await governance.owner();
      console.log('Governance Owner:', owner);
      console.log('Your Address:', signer.address);
      console.log('Match:', owner.toLowerCase() === signer.address.toLowerCase() ? '✅ YES' : '❌ NO');
    } catch (err) {
      console.log('Could not get owner:', err.message);
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
})();
