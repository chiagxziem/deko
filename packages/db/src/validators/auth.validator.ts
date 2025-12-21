import { createSelectSchema, createUpdateSchema } from "drizzle-zod";
import z from "zod";

import { user } from "../schemas/auth.schema";

export const UserSelectSchema = createSelectSchema(user, {
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export const UserUpdateSchema = createUpdateSchema(user)
  .pick({
    name: true,
  })
  .extend({
    name: z.string().min(1),
  })
  .partial();
