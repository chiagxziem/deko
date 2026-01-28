import { createSelectSchema } from "drizzle-zod";
import { z } from "zod";

import { levelEnum, methodEnum } from "../schemas/event.schema";

export const LevelEnumSchema = createSelectSchema(levelEnum);
export const MethodEnumSchema = createSelectSchema(methodEnum);

export const IngestSchema = z.object({
  level: LevelEnumSchema,
  timestamp: z.iso.datetime().transform((n) => new Date(n)),
  environment: z.string().min(1),
  method: MethodEnumSchema,
  path: z.string().min(1),
  status: z.number(),
  duration: z.number(),
  message: z.string().optional(),
  sessionId: z.string().optional(),
  meta: z.record(z.string(), z.unknown()).optional(),
});

export const EventSchema = z.object({
  serviceId: z.uuid(),
  level: LevelEnumSchema.default("info"),
  timestamp: z.iso.datetime().transform((n) => new Date(n)),
  receivedAt: z.iso.datetime().transform((n) => new Date(n)),
  environment: z.string().min(1),
  requestId: z.string().min(1),
  method: MethodEnumSchema,
  path: z.string().min(1),
  status: z.number(),
  duration: z.number(),
  ipHash: z.string(),
  userAgent: z.string(),
  message: z.string().optional(),
  sessionId: z.string().optional(),
  meta: z.record(z.string(), z.unknown()).optional(),
});

export type Ingest = z.infer<typeof IngestSchema>;
export type Event = z.infer<typeof EventSchema>;
