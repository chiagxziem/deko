import { type InferSelectModel, relations } from "drizzle-orm";
import {
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { service } from "./service.schema";

export const logEvent = pgTable(
  "log_event",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    serviceId: uuid("service_id")
      .references(() => service.id)
      .notNull(),
    timestamp: timestamp("timestamp").notNull(),
    receivedAt: timestamp("received_at").defaultNow().notNull(),
    level: text("level").notNull(),
    method: text("method").notNull(),
    path: text("path").notNull(),
    status: integer("status").notNull(),
    duration: integer("duration").notNull(),
    environment: text("environment").notNull(),
    requestId: text("request_id").notNull(),
    ipHash: text("ip_hash").notNull(),
    userAgent: text("user_agent").notNull(),
    message: text("message"),
    sessionId: text("session_id"),
    meta: jsonb("meta").default({}).notNull(),
  },
  (table) => [
    index("log_event_service_timestamp_idx").on(
      table.serviceId,
      table.timestamp,
    ),
    index("log_event_service_level_idx").on(table.serviceId, table.level),
    index("log_event_service_status_idx").on(table.serviceId, table.status),
    index("log_event_service_method_idx").on(table.serviceId, table.method),
  ],
);
export const logEventRelations = relations(logEvent, ({ one }) => ({
  service: one(service, {
    fields: [logEvent.serviceId],
    references: [service.id],
  }),
}));

export const deadLetter = pgTable("dead_letter", {
  id: uuid("id").primaryKey().defaultRandom(),
  serviceId: uuid("service_id")
    .references(() => service.id)
    .notNull(),
  failedAt: timestamp("failed_at").defaultNow().notNull(),
  reason: text("reason").notNull(),
  payload: jsonb("payload").default({}).notNull(),
});
export const deadLetterRelations = relations(deadLetter, ({ one }) => ({
  service: one(service, {
    fields: [deadLetter.serviceId],
    references: [service.id],
  }),
}));

export type DeadLetter = InferSelectModel<typeof deadLetter>;
