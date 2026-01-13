CREATE TABLE "dead_letter" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"service_id" uuid NOT NULL,
	"failed_at" timestamp DEFAULT now() NOT NULL,
	"reason" text NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "log_event" (
	"id" uuid DEFAULT gen_random_uuid(),
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
	"meta" jsonb DEFAULT '{}'::jsonb NOT NULL,
	CONSTRAINT "log_event_id_timestamp_pk" PRIMARY KEY("id","timestamp")
);
--> statement-breakpoint
CREATE TABLE "service" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "service_token" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"service_id" uuid NOT NULL,
	"encrypted_token" text NOT NULL,
	"hashed_token" text NOT NULL,
	"name" text NOT NULL,
	"last_used_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "service_token_hashed_token_unique" UNIQUE("hashed_token")
);
--> statement-breakpoint
ALTER TABLE "service_token" ADD CONSTRAINT "service_token_service_id_service_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."service"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "log_event_service_timestamp_idx" ON "log_event" USING btree ("service_id","timestamp");--> statement-breakpoint
CREATE INDEX "log_event_service_level_time_idx" ON "log_event" USING btree ("service_id","level","timestamp" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "log_event_service_status_time_idx" ON "log_event" USING btree ("service_id","status","timestamp" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "service_token_serviceId_idx" ON "service_token" USING btree ("service_id");--> statement-breakpoint
CREATE UNIQUE INDEX "service_token_hashedToken_idx" ON "service_token" USING btree ("hashed_token");