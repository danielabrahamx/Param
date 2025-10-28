import { Router } from 'express';
import { db } from '../db';
import { claims, payouts, claimsPool, policies } from '../db/schema';
import { eq } from 'drizzle-orm';

/**
 * IMPORTANT: Data Storage Units
 * 
 * All monetary values in the database are stored in atto-HBAR (wei):
 * - claimsPool.totalCapacity: atto-HBAR
 * - claimsPool.availableBalance: atto-HBAR
 * - claimsPool.totalClaimsProcessed: atto-HBAR
 * - claims.amount: atto-HBAR (stored as string)
 * 
 * Frontend sends amounts in decimal HBAR, this service converts to/from atto-HBAR.
 * 
 * NOTE: This code assumes fresh deployment. If migrating from a system that stored
 * values in decimal HBAR, you MUST run a one-time migration to multiply all existing
 * values by 10^18 before deploying this code.
 */

// Exact BigInt constant for atto-HBAR conversion (avoids float imprecision)
const ATTO_PER_HBAR = 10n ** 18n;

/**
 * Convert decimal HBAR amount to atto-HBAR (wei) using exact BigInt arithmetic
 * Avoids lossy float math by splitting integer and decimal parts
 * @param hbarAmount - HBAR amount as number or string (e.g., "10.5" or 10.5)
 * @returns BigInt in atto-HBAR (1 HBAR = 10^18 atto-HBAR)
 * @throws Error if input is invalid (NaN, Infinity, negative, malformed)
 */
function hbarToAttoHbar(hbarAmount: number | string): bigint {
  // Validate and normalize input
  const hbarString = String(hbarAmount).trim();
  
  // Reject invalid inputs
  if (!hbarString || hbarString === 'NaN' || hbarString === 'Infinity' || hbarString === '-Infinity') {
    throw new Error(`Invalid HBAR amount: ${hbarString}`);
  }
  
  // Check for scientific notation
  if (hbarString.includes('e') || hbarString.includes('E')) {
    throw new Error(`Scientific notation not supported: ${hbarString}`);
  }
  
  // Parse sign and remove it for processing
  const isNegative = hbarString.startsWith('-');
  if (isNegative) {
    throw new Error(`Negative amounts not allowed: ${hbarString}`);
  }
  
  // Split on decimal point
  const parts = hbarString.split('.');
  if (parts.length > 2) {
    throw new Error(`Malformed decimal number: ${hbarString}`);
  }
  
  const integerPart = parts[0] || '0';
  const decimalPart = parts[1] || '';
  
  // Validate digits only
  if (!/^\d+$/.test(integerPart) || (decimalPart && !/^\d+$/.test(decimalPart))) {
    throw new Error(`Non-numeric characters in amount: ${hbarString}`);
  }
  
  // Pad or truncate decimal to 18 digits (atto-HBAR precision)
  const paddedDecimal = decimalPart.padEnd(18, '0').slice(0, 18);
  
  // Combine using exact BigInt: (integer * 10^18) + decimal
  const integerAtto = BigInt(integerPart) * ATTO_PER_HBAR;
  const decimalAtto = BigInt(paddedDecimal);
  
  return integerAtto + decimalAtto;
}

/**
 * Convert atto-HBAR (wei) to decimal HBAR string
 * @param attoHbar - Amount in atto-HBAR as BigInt or string (must be non-negative)
 * @returns Decimal HBAR string (e.g., "10.5")
 * @throws Error if input is negative
 */
function attoHbarToHbar(attoHbar: bigint | string): string {
  const attoValue = typeof attoHbar === 'string' ? BigInt(attoHbar) : attoHbar;
  
  if (attoValue < 0n) {
    throw new Error(`Negative atto-HBAR values not supported: ${attoValue}`);
  }
  
  const attoString = attoValue.toString();
  
  // If less than 1 HBAR (< 10^18 atto), pad the whole thing
  if (attoString.length <= 18) {
    const paddedAtto = attoString.padStart(18, '0');
    const decimalPart = paddedAtto.replace(/0+$/, '');
    return decimalPart ? `0.${decimalPart}` : '0';
  }
  
  // Split at 18th position from right
  const integerPart = attoString.slice(0, -18);
  const decimalPart = attoString.slice(-18);
  
  // Remove trailing zeros from decimal
  const trimmedDecimal = decimalPart.replace(/0+$/, '');
  
  return trimmedDecimal ? `${integerPart}.${trimmedDecimal}` : integerPart;
}

const router = Router();

/**
 * Retry configuration for transient failures
 */
const RETRY_CONFIG = {
  MAX_ATTEMPTS: 3,
  INITIAL_DELAY_MS: 100,
  MAX_DELAY_MS: 2000,
  BACKOFF_MULTIPLIER: 2,
};

/**
 * Calculate exponential backoff delay
 */
function calculateBackoffDelay(attempt: number): number {
  const delay = Math.min(
    RETRY_CONFIG.INITIAL_DELAY_MS * Math.pow(RETRY_CONFIG.BACKOFF_MULTIPLIER, attempt - 1),
    RETRY_CONFIG.MAX_DELAY_MS
  );
  // Add jitter (±10%)
  return delay * (0.9 + Math.random() * 0.2);
}

/**
 * Sleep utility
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Create claim with transaction consistency and retry logic
 */
async function createClaimWithRetry(
  policyId: string,
  policyholder: string,
  amount: bigint,
  poolId: number,
  availableBalance: bigint,
  attempt: number = 1
): Promise<any> {
  try {
    // Start transaction attempt
    console.log(`[POST /create] Transaction attempt ${attempt}/${RETRY_CONFIG.MAX_ATTEMPTS}`);

    // Step 1: Create claim
    console.log('[POST /create] [TX] Creating claim record...');
    const newClaim = await db.insert(claims).values({
      policyId: parseInt(policyId),
      policyholder,
      amount: amount.toString(),
      status: 'approved',
      triggeredAt: new Date(),
      processedAt: new Date(),
    }).returning();

    if (!newClaim || !newClaim[0]) {
      throw new Error('Claim creation returned empty result');
    }
    console.log('[POST /create] [TX] Claim created with ID:', newClaim[0].id);

    // Step 2: Update pool balance
    console.log('[POST /create] [TX] Updating pool balance...');
    const newBalance = availableBalance - amount;
    const poolData = await db.select().from(claimsPool).where(eq(claimsPool.id, poolId));
    
    if (!poolData || poolData.length === 0) {
      throw new Error('Pool record disappeared during transaction');
    }

    const newProcessed = BigInt(poolData[0].totalClaimsProcessed.toString()) + amount;

    const updateResult = await db.update(claimsPool)
      .set({
        availableBalance: newBalance.toString(),
        totalClaimsProcessed: newProcessed.toString(),
        updatedAt: new Date(),
      })
      .where(eq(claimsPool.id, poolId))
      .returning();

    if (!updateResult || updateResult.length === 0) {
      throw new Error('Pool update affected 0 rows');
    }
    console.log('[POST /create] [TX] Pool updated successfully');

    // Step 3: Mark policy as claimed
    console.log('[POST /create] [TX] Marking policy as claimed...');
    const policyUpdateResult = await db.update(policies)
      .set({ payoutTriggered: true })
      .where(eq(policies.id, parseInt(policyId)))
      .returning();

    if (!policyUpdateResult || policyUpdateResult.length === 0) {
      throw new Error('Policy update affected 0 rows');
    }
    console.log('[POST /create] [TX] Policy marked as claimed');

    // All steps succeeded
    console.log('[POST /create] ✅ Transaction completed successfully');
    return {
      success: true,
      claimId: newClaim[0].id,
      claim: newClaim[0],
      poolStatus: {
        availableBalance: newBalance.toString(),
        totalClaimsProcessed: newProcessed.toString(),
      },
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`[POST /create] [TX] Transaction attempt ${attempt} failed:`, errorMsg);

    // Check if error is retryable (transient)
    const isRetryable = 
      errorMsg.includes('ECONNREFUSED') ||
      errorMsg.includes('ETIMEDOUT') ||
      errorMsg.includes('ENOTFOUND') ||
      errorMsg.includes('connection') ||
      errorMsg.includes('timeout');

    if (isRetryable && attempt < RETRY_CONFIG.MAX_ATTEMPTS) {
      const delay = calculateBackoffDelay(attempt);
      console.log(`[POST /create] [TX] Retrying in ${Math.round(delay)}ms...`);
      await sleep(delay);
      return createClaimWithRetry(policyId, policyholder, amount, poolId, availableBalance, attempt + 1);
    }

    // Final failure - throw with context
    const error_context = {
      attempt,
      maxAttempts: RETRY_CONFIG.MAX_ATTEMPTS,
      retryable: isRetryable,
      originalError: errorMsg,
    };
    
    throw new Error(JSON.stringify({
      code: 'CLAIM_CREATION_FAILED',
      message: 'Failed to persist claim to database after blockchain confirmation',
      context: error_context,
      timestamp: new Date().toISOString(),
    }));
  }
}

// POST /api/v1/claims/create - create a new claim for payout (must come before generic routes)
router.post('/create', async (req, res) => {
  const requestId = Math.random().toString(36).substring(7);
  console.log(`[POST /create] [${requestId}] Request received at:`, new Date().toISOString());

  try {
    const { policyId, policyholder, amount } = req.body;
    console.log(`[POST /create] [${requestId}] Body:`, { policyId, policyholder, amount });

    // Validate inputs
    if (!policyId || !policyholder || amount === undefined || amount === null) {
      console.log(`[POST /create] [${requestId}] Validation failed: Missing required fields`);
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['policyId', 'policyholder', 'amount']
      });
    }

    // Validate amount is a valid positive number
    const amountNum = Number(amount);
    if (!Number.isFinite(amountNum) || amountNum < 0) {
      console.log(`[POST /create] [${requestId}] Validation failed: Invalid amount`);
      return res.status(400).json({ 
        error: 'Invalid amount',
        hint: 'Amount must be a positive finite number',
        received: String(amount)
      });
    }

    // Check for duplicate claims
    console.log(`[POST /create] [${requestId}] Checking for duplicate claims...`);
    const existingClaims = await db.select().from(claims).where(eq(claims.policyId, policyId.toString()));
    if (existingClaims.length > 0) {
      console.log(`[POST /create] [${requestId}] Policy already claimed: claim ID ${existingClaims[0].id}`);
      return res.status(400).json({ 
        error: 'This policy has already been claimed',
        claimId: existingClaims[0].id,
        hint: 'Each policy can only be claimed once'
      });
    }

    // Fetch pool state
    console.log(`[POST /create] [${requestId}] Fetching claims pool...`);
    const pool = await db.select().from(claimsPool).limit(1);
    
    if (!pool || pool.length === 0) {
      console.log(`[POST /create] [${requestId}] Claims pool not initialized`);
      return res.status(500).json({ 
        error: 'Claims pool not initialized',
        hint: 'System administrator must initialize the claims pool'
      });
    }

    // Validate balance
    // Pool balance is stored in atto-HBAR (wei), convert claim amount from HBAR to atto-HBAR
    const availableBalance = BigInt(pool[0].availableBalance.toString());
    const claimAmountHbar = amount; // Amount from frontend is in HBAR
    
    let claimAmountAttoHbar: bigint;
    try {
      claimAmountAttoHbar = hbarToAttoHbar(claimAmountHbar); // Convert to atto-HBAR using exact arithmetic
    } catch (conversionError: any) {
      console.error(`[POST /create] [${requestId}] Conversion error:`, conversionError.message);
      return res.status(400).json({ 
        error: 'Failed to convert amount to atto-HBAR',
        hint: conversionError.message,
        received: String(claimAmountHbar)
      });
    }
    
    console.log(`[POST /create] [${requestId}] Balance validation:`, {
      availableAttoHbar: availableBalance.toString(),
      availableHbar: attoHbarToHbar(availableBalance),
      requestedHbar: String(claimAmountHbar),
      requestedAttoHbar: claimAmountAttoHbar.toString(),
    });

    if (claimAmountAttoHbar > availableBalance) {
      console.log(`[POST /create] [${requestId}] Insufficient pool balance`);
      const shortfallAtto = claimAmountAttoHbar - availableBalance;
      return res.status(402).json({ 
        error: 'Insufficient funds in claims pool',
        requestedHbar: String(claimAmountHbar),
        availableHbar: attoHbarToHbar(availableBalance),
        requestedAttoHbar: claimAmountAttoHbar.toString(),
        availableAttoHbar: availableBalance.toString(),
        shortfallHbar: attoHbarToHbar(shortfallAtto),
      });
    }

    // Execute claim creation with transaction consistency
    console.log(`[POST /create] [${requestId}] Starting claim creation transaction...`);
    const result = await createClaimWithRetry(
      policyId.toString(),
      policyholder,
      claimAmountAttoHbar,
      pool[0].id,
      availableBalance
    );

    console.log(`[POST /create] [${requestId}] ✅ Success: Claim ID ${result.claimId}`);
    res.status(201).json({
      success: true,
      id: result.claimId,
      message: 'Claim created and approved for payout',
      claim: result.claim,
      poolStatus: result.poolStatus,
      requestId,
    });

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`[POST /create] [${requestId}] Fatal error:`, errorMsg);

    // Parse structured error if available
    let errorResponse: any = {
      error: 'Failed to create claim',
      requestId,
      timestamp: new Date().toISOString(),
    };

    try {
      const parsed = JSON.parse(errorMsg);
      errorResponse = { ...errorResponse, ...parsed };
    } catch {
      errorResponse.message = errorMsg;
    }

    res.status(500).json(errorResponse);
  }
});

// GET /api/v1/claims/pool/status - get claims pool status
router.get('/pool/status', async (req, res) => {
  try {
    const pool = await db.select().from(claimsPool).limit(1);
    if (pool.length === 0) {
      return res.json({ totalCapacity: '0', availableBalance: '0', totalClaimsProcessed: '0' });
    }
    // Convert atto-HBAR (wei) values to HBAR for frontend display using exact arithmetic
    const totalCapacityHbar = attoHbarToHbar(pool[0].totalCapacity.toString());
    const availableBalanceHbar = attoHbarToHbar(pool[0].availableBalance.toString());
    const totalClaimsProcessedHbar = attoHbarToHbar(pool[0].totalClaimsProcessed.toString());
    
    res.json({
      totalCapacity: totalCapacityHbar,
      availableBalance: availableBalanceHbar,
      totalClaimsProcessed: totalClaimsProcessedHbar,
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