import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import z from "zod";

import { service, serviceToken } from "../schemas/service.schema";

export const ServiceSelectSchema = createSelectSchema(service).extend({
  createdAt: z.number().transform((n) => new Date(n)),
  updatedAt: z.number().transform((n) => new Date(n)),
});

export const ServiceInsertSchema = createInsertSchema(service)
  .pick({
    name: true,
  })
  .extend({
    name: z.string().min(1),
  });

export const ServiceUpdateSchema = ServiceInsertSchema;

export const ServiceTokenSelectSchema = createSelectSchema(serviceToken)
  .omit({
    encryptedToken: true,
  })
  .extend({
    token: z.string().min(1),
    createdAt: z.number().transform((n) => new Date(n)),
    updatedAt: z.number().transform((n) => new Date(n)),
    lastUsedAt: z
      .number()
      .transform((n) => new Date(n))
      .nullable(),
  });

export const ServiceTokenInsertSchema = createInsertSchema(serviceToken)
  .extend({
    name: z.string().min(1),
  })
  .pick({
    name: true,
  });

export const ServiceTokenUpdateSchema = ServiceTokenInsertSchema;
