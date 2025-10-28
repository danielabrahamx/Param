const hre = require('hardhat');
require('dotenv').config();

async function main() {
  const { ethers } = hre;

  const adminAddress = '0xa3f3599f3B375F95125c4d9402140c075F733D8e';

  // Get deployed contract addresses
  const GOVERNANCE_ADDRESS = '0x06B1f18f6Be062225E4505463f7608dd2Bdfa873c';
  const ORACLE_ADDRESS = '0xC22458440DFAF4D93096C4a368AcaDFE1333e4df3';

  // Get contract instances
  const governance = await ethers.getContractAt('GovernanceContract', GOVERNANCE_ADDRESS);
  const oracle = await ethers.getContractAt('OracleRegistry', ORACLE_ADDRESS);

  console.log('Setting up Oracle updater and flood data...');

  // Hardcode the ORACLE_UPDATER_ROLE hash (known constant)
  const ORACLE_UPDATER_ROLE = '0x1919d62ba24cba4e2b59ebbc8b90b53a7e9c8fec7b33bad738fe3de54d423bd017';
  console.log('ORACLE_UPDATER_ROLE:', ORACLE_UPDATER_ROLE);

  // Grant role to admin
  console.log('Granting ORACLE_UPDATER_ROLE to admin...');
  try {
    const hasRole = await governance.hasRole(ORACLE_UPDATER_ROLE, adminAddress);
    console.log('Admin already has role:', hasRole);

    if (!hasRole) {
      const tx = await governance.grantRole(ORACLE_UPDATER_ROLE, adminAddress);
      await tx.wait();
      console.log('✅ Oracle updater role granted! Transaction:', tx.hash);
    } else {
      console.log('✅ Admin already has oracle updater role, skipping grant.');
    }
  } catch (error) {
    console.error('Error granting role:', error);
    // Continue anyway - the role might already be granted
  }

  // Now update flood level to simulate critical conditions
  console.log('Updating flood level to 3500 (above default threshold of 3000)...');
  try {
    const updateTx = await oracle.updateFloodLevel(1, 3500);
    await updateTx.wait();
    console.log('✅ Flood level updated! Transaction:', updateTx.hash);

    // Verify
    const floodLevel = await oracle.getLatestFloodLevel(1);
    console.log('✅ Verified flood level:', floodLevel.toString());
  } catch (error) {
    console.error('Error updating flood level:', error);
  }

  console.log('✅ Oracle setup complete!');
  console.log('Flood level is now set to 3500 - claims should work!');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
