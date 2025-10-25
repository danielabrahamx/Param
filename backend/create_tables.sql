-- Create all tables for Paramify
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  address VARCHAR(42) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS policies (
  id SERIAL PRIMARY KEY,
  policy_address VARCHAR(42) NOT NULL,
  coverage INTEGER NOT NULL,
  premium INTEGER NOT NULL,
  policyholder VARCHAR(42) NOT NULL,
  payout_triggered BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS claims (
  id SERIAL PRIMARY KEY,
  policy_id INTEGER NOT NULL,
  policyholder VARCHAR(42) NOT NULL,
  amount DECIMAL(18, 0) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  triggered_at TIMESTAMP DEFAULT NOW(),
  processed_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS payouts (
  id SERIAL PRIMARY KEY,
  claim_id INTEGER NOT NULL REFERENCES claims(id),
  amount DECIMAL(18, 0) NOT NULL,
  tx_hash TEXT,
  processed_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pool_reserve (
  id SERIAL PRIMARY KEY,
  total_liquidity DECIMAL(18, 0) NOT NULL DEFAULT 0,
  total_reserves DECIMAL(18, 0) NOT NULL DEFAULT 0,
  reserve_ratio INTEGER NOT NULL DEFAULT 150,
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS flood_readings (
  id SERIAL PRIMARY KEY,
  location VARCHAR(255) NOT NULL,
  level INTEGER NOT NULL,
  timestamp TIMESTAMP DEFAULT NOW()
);

-- Insert initial pool data
INSERT INTO pool_reserve (total_liquidity, total_reserves, reserve_ratio)
SELECT 50, 75, 150
WHERE NOT EXISTS (SELECT 1 FROM pool_reserve);

-- Insert sample flood reading
INSERT INTO flood_readings (location, level)
SELECT '1', 1500
WHERE NOT EXISTS (SELECT 1 FROM flood_readings WHERE location = '1');

CREATE EXTENSION IF NOT EXISTS timescaledb;
SELECT create_hypertable('flood_readings', 'timestamp', if_not_exists => TRUE);
