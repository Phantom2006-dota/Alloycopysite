import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from '../shared/schema'

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL must be set. Did you forget to provision a database?')
}

const sql = neon(process.env.DATABASE_URL)
export const db = drizzle(sql, { schema })

export async function runStartupMigrations() {
  try {
    await sql`
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
    `
    console.log('✅ html_blog_posts table ready')
  } catch (err) {
    console.error('⚠️  Startup migration warning:', err)
  }
}
