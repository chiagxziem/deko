import { createEnv } from "@t3-oss/env-core";
import z from "zod";

const env = createEnv({
  server: {
    REDIS_URL: z.url(),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});

export default env;
