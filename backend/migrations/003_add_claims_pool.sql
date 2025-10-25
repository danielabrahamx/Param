-- Add Claims Pool table for parametric insurance
-- This tracks the separate capital pool used for payouts

CREATE TABLE IF NOT EXISTS claims_pool (
  id SERIAL PRIMARY KEY,
  total_capacity DECIMAL(18, 0) NOT NULL DEFAULT 0,
  available_balance DECIMAL(18, 0) NOT NULL DEFAULT 0,
  total_claims_processed DECIMAL(18, 0) NOT NULL DEFAULT 0,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Initialize the claims pool with some capacity for testing
INSERT INTO claims_pool (total_capacity, available_balance, total_claims_processed)
VALUES (1000000000000000000, 1000000000000000000, 0);

CREATE INDEX idx_claims_pool_updated_at ON claims_pool(updated_at);
