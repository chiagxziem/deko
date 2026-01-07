DROP INDEX "log_event_service_level_idx";--> statement-breakpoint
DROP INDEX "log_event_service_status_idx";--> statement-breakpoint
DROP INDEX "log_event_service_method_idx";--> statement-breakpoint
/* 
    Unfortunately in current drizzle-kit version we can't automatically get name for primary key.
    We are working on making it available!

    Meanwhile you can:
        1. Check pk name in your database, by running
            SELECT constraint_name FROM information_schema.table_constraints
            WHERE table_schema = 'public'
                AND table_name = 'log_event'
                AND constraint_type = 'PRIMARY KEY';
        2. Uncomment code below and paste pk name manually
        
    Hope to release this update as soon as possible
*/

-- ALTER TABLE "log_event" DROP CONSTRAINT "<constraint_name>";--> statement-breakpoint
ALTER TABLE "log_event" ALTER COLUMN "id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "log_event" ADD CONSTRAINT "log_event_id_timestamp_pk" PRIMARY KEY("id","timestamp");--> statement-breakpoint
CREATE INDEX "log_event_service_level_time_idx" ON "log_event" USING btree ("service_id","level","timestamp" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "log_event_service_status_time_idx" ON "log_event" USING btree ("service_id","status","timestamp" DESC NULLS LAST);