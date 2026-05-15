-- Reduce log_event retention from 90 days to 30 days
DROP POLICY IF EXISTS "log_event_retention_policy" ON "log_event";
--> statement-breakpoint
SELECT remove_retention_policy('log_event');
--> statement-breakpoint
SELECT add_retention_policy('log_event', INTERVAL '30 days');