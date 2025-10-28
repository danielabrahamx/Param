const { ethers } = require('ethers');
require('dotenv').config();

async function diagnosePolicyCreation() {
  const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
  
  console.log('=== DIAGNOSING POLICY CREATION FAILURE ===\n');

  const txHash = '0x3392317c...d27315d548'; // From the screenshot
  
  // Try to get the transaction
  try {
    const tx = await provider.getTransaction(txHash);
    if (!tx) {
      console.log('Transaction not found on chain');
      return;
    }
    
    console.log('Transaction found:');
    console.log('From:', tx.from);
    console.log('To:', tx.to);
    console.log('Value:', tx.value.toString());
    console.log('Data:', tx.data.slice(0, 100) + '...');
    console.log('');

    const receipt = await provider.getTransactionReceipt(txHash);
    if (receipt) {
      console.log('Receipt found:');
      console.log('Status:', receipt.status === 1 ? '✅ SUCCESS' : '❌ FAILED');
      console.log('Block:', receipt.blockNumber);
      console.log('Gas used:', receipt.gasUsed.toString());
    } else {
      console.log('❌ No receipt found - transaction may have been dropped');
    }
  } catch (error) {
    console.log('❌ Error checking transaction:', error.message);
  }

  console.log('\n=== CHECKING POLICY FACTORY ===\n');
  const FactoryABI = require('./artifacts/contracts/PolicyFactory.sol/PolicyFactory.json').abi;
  const factoryAddress = process.env.POLICY_FACTORY_ADDRESS;
  
  console.log('Factory Address:', factoryAddress);
  const factory = new ethers.Contract(factoryAddress, FactoryABI, provider);

  try {
    // Try to read from the factory
    const oracle = await factory.oracle();
    console.log('✅ Factory is callable');
    console.log('Oracle:', oracle);
  } catch (error) {
    console.log('❌ Factory call failed:', error.message);
  }
}

diagnosePolicyCreation().catch(console.error);
