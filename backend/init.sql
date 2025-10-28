CREATE EXTENSION IF NOT EXISTS timescaledb;

SELECT create_hypertable('flood_readings', 'timestamp', if_not_exists => TRUE);

-- Sync state tracking table
CREATE TABLE IF NOT EXISTS sync_state (
  id SERIAL PRIMARY KEY,
  service VARCHAR(100) UNIQUE NOT NULL,
  last_synced_block INTEGER NOT NULL DEFAULT 0,
  last_sync_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);