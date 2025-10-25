const { ethers } = require("ethers");

async function main() {
  const txHash = "0xd9fba633dfaf0f1635694945cdaccb1801d04cb2870cee17f35436f2fc6b94ea";
  const rpcUrl = "https://testnet.hashio.io/api";
  
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  
  console.log("Fetching transaction:", txHash);
  console.log("");
  
  const tx = await provider.getTransaction(txHash);
  const receipt = await provider.getTransactionReceipt(txHash);
  
  console.log("Transaction Details:");
  console.log("  From:", tx.from);
  console.log("  To:", tx.to);
  console.log("  Value (wei):", tx.value.toString());
  console.log("  Value (HBAR):", ethers.formatEther(tx.value));
  console.log("  Data:", tx.data);
  console.log("");
  console.log("Receipt:");
  console.log("  Status:", receipt.status === 1 ? "Success" : "Failed");
  console.log("  Gas Used:", receipt.gasUsed.toString());
  console.log("  Logs:", receipt.logs.length);
  
  if (receipt.logs.length > 0) {
    console.log("");
    console.log("Events:");
    receipt.logs.forEach((log, i) => {
      console.log(`  Log ${i}:`, log.topics);
    });
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
