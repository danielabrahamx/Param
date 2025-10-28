import { ethers } from 'ethers';
import { db } from './db';
import { policies, syncState } from './db/schema';
import { eq } from 'drizzle-orm';
import dotenv from 'dotenv';

dotenv.config();

async function syncPolicies() {
  console.log('🔄 Syncing policies from Hedera blockchain...\n');

  const rpcUrl = process.env.RPC_URL || 'https://testnet.hashio.io/api';
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const policyFactoryAddress = process.env.POLICY_FACTORY_ADDRESS;

  if (!policyFactoryAddress) {
    console.error('❌ POLICY_FACTORY_ADDRESS not set in environment');
    throw new Error('POLICY_FACTORY_ADDRESS required');
  }

  // PolicyFactory ABI - just need the PolicyCreated event
  const policyFactoryAbi = [
    'event PolicyCreated(address indexed policyAddress, uint256 coverage, uint256 premium, address indexed policyholder)',
  ];

  try {
    const contract = new ethers.Contract(policyFactoryAddress, policyFactoryAbi, provider);

    // Get current block number
    const currentBlock = await provider.getBlockNumber();
    
    // Get the last synced block from the database
    let lastSyncRecord = await db
      .select()
      .from(syncState)
      .where(eq(syncState.service, 'policy-sync'))
      .limit(1);
    
    let lastSyncedBlock = 0;
    if (lastSyncRecord.length > 0) {
      lastSyncedBlock = lastSyncRecord[0].lastSyncedBlock;
    }
    
    // Hedera RPC limits queries to 7 days of history
    // Approximately 26 blocks per minute * 60 * 24 * 7 = ~261,120 blocks per 7 days
    const SEVEN_DAYS_IN_BLOCKS = 261120;
    const minBlock = Math.max(0, currentBlock - SEVEN_DAYS_IN_BLOCKS);
    
    // Start from the block after the last synced block, but not before the 7-day limit
    const fromBlock = Math.max(minBlock, lastSyncedBlock + 1);
    
    console.log(`Last synced block: ${lastSyncedBlock}`);
    console.log(`Searching for PolicyCreated events from block ${fromBlock} to ${currentBlock}...`);

    // Query events
    const events = await contract.queryFilter('PolicyCreated', fromBlock, currentBlock);
    
    console.log(`Found ${events.length} PolicyCreated events`);

    for (const event of events) {
      // Type assertion for EventLog which has args
      const eventLog = event as ethers.EventLog;
      const policyAddress = eventLog.args?.[0] as string;
      const coverage = eventLog.args?.[1] as bigint;
      const premium = eventLog.args?.[2] as bigint;
      const policyholder = eventLog.args?.[3] as string;

      if (!policyAddress || !policyholder) {
        console.warn('⚠️ Skipping invalid event:', eventLog.args);
        continue;
      }

      // Check if policy already exists in database
      const existingPolicy = await db
        .select()
        .from(policies)
        .where(eq(policies.policyAddress, policyAddress))
        .limit(1);

      if (existingPolicy.length > 0) {
        console.log(`Policy ${policyAddress} already in database, skipping...`);
        continue;
      }

      // Convert wei values (18 decimals) to whole HBAR units
      const coverageHbar = Number(coverage) / 1e18;
      const premiumHbar = Number(premium) / 1e18;

      console.log(`📝 Adding policy: ${policyAddress}`);
      console.log(`   Coverage: ${coverageHbar} HBAR, Premium: ${premiumHbar} HBAR`);
      console.log(`   Policyholder: ${policyholder}`);

      await db.insert(policies).values({
        policyAddress,
        coverage: coverageHbar.toString(),
        premium: premiumHbar.toString(),
        policyholder: policyholder.toLowerCase(),
      });

      console.log(`✅ Policy ${policyAddress} added to database`);
    }

    // Update the last synced block in the database
    if (currentBlock > lastSyncedBlock) {
      if (lastSyncRecord.length > 0) {
        // Update existing record
        await db
          .update(syncState)
          .set({
            lastSyncedBlock: currentBlock,
            lastSyncTime: new Date(),
          })
          .where(eq(syncState.service, 'policy-sync'));
      } else {
        // Create new record
        await db.insert(syncState).values({
          service: 'policy-sync',
          lastSyncedBlock: currentBlock,
          lastSyncTime: new Date(),
        });
      }
      console.log(`✅ Updated last synced block to ${currentBlock}`);
    }

    console.log('\n✅ Sync complete!');
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
