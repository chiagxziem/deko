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
import { user } from "./auth.schema";
import { deadLetter, event, eventIndex } from "./event.schema";

export const project = pgTable("project", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  userId: uuid("user_id")
    .notNull()
    .references(() => user.id, {
      onDelete: "cascade",
    }),
  ...timestamps,
});
export const projectRelations = relations(project, ({ one, many }) => ({
  user: one(user, {
    fields: [project.userId],
    references: [user.id],
  }),
  tokens: many(projectToken),
  events: many(event),
  eventsIndex: many(eventIndex),
  deadLetters: many(deadLetter),
}));

export const projectToken = pgTable(
  "project_token",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
      .references(() => project.id)
      .notNull(),
    encryptedToken: text("encrypted_token").notNull().unique(),
    name: text("name").notNull(),
    lastUsedAt: timestamp("last_used_at"),
    ...timestamps,
  },
  (table) => [
    index("project_token_projectId_idx").on(table.projectId),
    uniqueIndex("project_token_encryptedToken_idx").on(table.encryptedToken),
  ],
);
export const projectTokenRelations = relations(projectToken, ({ one }) => ({
  project: one(project, {
    fields: [projectToken.projectId],
    references: [project.id],
  }),
}));

export type Project = InferSelectModel<typeof project>;
export type ProjectToken = InferSelectModel<typeof projectToken>;
