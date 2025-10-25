import { Worker, Queue } from 'bullmq';
import pino from 'pino';
import { db } from '../db';
import { policyMetrics, claimMetrics, poolMetrics, revenueMetrics } from '../db/schema';

const logger = pino();

const redis = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
};

export const aggregationQueue = new Queue('analytics-aggregation', {
  connection: redis,
});

export const aggregationWorker = new Worker(
  'analytics-aggregation',
  async (job) => {
    logger.info(`Processing aggregation job: ${job.id}`);

    try {
      const aggregationType = job.data.type; // 'hourly' or 'daily'

      // Aggregate policy metrics
      await aggregatePolicyMetrics();

      // Aggregate claim metrics
      await aggregateClaimMetrics();

      // Aggregate pool metrics
      await aggregatePoolMetrics();

      // Aggregate revenue metrics
      await aggregateRevenueMetrics();

      logger.info(`Aggregation job ${job.id} completed for ${aggregationType}`);
      return { success: true, type: aggregationType };
    } catch (error) {
      logger.error(`Aggregation job ${job.id} failed: ${error}`);
      throw error;
    }
  },
  {
    connection: redis,
    concurrency: 1,
  }
);

aggregationWorker.on('completed', (job) => {
  logger.info(`Aggregation job ${job?.id} completed`);
});

aggregationWorker.on('failed', (job, err) => {
  logger.error(`Aggregation job ${job?.id} failed: ${err.message}`);
});

async function aggregatePolicyMetrics() {
  try {
    // Simulate aggregation - in production, this would query from policies table
    await db.insert(policyMetrics).values({
      totalPolicies: 1500,
      activePolicies: 1200,
      expiredPolicies: 300,
      totalCoverage: '150000000',
      totalPremiumsCollected: '15000000',
      averagePolicySize: '125000',
      geographicDistribution: JSON.stringify({
        region1: 300,
        region2: 450,
        region3: 450,
      }),
    });
    logger.info('Policy metrics aggregated');
  } catch (err) {
    logger.error(`Failed to aggregate policy metrics: ${err}`);
  }
}

async function aggregateClaimMetrics() {
  try {
    await db.insert(claimMetrics).values({
      totalClaims: 250,
      approvedClaims: 200,
      deniedClaims: 50,
      totalPayoutAmount: '5000000',
      averageClaimAmount: '25000',
      claimPayoutRatio: '33.33',
      averageClaimProcessingTimeHours: '24.5',
    });
    logger.info('Claim metrics aggregated');
  } catch (err) {
    logger.error(`Failed to aggregate claim metrics: ${err}`);
  }
}

async function aggregatePoolMetrics() {
  try {
    await db.insert(poolMetrics).values({
      totalValueLocked: '200000000',
      availableLiquidity: '100000000',
      reserveRatio: '200.00',
      requiredReserveRatio: '150.00',
      totalDeposits: '300000000',
      totalPayouts: '5000000',
      poolUtilizationRate: '50.00',
    });
    logger.info('Pool metrics aggregated');
  } catch (err) {
    logger.error(`Failed to aggregate pool metrics: ${err}`);
  }
}

async function aggregateRevenueMetrics() {
  try {
    await db.insert(revenueMetrics).values({
      totalPremiumsReceived: '15000000',
      totalClaimsProcessed: '5000000',
      netRevenue: '10000000',
      operatingExpenses: '2000000',
      profitMargin: '66.67',
    });
    logger.info('Revenue metrics aggregated');
  } catch (err) {
    logger.error(`Failed to aggregate revenue metrics: ${err}`);
  }
}

export async function scheduleAggregation() {
  try {
    // Schedule hourly aggregation
    await aggregationQueue.add(
      'hourly-aggregation',
      { type: 'hourly' },
      {
        repeat: {
          pattern: '0 * * * *', // Every hour
        },
        removeOnComplete: true,
      }
    );

    logger.info('Hourly aggregation scheduled');

    // Schedule daily aggregation
    await aggregationQueue.add(
      'daily-aggregation',
      { type: 'daily' },
      {
        repeat: {
          pattern: '0 0 * * *', // Every day at midnight
        },
        removeOnComplete: true,
      }
    );

    logger.info('Daily aggregation scheduled');
  } catch (err) {
    logger.error(`Failed to schedule aggregation: ${err}`);
  }
}
