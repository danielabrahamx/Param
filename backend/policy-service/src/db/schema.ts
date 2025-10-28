import { pgTable, serial, varchar, integer, timestamp, boolean, decimal, text } from 'drizzle-orm/pg-core';

export const policies = pgTable('policies', {
  id: serial('id').primaryKey(),
  policyAddress: varchar('policy_address', { length: 42 }).notNull(),
  coverage: decimal('coverage', { precision: 18, scale: 1 }).notNull(),
  premium: decimal('premium', { precision: 18, scale: 2 }).notNull(),
  policyholder: varchar('policyholder', { length: 42 }).notNull(),
  payoutTriggered: boolean('payout_triggered').default(false),
  createdAt: timestamp('created_at').defaultNow(),
});

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  address: varchar('address', { length: 42 }).unique().notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const claims = pgTable('claims', {
  id: serial('id').primaryKey(),
  policyId: integer('policy_id').notNull(),
  policyholder: varchar('policyholder', { length: 42 }).notNull(),
  amount: decimal('amount', { precision: 18, scale: 0 }).notNull(),
  status: text('status').notNull(), // pending, approved, rejected
  triggeredAt: timestamp('triggered_at').defaultNow(),
  processedAt: timestamp('processed_at'),
});

export const payouts = pgTable('payouts', {
  id: serial('id').primaryKey(),
  claimId: integer('claim_id').references(() => claims.id),
  amount: decimal('amount', { precision: 18, scale: 0 }).notNull(),
  txHash: text('tx_hash'),
  processedAt: timestamp('processed_at').defaultNow(),
});

export const poolReserve = pgTable('pool_reserve', {
  id: serial('id').primaryKey(),
  totalLiquidity: decimal('total_liquidity', { precision: 18, scale: 0 }).notNull(),
  totalReserves: decimal('total_reserves', { precision: 18, scale: 0 }).notNull(),
  reserveRatio: integer('reserve_ratio').notNull(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const claimsPool = pgTable('claims_pool', {
  id: serial('id').primaryKey(),
  totalCapacity: decimal('total_capacity', { precision: 18, scale: 0 }).notNull().default('0'), // Total capital available for claims
  availableBalance: decimal('available_balance', { precision: 18, scale: 0 }).notNull().default('0'), // Available after claims
  totalClaimsProcessed: decimal('total_claims_processed', { precision: 18, scale: 0 }).notNull().default('0'),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const syncState = pgTable('sync_state', {
  id: serial('id').primaryKey(),
  service: varchar('service', { length: 100 }).notNull().unique(), // e.g., 'policy-sync', 'claim-sync'
  lastSyncedBlock: integer('last_synced_block').notNull().default(0),
  lastSyncTime: timestamp('last_sync_time').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});