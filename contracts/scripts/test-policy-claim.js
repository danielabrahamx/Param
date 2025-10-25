const hre = require("hardhat");

async function main() {
  const policyAddress = "0x4a6a659A60A03e66b1d8e1B57a9baa0CB19d6D3a"; // Replace with your policy address
  const oracleAddress = "0x010AD086bbfb482cd9c48F71221e702d924bCE70";
  const governanceAddress = "0x8Aa1810947707735fd75aD20F57117d05256D229";

  console.log("\n🔍 Testing Policy Claim Conditions");
  console.log("===================================");

  const policy = await hre.ethers.getContractAt("IndividualPolicy", policyAddress);
  const oracle = await hre.ethers.getContractAt("OracleRegistry", oracleAddress);
  const governance = await hre.ethers.getContractAt("GovernanceContract", governanceAddress);

  // Check all conditions
  const payoutTriggered = await policy.payoutTriggered();
  console.log(`1. Payout Already Triggered: ${payoutTriggered} ${payoutTriggered ? '❌' : '✅'}`);

  const paused = await governance.paused();
  console.log(`2. Contract Paused: ${paused} ${paused ? '❌' : '✅'}`);

  const regionId = await policy.REGION_ID();
  const floodLevel = await oracle.getLatestFloodLevel(regionId);
  console.log(`3. Flood Level (Region ${regionId}): ${floodLevel}`);

  const threshold = await governance.floodThreshold();
  console.log(`4. Threshold: ${threshold}`);

  const meetsThreshold = floodLevel > threshold;
  console.log(`5. Flood Level > Threshold: ${floodLevel} > ${threshold} = ${meetsThreshold} ${meetsThreshold ? '✅' : '❌'}`);

  console.log("\n📊 Result:");
  if (!payoutTriggered && !paused && meetsThreshold) {
    console.log("✅ All conditions met - claim should succeed!");
  } else {
    console.log("❌ Claim will fail:");
    if (payoutTriggered) console.log("   - Payout already triggered");
    if (paused) console.log("   - Contract is paused");
    if (!meetsThreshold) console.log("   - Flood level not high enough");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
