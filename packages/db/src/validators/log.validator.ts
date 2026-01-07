import z from "zod";

export const IngestSchema = z.object({
  level: z.enum(["debug", "info", "warn", "error"]).default("info"),
  timestamp: z.number().transform((n) => new Date(n)),
  environment: z.string().min(1),
  method: z.enum([
    "GET",
    "HEAD",
    "POST",
    "PUT",
    "PATCH",
    "DELETE",
    "CONNECT",
    "OPTIONS",
    "TRACE",
  ]),
  path: z.string().min(1),
  status: z.number(),
  duration: z.number(),
  message: z.string().optional(),
  sessionId: z.string().optional(),
  meta: z.record(z.string(), z.unknown()).optional(),
});

export const EventSchema = z.object({
  serviceId: z.uuid(),
  level: z.enum(["debug", "info", "warn", "error"]).default("info"),
  timestamp: z.date(),
  receivedAt: z.date(),
  environment: z.string().min(1),
  requestId: z.string().min(1),
  method: z.enum([
    "GET",
    "HEAD",
    "POST",
    "PUT",
    "PATCH",
    "DELETE",
    "CONNECT",
    "OPTIONS",
    "TRACE",
  ]),
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
