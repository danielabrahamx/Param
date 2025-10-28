const hre = require("hardhat");
const { ethers } = require("ethers");

async function main() {
  const poolAddress = process.env.POOL_ADDRESS || "0xd6ec409DAbaB38E6c8f12816873239024c732363";
  const rpcUrl = process.env.RPC_URL || "https://testnet.hashio.io/api";
  const privateKey = process.env.PRIVATE_KEY;
  
  if (!privateKey) {
    throw new Error("PRIVATE_KEY not found in environment");
  }
  
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(privateKey, provider);
  
  const poolAbi = [
    "function deposit() payable",
    "function getBalance() view returns (uint256)",
    "function totalBalance() view returns (uint256)"
  ];
  
  const pool = new ethers.Contract(poolAddress, poolAbi, wallet);
  
  console.log("Depositing to InsurancePool at:", poolAddress);
  console.log("From wallet:", wallet.address);
  
  // Check balance before
  const balanceBefore = await provider.getBalance(wallet.address);
  console.log("\nWallet balance before:", ethers.formatEther(balanceBefore), "HBAR");
  
  const poolBalanceBefore = await pool.getBalance();
  console.log("Pool balance before:", ethers.formatEther(poolBalanceBefore), "HBAR");
  
  // Deposit 40 HBAR
  const depositAmount = ethers.parseEther("5.0");
  console.log("\nDepositing:", ethers.formatEther(depositAmount), "HBAR");
  
  const tx = await pool.deposit({ value: depositAmount });
  console.log("Transaction hash:", tx.hash);
  console.log("Waiting for confirmation...");
  
  const receipt = await tx.wait();
  console.log("Transaction confirmed in block:", receipt.blockNumber);
  
  // Check balance after
  const poolBalanceAfter = await pool.getBalance();
  const balanceAfter = await provider.getBalance(wallet.address);
  
  console.log("\nWallet balance after:", ethers.formatEther(balanceAfter), "HBAR");
  console.log("Pool balance after:", ethers.formatEther(poolBalanceAfter), "HBAR");
  console.log("\n✅ Success! Deposited:", ethers.formatEther(poolBalanceAfter - poolBalanceBefore), "HBAR");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
