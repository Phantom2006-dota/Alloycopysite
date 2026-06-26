import { Pool } from "pg";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const posts = [
  {
    slug: "things-to-do-in-lagos-nigeria",
    title: "Things to Do in Lagos Nigeria: The Cultural Tourism Guide 2026",
    description:
      "A cultural tourism guide to Lagos and Yoruba cultural events — Ojude Oba 2026, Detty December, Kalakuta, Badagry — written from our office in Ilupeju, Lagos.",
    category: "Culture",
    file: "attached_assets/things-to-do-in-lagos-nigeria-v2_1782451371300.html",
  },
  {
    slug: "nigerian-books-to-read",
    title: "Nigerian Books to Read: The Essential List for 2026",
    description:
      "From the 2025 Nigeria Prize winner to Chimamanda's long-awaited return. Curated by Bauhaus Production, Lagos and UK.",
    category: "Books",
    file: "attached_assets/nigerian-books-to-read_1782451371305.html",
  },
];

async function run() {
  const client = await pool.connect();
  try {
    for (const post of posts) {
      const filePath = path.resolve(__dirname, "..", post.file);
      const htmlContent = fs.readFileSync(filePath, "utf-8");

      await client.query(
        `INSERT INTO html_blog_posts (slug, title, description, category, html_content, published_at, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, NOW(), NOW(), NOW())
         ON CONFLICT (slug) DO UPDATE
           SET title = EXCLUDED.title,
               description = EXCLUDED.description,
               category = EXCLUDED.category,
               html_content = EXCLUDED.html_content,
               updated_at = NOW()`,
        [post.slug, post.title, post.description, post.category, htmlContent]
      );
      console.log(`✅ Inserted: ${post.slug}`);
    }
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch((e) => { console.error(e); process.exit(1); });
