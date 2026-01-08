-- create a "bucketed" view for hourly stats
-- 'WITH NO DATA' is set so it starts calculating immediately
CREATE MATERIALIZED VIEW log_hourly_stats
WITH (timescaledb.continuous) AS
SELECT
    time_bucket('1 hour', "timestamp") AS bucket,
    service_id,
    level,
    status,
    count(*) as log_count,
    avg(duration) as avg_duration
FROM log_event
GROUP BY bucket, service_id, level, status
WITH NO DATA;

-- this tells timescaledb to update the view automatically
-- it will refresh data that is between 2 hours and 1 hour old every 30 minutes
SELECT add_continuous_aggregate_policy('log_hourly_stats',
    start_offset => INTERVAL '2 hours',
    end_offset => INTERVAL '1 hour',
    schedule_interval => INTERVAL '30 minutes');