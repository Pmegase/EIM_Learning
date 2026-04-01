import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

/**
 * Admin DB connection that bypasses RLS.
 * Uses the service role connection string.
 * Only use in cron routes and trusted server-side admin operations.
 */
export function createAdminDb() {
  const client = postgres(process.env.DATABASE_URL_ADMIN || process.env.DATABASE_URL!, {
    prepare: false,
  });
  return drizzle(client, { schema });
}
