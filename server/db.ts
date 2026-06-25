import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "../shared/schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ connectionString });
export const db = drizzle({ client: pool, schema });

export async function runStartupMigrations() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS html_blog_posts (
        id SERIAL PRIMARY KEY,
        slug VARCHAR(500) UNIQUE NOT NULL,
        title VARCHAR(500) NOT NULL,
        description TEXT,
        category VARCHAR(100) DEFAULT 'General',
        html_content TEXT NOT NULL,
        published_at TIMESTAMP DEFAULT NOW() NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);
    console.log("✅ html_blog_posts table ready");
  } catch (err) {
    console.error("⚠️  Startup migration warning:", err);
  } finally {
    client.release();
  }
}
