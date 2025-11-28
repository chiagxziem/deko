import { drizzle } from "drizzle-orm/node-postgres";

import env from "@/lib/env";

const db = drizzle(env.DATABASE_URL, {
  schema: {},
  casing: "snake_case",
});

export * from "drizzle-orm";
export { db };
