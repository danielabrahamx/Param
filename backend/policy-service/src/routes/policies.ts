import { Router } from 'express';
import { z } from 'zod';
import { ethers } from 'ethers';
import { db } from '../db';
import { policies, poolReserve } from '../db/schema';
import { eq } from 'drizzle-orm';
import { syncPolicies } from '../sync-policies';

const router = Router();

const createPolicySchema = z.object({
  coverage: z.number().positive(),
  policyholder: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
});

// GET all policies
router.get('/', async (req, res) => {
  try {
    const allPolicies = await db.select().from(policies);
    // Convert stored values back to HBAR (divide by 10)
    const formattedPolicies = allPolicies.map(policy => ({
      ...policy,
      coverage: policy.coverage / 10,
      premium: policy.premium / 10
    }));
    res.json(formattedPolicies || []);
  } catch (error) {
    console.error('Error fetching policies:', error);
    res.json([]); // Return empty array instead of error
  }
});

router.post('/', async (req, res) => {
  try {
    const { coverage, policyholder } = createPolicySchema.parse(req.body);

    const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
    const signer = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);

    const factoryAbi = [
      "function createPolicy(uint256 _coverage) external returns (address)"
    ];
    const factory = new ethers.Contract(process.env.POLICY_FACTORY_ADDRESS!, factoryAbi, signer);

    const tx = await factory.createPolicy(coverage);
    const receipt = await tx.wait();
    const policyAddress = receipt?.logs[0]?.args?.[0] || '0x0000000000000000000000000000000000000000';

    const premium = Math.floor(coverage / 10);

    await db.insert(policies).values({
      policyAddress,
      coverage,
      premium,
      policyholder,
    });

    // Trigger async sync to pull any new policies from blockchain
    syncPolicies().catch(err => console.error('Auto-sync failed:', err));

    res.status(201).json({ policyAddress, coverage, premium, policyholder });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create policy' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const policy = await db.select().from(policies).where(eq(policies.id, parseInt(id))).limit(1);
    if (policy.length === 0) {
      return res.status(404).json({ error: 'Policy not found' });
    }
    // Convert stored values back to HBAR (divide by 10)
    const formattedPolicy = {
      ...policy[0],
      coverage: policy[0].coverage / 10,
      premium: policy[0].premium / 10
    };
    res.json(formattedPolicy);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to retrieve policy' });
  }
});

// Pool endpoints
router.get('/pool/stats', async (req, res) => {
  try {
    const pool = await db.select().from(poolReserve).limit(1);
    if (pool.length === 0) {
      return res.json({ tvl: 0, reserveRatio: 150 });
    }
    res.json({
      tvl: parseFloat(pool[0].totalLiquidity.toString()) / 1e18,
      reserveRatio: pool[0].reserveRatio
    });
  } catch (error) {
    console.error(error);
    res.json({ tvl: 0, reserveRatio: 150 });
  }
});

// Sync policies from blockchain
router.post('/sync', async (req, res) => {
  try {
    await syncPolicies();
    res.json({ message: 'Policy sync completed successfully' });
  } catch (error) {
    console.error('Sync error:', error);
    res.status(500).json({ error: 'Failed to sync policies' });
  }
});

export { router as policyRouter };