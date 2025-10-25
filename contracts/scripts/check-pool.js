const hre = require("hardhat");
const { ethers } = require("ethers");

async function main() {
  const poolAddress = "0xA64B631F05E12f6010D5010bC28E0F18C5895b26";
  const rpcUrl = "https://testnet.hashio.io/api";
  
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  
  const poolAbi = [
    "function totalLiquidity() view returns (uint256)",
    "function totalReserves() view returns (uint256)",
    "function getReserveRatio() view returns (uint256)"
  ];
  
  const pool = new ethers.Contract(poolAddress, poolAbi, provider);
  
  console.log("Checking InsurancePool at:", poolAddress);
  console.log("RPC URL:", rpcUrl);
  console.log("");
  
  try {
    const totalLiquidity = await pool.totalLiquidity();
    const totalReserves = await pool.totalReserves();
    const reserveRatio = await pool.getReserveRatio();
    const balance = await provider.getBalance(poolAddress);
    
    console.log("Total Liquidity:", ethers.formatEther(totalLiquidity), "HBAR");
    console.log("Total Reserves:", ethers.formatEther(totalReserves), "HBAR");
    console.log("Reserve Ratio:", reserveRatio.toString() + "%");
    console.log("Contract Balance:", ethers.formatEther(balance), "HBAR");
    console.log("");
    console.log("Raw values:");
    console.log("  totalLiquidity:", totalLiquidity.toString());
    console.log("  totalReserves:", totalReserves.toString());
    console.log("  balance:", balance.toString());
  } catch (error) {
    console.error("Error reading from contract:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
