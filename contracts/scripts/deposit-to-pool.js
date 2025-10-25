const hre = require("hardhat");
const { ethers } = require("ethers");

async function main() {
  const poolAddress = "0xA64B631F05E12f6010D5010bC28E0F18C5895b26";
  const rpcUrl = process.env.RPC_URL || "https://testnet.hashio.io/api";
  const privateKey = process.env.PRIVATE_KEY;
  
  if (!privateKey) {
    throw new Error("PRIVATE_KEY not found in environment");
  }
  
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(privateKey, provider);
  
  const poolAbi = [
    "function deposit() payable",
    "function totalLiquidity() view returns (uint256)",
    "function totalReserves() view returns (uint256)"
  ];
  
  const pool = new ethers.Contract(poolAddress, poolAbi, wallet);
  
  console.log("Depositing to InsurancePool at:", poolAddress);
  console.log("From wallet:", wallet.address);
  
  // Check balance before
  const balanceBefore = await provider.getBalance(wallet.address);
  console.log("\nWallet balance before:", ethers.formatEther(balanceBefore), "HBAR");
  
  const liquidityBefore = await pool.totalLiquidity();
  console.log("Pool liquidity before:", ethers.formatEther(liquidityBefore), "HBAR");
  
  // Deposit 1 HBAR
  const depositAmount = ethers.parseEther("1.0");
  console.log("\nDepositing:", ethers.formatEther(depositAmount), "HBAR");
  
  const tx = await pool.deposit({ value: depositAmount });
  console.log("Transaction hash:", tx.hash);
  console.log("Waiting for confirmation...");
  
  const receipt = await tx.wait();
  console.log("Transaction confirmed in block:", receipt.blockNumber);
  
  // Check balance after
  const liquidityAfter = await pool.totalLiquidity();
  const balanceAfter = await provider.getBalance(wallet.address);
  
  console.log("\nWallet balance after:", ethers.formatEther(balanceAfter), "HBAR");
  console.log("Pool liquidity after:", ethers.formatEther(liquidityAfter), "HBAR");
  console.log("\nSuccess! Deposited:", ethers.formatEther(liquidityAfter - liquidityBefore), "HBAR");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
