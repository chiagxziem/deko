import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  server: {
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    PORT: z.coerce.number().default(3000),
    API_URL: z.url(),
    DATABASE_URL: z.url(),
  },

  clientPrefix: "VITE_",
  client: {},

  runtimeEnv: {
    // Server
    NODE_ENV: process.env.NODE_ENV,
    PORT: process.env.PORT,
    API_URL: process.env.API_URL,
    DATABASE_URL: process.env.DATABASE_URL,
  },
  emptyStringAsUndefined: true,
});
