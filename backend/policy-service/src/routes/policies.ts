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
    // Check if this is a direct policy save with address from frontend
    if (req.body.policyAddress && req.body.policyAddress !== '0x0000000000000000000000000000000000000000') {
      try {
        const { coverage, premium, policyholder, policyAddress } = req.body;
        
        console.log('💾 Saving policy directly from frontend:', {
          policyAddress,
          coverage,
          premium,
          policyholder,
        });

        // Check if policy already exists (idempotent)
        const existing = await db
          .select()
          .from(policies)
          .where(eq(policies.policyAddress, policyAddress))
          .limit(1);

        if (existing.length > 0) {
          console.log('✅ Policy already exists in database');
          res.setHeader('Content-Type', 'application/json');
          res.status(200).send(JSON.stringify({
            success: true,
            message: 'Policy already exists',
            id: existing[0].id,
            policyAddress: existing[0].policyAddress,
            coverage: existing[0].coverage,
            premium: existing[0].premium,
            policyholder: existing[0].policyholder,
          }));
          return;
        }

        // Insert new policy directly
        const result = await db.insert(policies).values({
          policyAddress,
          coverage: coverage.toString(),
          premium: premium ? premium.toString() : (coverage / 10).toString(),
          policyholder,
        }).returning();

        console.log('✅ Policy saved successfully:', result[0]);
        
        // Trigger async sync in background (non-blocking)
        syncPolicies().catch((err) => console.error('Background sync failed:', err));

        res.setHeader('Content-Type', 'application/json');
        res.status(201).send(JSON.stringify({
          success: true,
          id: result[0].id,
          policyAddress: result[0].policyAddress,
          coverage: result[0].coverage,
          premium: result[0].premium,
          policyholder: result[0].policyholder,
        }));
        return;
      } catch (parseError) {
        console.error('Error parsing direct policy save:', parseError);
        // Fall through to legacy flow
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