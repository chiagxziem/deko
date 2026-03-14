import {
  integer,
  pgView,
  real,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const logHourlyStats = pgView("log_hourly_stats", {
  bucket: timestamp("bucket").notNull(),
  serviceId: uuid("service_id").notNull(),
  level: text("level").notNull(),
  status: integer("status").notNull(),
  logCount: integer("log_count").notNull(),
  avgDuration: real("avg_duration").notNull(),
}).existing();
