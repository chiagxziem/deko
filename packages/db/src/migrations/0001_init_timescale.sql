-- enable timescaledb extension
CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;

-- transform the table into a hypertable
SELECT create_hypertable('log_event', 'timestamp', chunk_time_interval => INTERVAL '1 day');

-- enable compression
ALTER TABLE log_event SET (
  timescaledb.compress,
  timescaledb.compress_segmentby = 'service_id',
  timescaledb.compress_orderby = 'timestamp DESC'
);

-- compress logs older than 7 days
SELECT add_compression_policy('log_event', INTERVAL '7 days');

-- delete logs older than 90 days
SELECT add_retention_policy('log_event', INTERVAL '90 days');