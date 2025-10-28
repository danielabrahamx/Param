const { ethers } = require('ethers');
require('dotenv').config();

async function testPolicyCreation() {
  const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
  const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  
  const factoryAbi = [
    "function createPolicy(uint256 _coverage) external payable returns (address)"
  ];
  
  const factory = new ethers.Contract(process.env.POLICY_FACTORY_ADDRESS, factoryAbi, signer);
  
  const coverage = 1;  // 1 HBAR coverage
  const coverageWei = ethers.parseEther(coverage.toString());
  const premiumWei = ethers.parseEther('2'); // Send 2 HBAR premium (way more than 10%)
  
  console.log('Creating policy...');
  console.log('Coverage:', coverage, 'HBAR =', coverageWei.toString(), 'Wei');
  console.log('Premium:', ethers.formatEther(premiumWei), 'HBAR =', premiumWei.toString(), 'Wei');
  console.log('Factory:', process.env.POLICY_FACTORY_ADDRESS);
  console.log('');
  
  try {
    // First try to estimate gas to see if there's an issue
    console.log('Estimating gas...');
    const gasEstimate = await factory.createPolicy.estimateGas(coverageWei, { value: premiumWei });
    console.log('Gas estimate:', gasEstimate.toString());
    
    const tx = await factory.createPolicy(coverageWei, { value: premiumWei, gasLimit: gasEstimate * BigInt(2) });
    console.log('Transaction sent:', tx.hash);
    const receipt = await tx.wait();
    console.log('✅ Success! Policy created');
    console.log('Gas used:', receipt.gasUsed.toString());
  } catch (error) {
    console.error('❌ Error:', error.shortMessage || error.message);
    if (error.data) {
      console.error('Data:', error.data);
    }
    if (error.info) {
      console.error('Info:', JSON.stringify(error.info, null, 2));
    }
  }
}

testPolicyCreation();
