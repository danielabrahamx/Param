import { ethers } from 'ethers';
import { db } from '../db';
import { policies, claims, payouts } from '../db/schema';
import { eq, and } from 'drizzle-orm';

// Validate environment variables
const validateEnv = () => {
  const required = ['RPC_URL', 'PRIVATE_KEY', 'ORACLE_ADDRESS', 'POOL_ADDRESS', 'GOVERNANCE_ADDRESS'];
  for (const key of required) {
    if (!process.env[key]) {
      console.warn(`Warning: ${key} not set in environment`);
    }
  }
};

validateEnv();

// Initialize contracts with error handling
let oracleContract: ethers.Contract | null = null;
let poolContract: ethers.Contract | null = null;
let governanceContract: ethers.Contract | null = null;
let provider: ethers.Provider | null = null;
let signer: ethers.Signer | null = null;

const initializeContracts = () => {
  try {
    provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
    signer = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);
    
    const oracleAddress = process.env.ORACLE_ADDRESS;
    const poolAddress = process.env.POOL_ADDRESS;
    const governanceAddress = process.env.GOVERNANCE_ADDRESS;

    if (!oracleAddress || !poolAddress || !governanceAddress) {
      console.error('Missing contract addresses. Skipping contract initialization.');
      return false;
    }

    oracleContract = new ethers.Contract(oracleAddress, [
      "function getLatestFloodLevel(uint256 regionId) view returns (uint256)"
    ], provider);
    
    poolContract = new ethers.Contract(poolAddress, [
      "function payOut(address policyholder, uint256 amount) external"
    ], signer);
    
    governanceContract = new ethers.Contract(governanceAddress, [
      "function floodThreshold() view returns (uint256)"
    ], provider);

    console.log('Contracts initialized successfully');
    return true;
  } catch (error) {
    console.error('Error initializing contracts:', error);
    return false;
  }
};

export async function monitorOracle() {
  // Initialize contracts first
  if (!initializeContracts()) {
    console.warn('Skipping oracle monitoring due to contract initialization failure');
    return;
  }

  // Poll every 5 minutes
  setInterval(async () => {
    try {
      if (!oracleContract || !governanceContract || !poolContract) {
        console.warn('Contracts not initialized, skipping monitoring cycle');
        return;
      }

      const floodLevel = await oracleContract.getLatestFloodLevel(1);
      const threshold = await governanceContract.floodThreshold();

      console.log(`Current flood level: ${floodLevel}, Threshold: ${threshold}`);

      if (floodLevel > threshold) {
        // Find policies that haven't triggered payout
        const eligiblePolicies = await db.select().from(policies).where(eq(policies.payoutTriggered, false));

        for (const policy of eligiblePolicies) {
          try {
            // Calculate payout amount (e.g., coverage amount)
            const payoutAmount = ethers.parseEther(policy.coverage.toString());

            // Trigger payout via pool contract
            const tx = await poolContract.payOut(policy.policyholder, payoutAmount);
            const receipt = await tx.wait();

            console.log(`Payout triggered for policy ${policy.id}, tx: ${receipt?.hash}`);

            // Insert claim
            const claimResult = await db.insert(claims).values({
              policyId: policy.id,
              policyholder: policy.policyholder,
              amount: payoutAmount.toString(),
              status: 'approved',
            }).returning({ id: claims.id });

            // Insert payout
            await db.insert(payouts).values({
              claimId: claimResult[0].id,
              amount: payoutAmount.toString(),
              txHash: receipt?.hash || 'unknown',
            });

            // Mark policy as triggered
            await db.update(policies).set({ payoutTriggered: true }).where(eq(policies.id, policy.id));
          } catch (policyError) {
            console.error(`Error processing policy ${policy.id}:`, policyError);
          }
        }
      }
    } catch (error) {
      console.error('Error in monitorOracle:', error);
    }
  }, 5 * 60 * 1000);
}