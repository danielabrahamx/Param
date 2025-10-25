import { ethers } from 'ethers';
import { db } from './db';
import { policies, claimsPool } from './db/schema';
import { eq } from 'drizzle-orm';
import dotenv from 'dotenv';

dotenv.config();

async function syncPolicies() {
  console.log('🔄 Syncing policies from Hedera blockchain...\n');

  const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
  
  const factoryAbi = [
    "event PolicyCreated(address indexed policyAddress, uint256 coverage, uint256 premium, address indexed policyholder)"
  ];
  
  const factory = new ethers.Contract(
    process.env.POLICY_FACTORY_ADDRESS!,
    factoryAbi,
    provider
  );

  try {
    // Get all PolicyCreated events (limit to recent blocks on Hedera)
    const currentBlock = await provider.getBlockNumber();
    const fromBlock = Math.max(0, currentBlock - 50000); // Last ~50k blocks
    
    const filter = factory.filters.PolicyCreated();
    const events = await factory.queryFilter(filter, fromBlock, currentBlock);

    console.log(`Found ${events.length} policy events on-chain\n`);

    for (const event of events) {
      if (!('args' in event)) continue;
      
      const { policyAddress, coverage, premium, policyholder } = event.args;

      // Check if already in database
      const existing = await db.select().from(policies).where(
        eq(policies.policyAddress, policyAddress)
      );

      if (existing.length === 0) {
        // Convert from Wei to HBAR (divide by 10^18)
        const coverageHbar = Number(ethers.formatEther(coverage));
        const premiumHbar = Number(ethers.formatEther(premium));
        
        // Store as integer: multiply by 10 to preserve one decimal place
        // 0.1 HBAR -> 1, 1 HBAR -> 10, etc.
        await db.insert(policies).values({
          policyAddress,
          coverage: Math.round(coverageHbar * 10),
          premium: Math.round(premiumHbar * 10),
          policyholder,
        });
        
        // Add premium to claims pool (unified pool)
        const premiumAmount = Math.round(premiumHbar * 10);
        const pool = await db.select().from(claimsPool).limit(1);
        
        if (pool.length > 0) {
          const currentCapacity = BigInt(pool[0].totalCapacity.toString());
          const currentBalance = BigInt(pool[0].availableBalance.toString());
          const newCapacity = currentCapacity + BigInt(premiumAmount);
          const newBalance = currentBalance + BigInt(premiumAmount);
          
          await db.update(claimsPool)
            .set({
              totalCapacity: newCapacity.toString(),
              availableBalance: newBalance.toString(),
              updatedAt: new Date(),
            })
            .where(eq(claimsPool.id, pool[0].id));
          
          console.log(`💰 Added premium to pool: ${premiumHbar} HBAR`);
        } else {
          // Initialize pool if it doesn't exist
          await db.insert(claimsPool).values({
            totalCapacity: premiumAmount.toString(),
            availableBalance: premiumAmount.toString(),
            totalClaimsProcessed: '0',
          });
          console.log(`🆕 Initialized pool with premium: ${premiumHbar} HBAR`);
        }
        
        console.log(`✅ Synced policy: ${policyAddress}`);
        console.log(`   Coverage: ${coverageHbar} HBAR (stored as ${Math.round(coverageHbar * 10)})`);
        console.log(`   Premium: ${premiumHbar} HBAR (stored as ${Math.round(premiumHbar * 10)})`);
        console.log(`   Holder: ${policyholder}\n`);
      } else {
        console.log(`⏭️  Skipped (already in DB): ${policyAddress}\n`);
      }
    }

    console.log('✅ Sync complete!');
  } catch (error) {
    console.error('❌ Sync failed:', error);
    throw error;
  }
}

export { syncPolicies };

// Only run if called directly
if (require.main === module) {
  syncPolicies()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
