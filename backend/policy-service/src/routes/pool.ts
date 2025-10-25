import { Router } from 'express';
import { ethers } from 'ethers';
import { db } from '../db';
import { poolReserve, claimsPool } from '../db/schema';

const router = Router();

router.get('/', async (req, res) => {
  try {
    // Fetch from unified pool (claims pool now serves as the main pool)
    const pool = await db.select().from(claimsPool).limit(1);
    if (pool.length === 0) {
      return res.json({ tvl: 100, availableBalance: 100, reserveRatio: 100 });
    }

    // Convert back to display format (divide by 10)
    const tvl = Number(pool[0].totalCapacity.toString()) / 10;
    const available = Number(pool[0].availableBalance.toString()) / 10;

    res.json({
      tvl: tvl,
      availableBalance: available,
      reserveRatio: 100
    });
  } catch (error) {
    console.error('Error fetching pool data:', error);
    res.json({ tvl: 100, availableBalance: 100, reserveRatio: 100 });
  }
});

export { router as poolRouter };