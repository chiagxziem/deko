import { createEnv } from "@t3-oss/env-core";
import z from "zod";

const env = createEnv({
  server: {
    NODE_ENV: z
      .enum(["development", "production", "test"])
      .default("development"),
    PORT: z.coerce.number(),
    BASE_URL: z.url(),
    FRONTEND_URL: z.url(),
    DOMAIN: z.string().optional(),
    DATABASE_URL: z.url(),
    REDIS_URL: z.url(),
    ENCRYPTION_KEY: z.string().min(32),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});

export default env;
