const hre = require("hardhat");

async function main() {
  const oracleRegistryAddress = "0x010AD086bbfb482cd9c48F71221e702d924bCE70";
  const regionId = 1; // The region your policies check
  const floodLevel = 269; // Current level from database

  console.log("\n🌊 Updating Flood Level on Blockchain");
  console.log("=====================================");
  console.log(`Oracle Registry: ${oracleRegistryAddress}`);
  console.log(`Region ID: ${regionId}`);
  console.log(`New Flood Level: ${floodLevel}`);

  const oracleRegistry = await hre.ethers.getContractAt("OracleRegistry", oracleRegistryAddress);
  
  // Check current value
  const currentLevel = await oracleRegistry.floodLevels(regionId);
  console.log(`\nCurrent Level: ${currentLevel.toString()}`);
  
  if (currentLevel.toString() === floodLevel.toString()) {
    console.log("\n✅ Flood level already correct!");
    return;
  }

  console.log("\n📝 Sending transaction...");
  const tx = await oracleRegistry.updateFloodLevel(regionId, floodLevel);
  console.log(`Transaction hash: ${tx.hash}`);
  
  console.log("⏳ Waiting for confirmation...");
  await tx.wait();
  
  const newLevel = await oracleRegistry.floodLevels(regionId);
  console.log(`\n✅ Flood level updated!`);
  console.log(`Old: ${currentLevel.toString()}`);
  console.log(`New: ${newLevel.toString()}`);
  
  // Check if claims are now enabled
  const governance = await hre.ethers.getContractAt("GovernanceContract", "0x8Aa1810947707735fd75aD20F57117d05256D229");
  const threshold = await governance.floodThreshold();
  console.log(`\n📊 Comparison:`);
  console.log(`Flood Level (${newLevel}) ${newLevel > threshold ? '>' : '<='} Threshold (${threshold})`);
  console.log(`Claims ${newLevel > threshold ? 'ENABLED ✅' : 'DISABLED ❌'}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
