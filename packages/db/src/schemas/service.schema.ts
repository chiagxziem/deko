import { type InferSelectModel, relations } from "drizzle-orm";
import {
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { timestamps } from "../lib/helpers";
import { deadLetter, logEvent } from "./event.schema";

export const service = pgTable("service", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  ...timestamps,
});
export const serviceRelations = relations(service, ({ many }) => ({
  tokens: many(serviceToken),
  deadLetters: many(deadLetter),
  logEvents: many(logEvent),
}));

export const serviceToken = pgTable(
  "service_token",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    serviceId: uuid("service_id")
      .references(() => service.id)
      .notNull(),
    encryptedToken: text("encrypted_token").notNull().unique(),
    name: text("name").notNull(),
    lastUsedAt: timestamp("last_used_at"),
    ...timestamps,
  },
  (table) => [
    index("service_token_serviceId_idx").on(table.serviceId),
    uniqueIndex("service_token_encryptedToken_idx").on(table.encryptedToken),
  ],
);
export const serviceTokenRelations = relations(serviceToken, ({ one }) => ({
  service: one(service, {
    fields: [serviceToken.serviceId],
    references: [service.id],
  }),
}));

export type Service = InferSelectModel<typeof service>;
export type ServiceToken = InferSelectModel<typeof serviceToken>;
