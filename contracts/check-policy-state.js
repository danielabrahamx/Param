const { ethers } = require('ethers');
require('dotenv').config();

const policyAddress = '0x79ba31081D84eB669EF9052819822756b933942d';
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);

const policyAbi = [
  'function policyholder() external view returns (address)',
  'function coverage() external view returns (uint256)',
  'function payoutTriggered() external view returns (bool)',
  'function floodLevel() external view returns (uint256)',
];

async function checkPolicy() {
  console.log('=== CHECKING POLICY CONTRACT STATE ===\n');
  console.log('Policy Address:', policyAddress);
  console.log('');

  const policy = new ethers.Contract(policyAddress, policyAbi, provider);

  try {
    const [policyholder, coverage, payoutTriggered] = await Promise.all([
      policy.policyholder(),
      policy.coverage(),
      policy.payoutTriggered(),
    ]);

    console.log('Policyholder:', policyholder);
    console.log('Coverage:', ethers.formatEther(coverage), 'HBAR');
    console.log('Payout Triggered:', payoutTriggered);

    // Check contract balance
    const balance = await provider.getBalance(policyAddress);
    console.log('Contract Balance:', ethers.formatEther(balance), 'HBAR');
    console.log('');

    if (balance.toString() === '0') {
      console.log('❌ PROBLEM: Contract has 0 HBAR!');
      console.log('   When triggerPayout() runs, there are no funds to send');
      console.log('   This is why you received 0 HBAR');
    } else {
      console.log('✅ Contract has funds:', ethers.formatEther(balance), 'HBAR');
    }

    if (payoutTriggered) {
      console.log('\n⚠️ Payout already triggered - cannot claim twice');
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkPolicy().catch(console.error);
