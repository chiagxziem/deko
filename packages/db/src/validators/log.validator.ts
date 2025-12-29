import z from "zod";

export const LogSchema = z.object({
  projectToken: z.string().min(1),
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
  timestamp: z.iso.datetime(),
  duration: z.number(),
  env: z.string().min(1),
  level: z.enum(["debug", "info", "warn", "error"]).default("info"),
  sessionId: z.string().optional(),
  message: z.string().optional(),
  meta: z.record(z.string(), z.unknown()).optional(),
});

export type Log = z.infer<typeof LogSchema>;
