import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

import { service, serviceToken } from "../schemas/service.schema";

export const ServiceSelectSchema = createSelectSchema(service).extend({
  createdAt: z.iso.datetime().transform((n) => new Date(n)),
  updatedAt: z.iso.datetime().transform((n) => new Date(n)),
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
    hashedToken: true,
  })
  .extend({
    token: z.string().min(1),
    createdAt: z.iso.datetime().transform((n) => new Date(n)),
    updatedAt: z.iso.datetime().transform((n) => new Date(n)),
    lastUsedAt: z.iso
      .datetime()
      .transform((n) => new Date(n))
      .nullable(),
  });

// Public service-token shape for non-creation endpoints.
// The plaintext token is only shown when it's being created.
// Other times, this shape with a masked preview is used to avoid repeated secret exposure.
export const ServiceTokenPublicSchema = ServiceTokenSelectSchema.omit({
  token: true,
}).extend({
  tokenPreview: z.string().min(1),
});

export const ServiceTokenInsertSchema = createInsertSchema(serviceToken)
  .extend({
    name: z.string().min(1),
  })
  .pick({
    name: true,
  });

export const ServiceTokenUpdateSchema = ServiceTokenInsertSchema;
