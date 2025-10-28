import { Router } from 'express';
import { z } from 'zod';
import {
  Client,
  ContractFunctionParameters,
  ContractExecuteTransaction,
  PrivateKey,
  AccountId,
} from '@hashgraph/sdk';
import { db } from '../db';
import { policies, poolReserve } from '../db/schema';
import { eq } from 'drizzle-orm';
import { syncPolicies } from '../sync-policies';

const router = Router();

const createPolicySchema = z.object({
  coverage: z.number().positive(),
  premium: z.number().positive().optional(), // Optional - can be calculated if not provided
  policyholder: z.string(), // Wallet address
});

// GET all policies
router.get('/', async (req, res) => {
  try {
    const allPolicies = await db.select().from(policies);
    // Return policies as-is (coverage and premium are already stored in HBAR)
    res.setHeader('Content-Type', 'application/json');
    res.status(200).send(JSON.stringify({ success: true, data: allPolicies || [] }));
  } catch (error) {
    console.error('Error fetching policies:', error);
    res.setHeader('Content-Type', 'application/json');
    res.status(500).send(JSON.stringify({ success: false, error: 'Failed to fetch policies' }));
  }
});

// POST - Create a policy on-chain AND save to database (legacy backend flow)
router.post('/', async (req, res) => {
  try {
    // Check if this is an on-chain policy that needs to be saved
    if (req.body.policyAddress !== undefined || req.body.policyholder) {
      // Try to parse as save-on-chain request
      try {
        const { coverage, premium, policyholder } = createPolicySchema.parse(req.body);
        
        console.log('💾 Attempting to find and save on-chain policy for:', {
          coverage,
          premium,
          policyholder,
        });

        // Trigger sync to pull the most recent policy for this policyholder
        console.log('🔄 Syncing policies from blockchain...');
        await syncPolicies();

        // Give the sync a moment to complete
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Now query for the policy we just created (should be the most recent one for this policyholder)
        const recentPolicies = await db
          .select()
          .from(policies)
          .where(eq(policies.policyholder, policyholder as string))
          .limit(10);

        // Find the policy that matches coverage (approximately, allowing for small rounding differences)
        const matchedPolicy = recentPolicies.find(p => 
          Math.abs(parseFloat(p.coverage) - coverage) < 0.1
        );

        if (matchedPolicy) {
          console.log('✅ Found matching policy:', matchedPolicy);
          res.setHeader('Content-Type', 'application/json');
          res.status(201).send(JSON.stringify({
            success: true,
            id: matchedPolicy.id,
            policyAddress: matchedPolicy.policyAddress,
            coverage: matchedPolicy.coverage,
            premium: matchedPolicy.premium,
            policyholder: matchedPolicy.policyholder,
          }));
          return;
        }

        // If not found after sync, return accepted but pending
        console.log('⏳ Policy not yet indexed, will appear shortly');
        res.setHeader('Content-Type', 'application/json');
        res.status(202).send(JSON.stringify({
          success: true,
          message: 'Policy transaction detected, indexing from blockchain...',
          coverage,
          premium,
          policyholder,
        }));
        return;
      } catch (parseError) {
        // Not a valid save request, continue to legacy flow
      }
    }

    // Legacy: Create on-chain via backend
    const { coverage, policyholder } = createPolicySchema.parse(req.body);

    const client = Client.forTestnet();
    client.setOperator(
      AccountId.fromString(process.env.OPERATOR_ID!),
      PrivateKey.fromString(process.env.OPERATOR_KEY!)
    );

    const contractId = process.env.POLICY_FACTORY_ADDRESS!;
    const premium = coverage / 10; // 10% premium

    const tx = await new ContractExecuteTransaction()
      .setContractId(contractId)
      .setGas(300000) // Increase gas limit
      .setFunction(
        'createPolicy',
        new ContractFunctionParameters().addUint256(coverage)
      )
      .setPayableAmount(premium)
      .execute(client);

    const record = await tx.getRecord(client);
    const policyAddress = record.contractFunctionResult!.getAddress(0);

    // Convert to string for decimal fields
    await db.insert(policies).values({
      policyAddress,
      coverage: coverage.toString(),
      premium: premium.toString(),
      policyholder,
    });

    // Trigger async sync to pull any new policies from blockchain
    syncPolicies().catch((err) => console.error('Auto-sync failed:', err));

    res.setHeader('Content-Type', 'application/json');
    res.status(201).send(JSON.stringify({ policyAddress, coverage, premium, policyholder }));
  } catch (error) {
    console.error('POST /policies error:', error);
    res.setHeader('Content-Type', 'application/json');
    res.status(500).send(JSON.stringify({ error: 'Failed to create policy', details: String(error) }));
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const policy = await db.select().from(policies).where(eq(policies.id, parseInt(id))).limit(1);
    if (policy.length === 0) {
      res.setHeader('Content-Type', 'application/json');
      return res.status(404).send(JSON.stringify({ error: 'Policy not found' }));
    }
    // Return policy as-is (coverage and premium are already decimal HBAR values)
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(policy[0]));
  } catch (error) {
    console.error(error);
    res.setHeader('Content-Type', 'application/json');
    res.status(500).send(JSON.stringify({ error: 'Failed to retrieve policy' }));
  }
});

// Pool endpoints
router.get('/pool/stats', async (req, res) => {
  try {
    const pool = await db.select().from(poolReserve).limit(1);
    if (pool.length === 0) {
      res.setHeader('Content-Type', 'application/json');
      return res.send(JSON.stringify({ tvl: 0, reserveRatio: 150 }));
    }
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify({
      tvl: parseFloat(pool[0].totalLiquidity.toString()) / 1e18,
      reserveRatio: pool[0].reserveRatio
    }));
  } catch (error) {
    console.error(error);
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify({ tvl: 0, reserveRatio: 150 }));
  }
});

// Sync policies from blockchain
router.post('/sync', async (req, res) => {
  try {
    await syncPolicies();
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify({ message: 'Policy sync completed successfully' }));
  } catch (error) {
    console.error('Sync error:', error);
    res.setHeader('Content-Type', 'application/json');
    res.status(500).send(JSON.stringify({ error: 'Failed to sync policies' }));
  }
});

export { router as policyRouter };