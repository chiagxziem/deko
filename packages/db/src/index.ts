import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import env from "./lib/env";
import * as eventSchema from "./schemas/event.schema";
import * as serviceSchema from "./schemas/service.schema";

const pool = new Pool({
  connectionString: env.DATABASE_URL,
  max: 30,
  min: 5,
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 5000,
});

const db = drizzle(pool, {
  schema: {
    ...eventSchema,
    ...serviceSchema,
  },
  casing: "snake_case",
});

export * from "drizzle-orm";
export { db };
