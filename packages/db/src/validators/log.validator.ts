import z from "zod";

export const IngestSchema = z.object({
  serviceToken: z.string().min(1),
  level: z.enum(["debug", "info", "warn", "error"]).default("info"),
  timestamp: z.iso.datetime(),
  environment: z.string().min(1),
  method: z.enum([
    "get",
    "head",
    "post",
    "put",
    "patch",
    "delete",
    "connect",
    "options",
    "trace",
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
  timestamp: z.iso.datetime(),
  receivedAt: z.iso.datetime(),
  environment: z.string().min(1),
  requestId: z.string().min(1),
  method: z.enum([
    "get",
    "head",
    "post",
    "put",
    "patch",
    "delete",
    "connect",
    "options",
    "trace",
  ]),
  path: z.string().min(1),
  status: z.number(),
  duration: z.number(),
  ipHash: z.string().min(1),
  userAgent: z.string().min(1),
  message: z.string().optional(),
  sessionId: z.string().optional(),
  meta: z.record(z.string(), z.unknown()).optional(),
});

export type Ingest = z.infer<typeof IngestSchema>;
export type Event = z.infer<typeof EventSchema>;
