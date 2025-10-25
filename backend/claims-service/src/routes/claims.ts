import { Router } from 'express';
import { db } from '../db';
import { claims, payouts, claimsPool, policies } from '../db/schema';
import { eq } from 'drizzle-orm';

const router = Router();

// POST /api/v1/claims/create - create a new claim for payout (must come before generic routes)
router.post('/create', async (req, res) => {
  try {
    console.log('[POST /create] Request received at:', new Date().toISOString());
    const { policyId, policyholder, amount } = req.body;
    console.log('[POST /create] Body:', { policyId, policyholder, amount });

    if (!policyId || !policyholder || !amount) {
      console.log('[POST /create] Missing required fields');
      return res.status(400).json({ error: 'Missing required fields' });
    }

    console.log('[POST /create] Checking if policy already claimed...');
    // Check if this policy has already been claimed
    const existingClaims = await db.select().from(claims).where(eq(claims.policyId, policyId.toString()));
    if (existingClaims.length > 0) {
      console.log('[POST /create] Policy already claimed');
      return res.status(400).json({ 
        error: 'This policy has already been claimed',
        claimId: existingClaims[0].id
      });
    }

    console.log('[POST /create] Fetching pool...');
    // Check if claims pool has sufficient balance
    const pool = await db.select().from(claimsPool).limit(1);
    console.log('[POST /create] Pool result:', pool.length > 0 ? 'exists' : 'not found');
    
    if (!pool || pool.length === 0) {
      console.log('[POST /create] Claims pool not initialized');
      return res.status(400).json({ error: 'Claims pool not initialized' });
    }

    const availableBalance = BigInt(pool[0].availableBalance.toString());
    const claimAmount = BigInt(Math.floor(amount * 10).toString()); // Convert to stored format
    console.log('[POST /create] Balance check:', { available: availableBalance.toString(), requested: claimAmount.toString() });

    if (claimAmount > availableBalance) {
      console.log('[POST /create] Insufficient funds');
      return res.status(400).json({ 
        error: 'Insufficient funds in claims pool',
        requested: (claimAmount / BigInt(10)).toString(),
        available: (availableBalance / BigInt(10)).toString()
      });
    }

    console.log('[POST /create] Creating claim record...');
    // Create claim with approved status (automatic payout on critical flood level)
    const newClaim = await db.insert(claims).values({
      policyId: policyId.toString(),
      policyholder,
      amount: claimAmount.toString(),
      status: 'approved', // Auto-approved when flood is critical
      triggeredAt: new Date(),
      processedAt: new Date(),
    }).returning();
    console.log('[POST /create] Claim created with ID:', newClaim[0].id);

    console.log('[POST /create] Updating pool balance...');
    // Deduct from pool
    const newBalance = availableBalance - claimAmount;
    const newProcessed = BigInt(pool[0].totalClaimsProcessed.toString()) + claimAmount;
    
    await db.update(claimsPool).set({
      availableBalance: newBalance.toString(),
      totalClaimsProcessed: newProcessed.toString(),
      updatedAt: new Date(),
    }).where(eq(claimsPool.id, pool[0].id));
    console.log('[POST /create] Pool updated');

    console.log('[POST /create] Marking policy as claimed...');
    // Mark the policy as claimed (payoutTriggered = true)
    await db.update(policies)
      .set({ payoutTriggered: true })
      .where(eq(policies.id, parseInt(policyId)));
    console.log('[POST /create] Policy marked as claimed');

    console.log('[POST /create] Sending success response');
    res.status(201).json({
      id: newClaim[0].id,
      message: 'Claim created and approved for payout',
      claim: newClaim[0],
      poolStatus: {
        availableBalance: (newBalance / BigInt(10)).toString(),
        totalClaimsProcessed: (newProcessed / BigInt(10)).toString(),
      }
    });
  } catch (error) {
    console.error('[POST /create] Error caught:', error);
    res.status(500).json({ error: 'Failed to create claim' });
  }
});

// GET /api/v1/claims/pool/status - get claims pool status
router.get('/pool/status', async (req, res) => {
  try {
    const pool = await db.select().from(claimsPool).limit(1);
    if (pool.length === 0) {
      return res.json({ totalCapacity: '0', availableBalance: '0', totalClaimsProcessed: '0' });
    }
    // Return formatted values (divide by 10 for display)
    res.json({
      totalCapacity: (BigInt(pool[0].totalCapacity.toString()) / BigInt(10)).toString(),
      availableBalance: (BigInt(pool[0].availableBalance.toString()) / BigInt(10)).toString(),
      totalClaimsProcessed: (BigInt(pool[0].totalClaimsProcessed.toString()) / BigInt(10)).toString(),
    });
  } catch (error) {
    console.error('Error fetching pool status:', error);
    res.json({ totalCapacity: '0', availableBalance: '0', totalClaimsProcessed: '0' });
  }
});

// POST /api/v1/claims/:id/review - manual admin review
router.post('/:id/review', async (req, res) => {
  try {
    const { status } = req.body; // approved or rejected
    await db.update(claims).set({ status, processedAt: new Date() }).where(eq(claims.id, parseInt(req.params.id)));
    res.json({ message: 'Claim reviewed', status });
  } catch (error) {
    console.error('Error updating claim:', error);
    res.status(500).json({ error: 'Failed to update claim' });
  }
});

// GET /api/v1/claims - list all claims
router.get('/', async (req, res) => {
  try {
    const allClaims = await db.select().from(claims);
    res.json(allClaims || []);
  } catch (error) {
    console.error('Error fetching claims:', error);
    res.json([]); // Return empty array on error
  }
});

// GET /api/v1/claims/:id - get single claim
router.get('/:id', async (req, res) => {
  try {
    const claim = await db.select().from(claims).where(eq(claims.id, parseInt(req.params.id)));
    if (claim.length === 0) {
      return res.status(404).json({ error: 'Claim not found' });
    }
    res.json(claim[0]);
  } catch (error) {
    console.error('Error fetching claim:', error);
    res.status(500).json({ error: 'Failed to fetch claim' });
  }
});

export default router;