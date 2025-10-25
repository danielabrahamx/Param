import { pgTable, uuid, varchar, bigint, numeric, timestamp, index } from 'drizzle-orm/pg-core';

export const analyticsSnapshots = pgTable(
  'analytics_snapshots',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    timestamp: timestamp('timestamp').defaultNow(),
    metric: varchar('metric', { length: 100 }).notNull(), // 'pool_tvl', 'active_policies', 'claims_payout_ratio', etc.
    value: numeric('value', { precision: 20, scale: 2 }).notNull(),
    metadata: varchar('metadata', { length: 500 }),
    createdAt: timestamp('created_at').defaultNow(),
  },
  (table) => ({
    metricIdx: index('analytics_snapshots_metric_idx').on(table.metric),
    timestampIdx: index('analytics_snapshots_timestamp_idx').on(table.timestamp),
  })
);

export const policyMetrics = pgTable(
  'policy_metrics',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    timestamp: timestamp('timestamp').defaultNow(),
    totalPolicies: bigint('total_policies', { mode: 'number' }).default(0),
    activePolicies: bigint('active_policies', { mode: 'number' }).default(0),
    expiredPolicies: bigint('expired_policies', { mode: 'number' }).default(0),
    totalCoverage: numeric('total_coverage', { precision: 20, scale: 2 }).default('0'),
    totalPremiumsCollected: numeric('total_premiums_collected', { precision: 20, scale: 2 }).default('0'),
    averagePolicySize: numeric('average_policy_size', { precision: 20, scale: 2 }).default('0'),
    geographicDistribution: varchar('geographic_distribution', { length: 1000 }),
    createdAt: timestamp('created_at').defaultNow(),
  },
  (table) => ({
    timestampIdx: index('policy_metrics_timestamp_idx').on(table.timestamp),
  })
);

export const claimMetrics = pgTable(
  'claim_metrics',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    timestamp: timestamp('timestamp').defaultNow(),
    totalClaims: bigint('total_claims', { mode: 'number' }).default(0),
    approvedClaims: bigint('approved_claims', { mode: 'number' }).default(0),
    deniedClaims: bigint('denied_claims', { mode: 'number' }).default(0),
    totalPayoutAmount: numeric('total_payout_amount', { precision: 20, scale: 2 }).default('0'),
    averageClaimAmount: numeric('average_claim_amount', { precision: 20, scale: 2 }).default('0'),
    claimPayoutRatio: numeric('claim_payout_ratio', { precision: 5, scale: 2 }).default('0'),
    averageClaimProcessingTimeHours: numeric('average_claim_processing_time_hours', { precision: 10, scale: 2 }).default('0'),
    createdAt: timestamp('created_at').defaultNow(),
  },
  (table) => ({
    timestampIdx: index('claim_metrics_timestamp_idx').on(table.timestamp),
  })
);

export const poolMetrics = pgTable(
  'pool_metrics',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    timestamp: timestamp('timestamp').defaultNow(),
    totalValueLocked: numeric('total_value_locked', { precision: 20, scale: 2 }).default('0'),
    availableLiquidity: numeric('available_liquidity', { precision: 20, scale: 2 }).default('0'),
    reserveRatio: numeric('reserve_ratio', { precision: 5, scale: 2 }).default('0'),
    requiredReserveRatio: numeric('required_reserve_ratio', { precision: 5, scale: 2 }).default('150'),
    totalDeposits: numeric('total_deposits', { precision: 20, scale: 2 }).default('0'),
    totalPayouts: numeric('total_payouts', { precision: 20, scale: 2 }).default('0'),
    poolUtilizationRate: numeric('pool_utilization_rate', { precision: 5, scale: 2 }).default('0'),
    createdAt: timestamp('created_at').defaultNow(),
  },
  (table) => ({
    timestampIdx: index('pool_metrics_timestamp_idx').on(table.timestamp),
  })
);

export const revenueMetrics = pgTable(
  'revenue_metrics',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    timestamp: timestamp('timestamp').defaultNow(),
    totalPremiumsReceived: numeric('total_premiums_received', { precision: 20, scale: 2 }).default('0'),
    totalClaimsProcessed: numeric('total_claims_processed', { precision: 20, scale: 2 }).default('0'),
    netRevenue: numeric('net_revenue', { precision: 20, scale: 2 }).default('0'),
    operatingExpenses: numeric('operating_expenses', { precision: 20, scale: 2 }).default('0'),
    profitMargin: numeric('profit_margin', { precision: 5, scale: 2 }).default('0'),
    createdAt: timestamp('created_at').defaultNow(),
  },
  (table) => ({
    timestampIdx: index('revenue_metrics_timestamp_idx').on(table.timestamp),
  })
);
