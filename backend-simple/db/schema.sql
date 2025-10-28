-- Paramify Database Schema
-- All monetary values stored in atto-HBAR (1 HBAR = 10^18 atto-HBAR)

-- Policies table
CREATE TABLE IF NOT EXISTS policies (
    id SERIAL PRIMARY KEY,
    policy_address VARCHAR(42) NOT NULL UNIQUE,
    policyholder VARCHAR(42) NOT NULL,
    coverage BIGINT NOT NULL,
    premium BIGINT NOT NULL,
    threshold INTEGER DEFAULT 10,
    gauge_station_id VARCHAR(50),
    active BOOLEAN DEFAULT true,
    claimed BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Claims table
CREATE TABLE IF NOT EXISTS claims (
    id SERIAL PRIMARY KEY,
    policy_id INTEGER REFERENCES policies(id),
    policy_address VARCHAR(42) NOT NULL,
    amount BIGINT NOT NULL,
    triggered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    tx_hash VARCHAR(66),
    status VARCHAR(20) DEFAULT 'pending',
    flood_level INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Oracle/threshold configuration
CREATE TABLE IF NOT EXISTS oracle_config (
    id SERIAL PRIMARY KEY,
    key VARCHAR(50) UNIQUE NOT NULL,
    value TEXT NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default flood threshold
INSERT INTO oracle_config (key, value) 
VALUES ('flood_threshold', '10') 
ON CONFLICT (key) DO NOTHING;

-- Insert default current flood level
INSERT INTO oracle_config (key, value) 
VALUES ('current_flood_level', '5') 
ON CONFLICT (key) DO NOTHING;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_policies_policyholder ON policies(policyholder);
CREATE INDEX IF NOT EXISTS idx_policies_active ON policies(active);
CREATE INDEX IF NOT EXISTS idx_claims_policy_address ON claims(policy_address);
CREATE INDEX IF NOT EXISTS idx_claims_status ON claims(status);
