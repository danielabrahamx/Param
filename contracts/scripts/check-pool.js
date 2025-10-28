const hre = require("hardhat");
const { ethers } = require("ethers");
require('dotenv').config();

async function main() {
  const poolAddress = process.env.POOL_ADDRESS;
  const rpcUrl = process.env.RPC_URL;
  
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  
  const poolAbi = [
    "function getBalance() view returns (uint256)"
  ];
  
  const pool = new ethers.Contract(poolAddress, poolAbi, provider);
  
  console.log("Checking InsurancePool at:", poolAddress);
  console.log("RPC URL:", rpcUrl);
  console.log("");
  
  try {
    const getBalance = await pool.getBalance();
    const balance = await provider.getBalance(poolAddress);
    
    console.log("getBalance():", ethers.formatEther(getBalance), "HBAR");
    console.log("Provider balance:", ethers.formatEther(balance), "HBAR");
    console.log("");
    console.log("Raw values:");
    console.log("  getBalance:", getBalance.toString());
    console.log("  provider balance:", balance.toString());
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
