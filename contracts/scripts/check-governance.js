const hre = require("hardhat");

async function main() {
  const governanceAddress = "0x8Aa1810947707735fd75aD20F57117d05256D229";
  const oracleRegistryAddress = "0x010AD086bbfb482cd9c48F71221e702d924bCE70";

  const governance = await hre.ethers.getContractAt("GovernanceContract", governanceAddress);
  const oracleRegistry = await hre.ethers.getContractAt("OracleRegistry", oracleRegistryAddress);

  console.log("\n🔍 Current Governance & Oracle State:");
  console.log("=====================================");
  
  const threshold = await governance.floodThreshold();
  console.log(`Governance Threshold: ${threshold.toString()}`);
  
  const floodLevel = await oracleRegistry.floodLevels(1);
  console.log(`Current Flood Level: ${floodLevel.toString()}`);
  
  console.log("\n📊 Comparison:");
  console.log(`Flood Level (${floodLevel}) ${floodLevel > threshold ? '>' : '<='} Threshold (${threshold})`);
  console.log(`Claims ${floodLevel > threshold ? 'ENABLED ✅' : 'DISABLED ❌'}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
