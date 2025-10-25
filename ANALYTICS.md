# Analytics Service Documentation

## Overview

The Analytics Service provides comprehensive metrics and dashboards for the Paramify platform. It aggregates data from policies, claims, pool, and revenue metrics with caching for high-performance queries.

## Architecture

### Components

- **Analytics Service**: Core service for metrics aggregation and retrieval
- **Cache Service**: Redis-based caching for expensive queries
- **Aggregation Worker**: BullMQ scheduled jobs for hourly and daily aggregation
- **Metrics Exporter**: Prometheus-compatible metrics endpoint

### Database Schema

#### analytics_snapshots
General-purpose time-series metrics storage.

```sql
- id (UUID, PK)
- timestamp (timestamp) - When metric was recorded
- metric (varchar) - Metric name (pool_tvl, active_policies, etc.)
- value (numeric) - Metric value
- metadata (varchar) - Additional context
- createdAt (timestamp)
```

#### policy_metrics
Policy-specific aggregated metrics.

```sql
- id (UUID, PK)
- timestamp (timestamp) - Time of aggregation
- totalPolicies (bigint) - Total policies ever created
- activePolicies (bigint) - Currently active policies
- expiredPolicies (bigint) - Expired policies
- totalCoverage (numeric) - Total coverage amount
- totalPremiumsCollected (numeric) - Total premiums received
- averagePolicySize (numeric) - Average policy coverage
- geographicDistribution (varchar) - JSON of region distribution
- createdAt (timestamp)
```

#### claim_metrics
Claims aggregated metrics.

```sql
- id (UUID, PK)
- timestamp (timestamp) - Time of aggregation
- totalClaims (bigint) - Total claims submitted
- approvedClaims (bigint) - Claims approved for payout
- deniedClaims (bigint) - Claims denied
- totalPayoutAmount (numeric) - Total paid out
- averageClaimAmount (numeric) - Average claim size
- claimPayoutRatio (numeric) - Percentage (claims paid / premiums received)
- averageClaimProcessingTimeHours (numeric) - Avg processing time
- createdAt (timestamp)
```

#### pool_metrics
Insurance pool liquidity and reserve metrics.

```sql
- id (UUID, PK)
- timestamp (timestamp) - Time of aggregation
- totalValueLocked (numeric) - TVL in pool
- availableLiquidity (numeric) - Liquid reserves
- reserveRatio (numeric) - Current ratio (liquidity / payouts)
- requiredReserveRatio (numeric) - Minimum required ratio (150%)
- totalDeposits (numeric) - Total deposits received
- totalPayouts (numeric) - Total payouts made
- poolUtilizationRate (numeric) - Percentage (payouts / deposits)
- createdAt (timestamp)
```

#### revenue_metrics
Platform revenue and expense metrics.

```sql
- id (UUID, PK)
- timestamp (timestamp) - Time of aggregation
- totalPremiumsReceived (numeric) - Total premiums
- totalClaimsProcessed (numeric) - Total claims paid
- netRevenue (numeric) - Premiums - Claims
- operatingExpenses (numeric) - Platform expenses
- profitMargin (numeric) - Percentage margin
- createdAt (timestamp)
```

## API Endpoints

### Dashboard Metrics

**GET** `/api/v1/analytics/dashboard`

Get high-level dashboard metrics (cached for 5 minutes).

**Response:**
```json
{
  "success": true,
  "data": {
    "timestamp": 1729779600000,
    "policies": {
      "total": 1500,
      "active": 1200,
      "expired": 300,
      "totalCoverage": "150000000"
    },
    "claims": {
      "total": 250,
      "approved": 200,
      "denied": 50,
      "payoutRatio": "33.33",
      "totalPayout": "5000000"
    },
    "pool": {
      "tvl": "200000000",
      "liquidity": "100000000",
      "reserveRatio": "200.00",
      "utilization": "50.00"
    },
    "revenue": {
      "premiums": "15000000",
      "expenses": "2000000",
      "netRevenue": "10000000",
      "profitMargin": "66.67"
    }
  }
}
```

### Policy Metrics

**GET** `/api/v1/analytics/policies`

Get historical policy metrics.

**Query Parameters:**
- `limit` (int, default 30) - Number of records to return

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "metric-uuid",
      "timestamp": "2025-10-24T10:00:00Z",
      "totalPolicies": 1500,
      "activePolicies": 1200,
      "expiredPolicies": 300,
      "totalCoverage": "150000000",
      "totalPremiumsCollected": "15000000",
      "averagePolicySize": "125000",
      "geographicDistribution": "{\"region1\": 300, \"region2\": 450, \"region3\": 450}"
    }
  ],
  "count": 1
}
```

### Claim Metrics

**GET** `/api/v1/analytics/claims`

Get historical claim metrics.

**Query Parameters:**
- `limit` (int, default 30) - Number of records to return

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "metric-uuid",
      "timestamp": "2025-10-24T10:00:00Z",
      "totalClaims": 250,
      "approvedClaims": 200,
      "deniedClaims": 50,
      "totalPayoutAmount": "5000000",
      "averageClaimAmount": "25000",
      "claimPayoutRatio": "33.33",
      "averageClaimProcessingTimeHours": "24.5"
    }
  ],
  "count": 1
}
```

### Pool Metrics

**GET** `/api/v1/analytics/pool`

Get pool reserve and utilization metrics.

**Query Parameters:**
- `limit` (int, default 30) - Number of records to return

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "metric-uuid",
      "timestamp": "2025-10-24T10:00:00Z",
      "totalValueLocked": "200000000",
      "availableLiquidity": "100000000",
      "reserveRatio": "200.00",
      "requiredReserveRatio": "150.00",
      "totalDeposits": "300000000",
      "totalPayouts": "5000000",
      "poolUtilizationRate": "50.00"
    }
  ],
  "count": 1
}
```

### Revenue Metrics

**GET** `/api/v1/analytics/revenue`

Get revenue and expense metrics.

**Query Parameters:**
- `limit` (int, default 30) - Number of records to return

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "metric-uuid",
      "timestamp": "2025-10-24T10:00:00Z",
      "totalPremiumsReceived": "15000000",
      "totalClaimsProcessed": "5000000",
      "netRevenue": "10000000",
      "operatingExpenses": "2000000",
      "profitMargin": "66.67"
    }
  ],
  "count": 1
}
```

## Metrics Endpoint

### Prometheus Metrics

**GET** `/metrics`

Exposed in Prometheus text format.

**Metrics:**
- `active_policies` - Current active policies count
- `total_coverage` - Total coverage amount
- `total_claims` - Total claims ever submitted
- `approved_claims` - Total approved claims
- `claim_payout_ratio` - Claims paid as percentage
- `pool_tvl` - Total value locked in pool
- `pool_reserve_ratio` - Current reserve ratio
- `pool_utilization` - Pool utilization percentage

### JSON Metrics

**GET** `/metrics/json`

Same metrics in JSON format.

```json
{
  "timestamp": 1729779600000,
  "policies": {
    "active": 1200,
    "total": 1500,
    "totalCoverage": 150000000
  },
  "claims": {
    "total": 250,
    "approved": 200,
    "denied": 50,
    "payoutRatio": 33.33
  },
  "pool": {
    "tvl": 200000000,
    "liquidity": 100000000,
    "reserveRatio": 200,
    "utilization": 50
  }
}
```

## Aggregation Jobs

### Scheduled Tasks

The service runs two scheduled aggregation jobs:

#### Hourly Aggregation
- **Schedule:** Every hour (0 * * * *)
- **Task:** Aggregate metrics from policies, claims, pool, revenue
- **Retention:** Latest 24 hours in memory, 30 days in DB

#### Daily Aggregation
- **Schedule:** Every day at midnight UTC (0 0 * * *)
- **Task:** Compute daily summary metrics
- **Retention:** Latest 90 days

### Aggregation Process

1. Query source tables (policies, claims, pool_reserve)
2. Calculate derived metrics (averages, ratios, totals)
3. Insert into metrics tables
4. Invalidate cache for affected metrics
5. Expose via Prometheus

## Caching Strategy

### Cache Keys

| Metric | TTL | Key |
|--------|-----|-----|
| Dashboard | 5 min | `dashboard_metrics` |
| Policy Metrics | 10 min | `policy_metrics_30days` |
| Claim Metrics | 10 min | `claim_metrics_30days` |
| Pool Metrics | 10 min | `pool_metrics_30days` |
| Revenue Metrics | 10 min | `revenue_metrics_30days` |

### Cache Invalidation

Cache is automatically invalidated:
- When aggregation jobs complete
- After policy/claim state changes
- Manually via admin endpoints (future)

## Environment Variables

```env
# Database
DATABASE_URL=postgres://user:password@localhost:5432/param

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Server
PORT=3005
NODE_ENV=production
```

## Metrics Computed

### Key Performance Indicators (KPIs)

**Policy Metrics:**
- Active policies: Count of non-expired policies
- Total coverage: Sum of all policy coverages
- Average policy size: Total coverage / active policies
- Premium collection: Total premiums received

**Claim Metrics:**
- Claim payout ratio: Total payouts / Total premiums
- Average claim processing time: Avg hours from claim to payout
- Approval rate: Approved claims / Total claims
- Average claim size: Total payouts / Total claims

**Pool Metrics:**
- Reserve ratio: Available liquidity / Total payouts (should be >150%)
- Pool utilization: Total payouts / Total deposits
- Available liquidity: Deposits - Payouts
- Threshold alerts: Reserve < 150% required

**Revenue Metrics:**
- Net revenue: Total premiums - Total payouts
- Profit margin: Net revenue / Total premiums
- Operating expenses: Platform running costs
- ROI: (Net revenue - Expenses) / Deposits

## Dashboard Recommendations

### Admin Dashboard Display

1. **Top Cards:**
   - Active Policies: {{policies.active}}
   - Total Coverage: {{policies.totalCoverage | currency}}
   - Pool TVL: {{pool.tvl | currency}}
   - Reserve Ratio: {{pool.reserveRatio}}% (Alert if <150%)

2. **Charts:**
   - Policies over time (line chart)
   - Claims approved vs denied (pie chart)
   - Pool utilization rate (gauge)
   - Revenue vs expenses (stacked bar chart)

3. **Alerts:**
   - Reserve ratio below 150%
   - Claims payout ratio trending >40%
   - Sudden policy drop-off
   - Pending claims >48 hours

## Deployment

### Docker

```bash
# Build
docker build -t analytics-service:latest ./analytics-service

# Run
docker run -e DATABASE_URL=... analytics-service:latest
```

### Docker Compose

```bash
docker compose up analytics-service
```

### Health Checks

**Liveness:** `GET /health`
**Readiness:** `GET /health/ready`

## Performance Optimization

### Query Optimization

- All metrics indexed by timestamp
- Queries limited to last 30 days by default
- Aggregation happens offline in scheduled jobs
- Real-time dashboard pulls from cache (5-min staleness acceptable)

### Caching Strategy

- Dashboard metrics: 5-min cache (frequent views)
- Historical metrics: 10-min cache (less frequent)
- Invalidate on cache miss (eventual consistency)

### Database Indexes

```sql
CREATE INDEX idx_policy_metrics_timestamp ON policy_metrics(timestamp DESC);
CREATE INDEX idx_claim_metrics_timestamp ON claim_metrics(timestamp DESC);
CREATE INDEX idx_pool_metrics_timestamp ON pool_metrics(timestamp DESC);
CREATE INDEX idx_revenue_metrics_timestamp ON revenue_metrics(timestamp DESC);
CREATE INDEX idx_analytics_snapshots_metric ON analytics_snapshots(metric);
CREATE INDEX idx_analytics_snapshots_timestamp ON analytics_snapshots(timestamp DESC);
```

## Troubleshooting

### Stale Metrics

1. Check if aggregation job ran: Check BullMQ logs
2. Verify schedule: Should run hourly and daily
3. Check Redis connectivity
4. Force cache clear: Restart service

### Missing Data

1. Verify source tables have data (policies, claims)
2. Check database connectivity
3. Review aggregation worker logs for errors
4. Manual aggregation trigger (future feature)

### High Latency

1. Check query performance: `EXPLAIN ANALYZE`
2. Verify indexes exist
3. Check Redis connectivity and performance
4. Review number of records in tables

## Future Enhancements

- Real-time metrics streaming (WebSocket)
- Custom metric builder UI
- Export to data warehouse
- Anomaly detection alerts
- Predictive analytics (flood season forecasting)
- Cohort analysis tools
