import { db } from '../db';
import { policyMetrics, claimMetrics, poolMetrics, revenueMetrics } from '../db/schema';
import { cacheService } from './cacheService';
import pino from 'pino';
import { desc } from 'drizzle-orm';

const logger = pino();

export interface DashboardMetrics {
  timestamp: number;
  policies: {
    total: number;
    active: number;
    expired: number;
    totalCoverage: string;
  };
  claims: {
    total: number;
    approved: number;
    denied: number;
    payoutRatio: string;
    totalPayout: string;
  };
  pool: {
    tvl: string;
    liquidity: string;
    reserveRatio: string;
    utilization: string;
  };
  revenue: {
    premiums: string;
    expenses: string;
    netRevenue: string;
    profitMargin: string;
  };
}

export class AnalyticsService {
  async getDashboardMetrics(): Promise<DashboardMetrics> {
    const cacheKey = 'dashboard_metrics';

    // Try cache first
    const cachedMetrics = await cacheService.get<DashboardMetrics>(cacheKey);
    if (cachedMetrics) {
      logger.info('Dashboard metrics retrieved from cache');
      return cachedMetrics;
    }

    try {
      // Fetch latest metrics from database
      const policyData = await db
        .select()
        .from(policyMetrics)
        .orderBy(desc(policyMetrics.timestamp))
        .limit(1);

      const claimData = await db
        .select()
        .from(claimMetrics)
        .orderBy(desc(claimMetrics.timestamp))
        .limit(1);

      const poolData = await db
        .select()
        .from(poolMetrics)
        .orderBy(desc(poolMetrics.timestamp))
        .limit(1);

      const revenueData = await db
        .select()
        .from(revenueMetrics)
        .orderBy(desc(revenueMetrics.timestamp))
        .limit(1);

      const metrics: DashboardMetrics = {
        timestamp: Date.now(),
        policies: {
          total: Number(policyData[0]?.totalPolicies || 0),
          active: Number(policyData[0]?.activePolicies || 0),
          expired: Number(policyData[0]?.expiredPolicies || 0),
          totalCoverage: policyData[0]?.totalCoverage?.toString() || '0',
        },
        claims: {
          total: Number(claimData[0]?.totalClaims || 0),
          approved: Number(claimData[0]?.approvedClaims || 0),
          denied: Number(claimData[0]?.deniedClaims || 0),
          payoutRatio: claimData[0]?.claimPayoutRatio?.toString() || '0',
          totalPayout: claimData[0]?.totalPayoutAmount?.toString() || '0',
        },
        pool: {
          tvl: poolData[0]?.totalValueLocked?.toString() || '0',
          liquidity: poolData[0]?.availableLiquidity?.toString() || '0',
          reserveRatio: poolData[0]?.reserveRatio?.toString() || '0',
          utilization: poolData[0]?.poolUtilizationRate?.toString() || '0',
        },
        revenue: {
          premiums: revenueData[0]?.totalPremiumsReceived?.toString() || '0',
          expenses: revenueData[0]?.operatingExpenses?.toString() || '0',
          netRevenue: revenueData[0]?.netRevenue?.toString() || '0',
          profitMargin: revenueData[0]?.profitMargin?.toString() || '0',
        },
      };

      // Cache for 5 minutes
      await cacheService.set(cacheKey, metrics, 300);

      return metrics;
    } catch (err) {
      logger.error({ err }, `Failed to get dashboard metrics`);
      throw err;
    }
  }

  async getPolicyMetrics(limit_val: number = 30): Promise<any[]> {
    const cacheKey = `policy_metrics_${limit_val}days`;

    const cachedData = await cacheService.get<any[]>(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    try {
      const data = await db
        .select()
        .from(policyMetrics)
        .orderBy(desc(policyMetrics.timestamp))
        .limit(limit_val);

      await cacheService.set(cacheKey, data, 600);
      return data;
    } catch (err) {
      logger.error({ err }, `Failed to get policy metrics`);
      throw err;
    }
  }

  async getClaimMetrics(limit_val: number = 30): Promise<any[]> {
    const cacheKey = `claim_metrics_${limit_val}days`;

    const cachedData = await cacheService.get<any[]>(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    try {
      const data = await db
        .select()
        .from(claimMetrics)
        .orderBy(desc(claimMetrics.timestamp))
        .limit(limit_val);

      await cacheService.set(cacheKey, data, 600);
      return data;
    } catch (err) {
      logger.error({ err }, `Failed to get claim metrics`);
      throw err;
    }
  }

  async getPoolMetrics(limit_val: number = 30): Promise<any[]> {
    const cacheKey = `pool_metrics_${limit_val}days`;

    const cachedData = await cacheService.get<any[]>(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    try {
      const data = await db
        .select()
        .from(poolMetrics)
        .orderBy(desc(poolMetrics.timestamp))
        .limit(limit_val);

      await cacheService.set(cacheKey, data, 600);
      return data;
    } catch (err) {
      logger.error({ err }, `Failed to get pool metrics`);
      throw err;
    }
  }

  async getRevenueMetrics(limit_val: number = 30): Promise<any[]> {
    const cacheKey = `revenue_metrics_${limit_val}days`;

    const cachedData = await cacheService.get<any[]>(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    try {
      const data = await db
        .select()
        .from(revenueMetrics)
        .orderBy(desc(revenueMetrics.timestamp))
        .limit(limit_val);

      await cacheService.set(cacheKey, data, 600);
      return data;
    } catch (err) {
      logger.error({ err }, `Failed to get revenue metrics`);
      throw err;
    }
  }
}

export const analyticsService = new AnalyticsService();
