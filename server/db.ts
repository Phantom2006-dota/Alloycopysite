import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "../shared/schema";

neonConfig.webSocketConstructor = ws;

const rawConnection = process.env.NEON_DATABASE_URL || process.env.DATABASE_URL;

if (!rawConnection) {
  throw new Error(
    "NEON_DATABASE_URL or DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Strip surrounding quotes in case the value was saved with them
const connectionString = rawConnection.replace(/^['"]|['"]$/g, "");

export const pool = new Pool({ connectionString });
export const db = drizzle({ client: pool, schema });
