CREATE TABLE "log_event" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"service_id" uuid NOT NULL,
	"timestamp" timestamp NOT NULL,
	"received_at" timestamp DEFAULT now() NOT NULL,
	"level" text NOT NULL,
	"method" text NOT NULL,
	"path" text NOT NULL,
	"status" integer NOT NULL,
	"duration" integer NOT NULL,
	"environment" text NOT NULL,
	"request_id" text NOT NULL,
	"ip_hash" text NOT NULL,
	"user_agent" text NOT NULL,
	"message" text,
	"session_id" text,
	"meta" jsonb DEFAULT '{}'::jsonb NOT NULL
);
--> statement-breakpoint
ALTER TABLE "log_event" ADD CONSTRAINT "log_event_service_id_service_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."service"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "log_event_service_timestamp_idx" ON "log_event" USING btree ("service_id","timestamp");--> statement-breakpoint
CREATE INDEX "log_event_service_level_idx" ON "log_event" USING btree ("service_id","level");--> statement-breakpoint
CREATE INDEX "log_event_service_status_idx" ON "log_event" USING btree ("service_id","status");--> statement-breakpoint
CREATE INDEX "log_event_service_method_idx" ON "log_event" USING btree ("service_id","method");