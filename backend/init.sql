CREATE EXTENSION IF NOT EXISTS timescaledb;

SELECT create_hypertable('flood_readings', 'timestamp', if_not_exists => TRUE);