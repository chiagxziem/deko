import { createEnv } from "@t3-oss/env-core";
import z from "zod";

const env = createEnv({
  server: {
    NODE_ENV: z
      .enum(["development", "production", "test"])
      .default("development"),
    API_URL: z.url(),
    WEB_URL: z.url(),
    DATABASE_URL: z.url(),
    REDIS_URL: z.url(),
    ENCRYPTION_KEY: z.string().min(32),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});

export default env;
