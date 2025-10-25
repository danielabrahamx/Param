import express from 'express';
import { db } from '../db';
import { policyMetrics, claimMetrics, poolMetrics } from '../db/schema';
import pino from 'pino';
import { desc } from 'drizzle-orm';

const logger = pino();
const router = express.Router();

// GET /metrics - Prometheus-format metrics
router.get('/', async (_req, res) => {
  try {
    // Fetch latest metrics
    const latestPolicy = await db
      .select()
      .from(policyMetrics)
      .orderBy(desc(policyMetrics.timestamp))
      .limit(1);

    const latestClaims = await db
      .select()
      .from(claimMetrics)
      .orderBy(desc(claimMetrics.timestamp))
      .limit(1);

    const latestPool = await db
      .select()
      .from(poolMetrics)
      .orderBy(desc(poolMetrics.timestamp))
      .limit(1);

    let prometheusMetrics = `# HELP active_policies Active insurance policies\n`;
    prometheusMetrics += `# TYPE active_policies gauge\n`;
    prometheusMetrics += `active_policies{service="analytics-service"} ${latestPolicy[0]?.activePolicies || 0}\n\n`;

    prometheusMetrics += `# HELP total_coverage Total coverage amount\n`;
    prometheusMetrics += `# TYPE total_coverage gauge\n`;
    prometheusMetrics += `total_coverage{service="analytics-service"} ${latestPolicy[0]?.totalCoverage || 0}\n\n`;

    prometheusMetrics += `# HELP total_claims Total claims submitted\n`;
    prometheusMetrics += `# TYPE total_claims counter\n`;
    prometheusMetrics += `total_claims{service="analytics-service"} ${latestClaims[0]?.totalClaims || 0}\n\n`;

    prometheusMetrics += `# HELP approved_claims Approved claims\n`;
    prometheusMetrics += `# TYPE approved_claims counter\n`;
    prometheusMetrics += `approved_claims{service="analytics-service"} ${latestClaims[0]?.approvedClaims || 0}\n\n`;

    prometheusMetrics += `# HELP claim_payout_ratio Claim payout ratio\n`;
    prometheusMetrics += `# TYPE claim_payout_ratio gauge\n`;
    prometheusMetrics += `claim_payout_ratio{service="analytics-service"} ${latestClaims[0]?.claimPayoutRatio || 0}\n\n`;

    prometheusMetrics += `# HELP pool_tvl Total value locked in pool\n`;
    prometheusMetrics += `# TYPE pool_tvl gauge\n`;
    prometheusMetrics += `pool_tvl{service="analytics-service"} ${latestPool[0]?.totalValueLocked || 0}\n\n`;

    prometheusMetrics += `# HELP pool_reserve_ratio Reserve ratio\n`;
    prometheusMetrics += `# TYPE pool_reserve_ratio gauge\n`;
    prometheusMetrics += `pool_reserve_ratio{service="analytics-service"} ${latestPool[0]?.reserveRatio || 0}\n\n`;

    prometheusMetrics += `# HELP pool_utilization Pool utilization rate\n`;
    prometheusMetrics += `# TYPE pool_utilization gauge\n`;
    prometheusMetrics += `pool_utilization{service="analytics-service"} ${latestPool[0]?.poolUtilizationRate || 0}\n\n`;

    res.set('Content-Type', 'text/plain; version=0.0.4');
    res.status(200).send(prometheusMetrics);
  } catch (error) {
    logger.error(`Failed to generate metrics: ${error}`);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

// GET /metrics/json - JSON format metrics
router.get('/json', async (_req, res) => {
  try {
    const latestPolicy = await db
      .select()
      .from(policyMetrics)
      .orderBy(desc(policyMetrics.timestamp))
      .limit(1);

    const latestClaims = await db
      .select()
      .from(claimMetrics)
      .orderBy(desc(claimMetrics.timestamp))
      .limit(1);

    const latestPool = await db
      .select()
      .from(poolMetrics)
      .orderBy(desc(poolMetrics.timestamp))
      .limit(1);

    const metrics = {
      timestamp: Date.now(),
      policies: {
        active: latestPolicy[0]?.activePolicies || 0,
        total: latestPolicy[0]?.totalPolicies || 0,
        totalCoverage: latestPolicy[0]?.totalCoverage || 0,
      },
      claims: {
        total: latestClaims[0]?.totalClaims || 0,
        approved: latestClaims[0]?.approvedClaims || 0,
        denied: latestClaims[0]?.deniedClaims || 0,
        payoutRatio: latestClaims[0]?.claimPayoutRatio || 0,
      },
      pool: {
        tvl: latestPool[0]?.totalValueLocked || 0,
        liquidity: latestPool[0]?.availableLiquidity || 0,
        reserveRatio: latestPool[0]?.reserveRatio || 0,
        utilization: latestPool[0]?.poolUtilizationRate || 0,
      },
    };

    res.status(200).json(metrics);
  } catch (error) {
    logger.error(`Failed to get metrics: ${error}`);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

export default router;
