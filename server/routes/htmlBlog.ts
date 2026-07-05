import { Hono } from 'hono'
import { db } from '../db'
import { htmlBlogPosts } from '../../shared/schema'
import { eq } from 'drizzle-orm'
import { authenticateToken } from '../middleware/auth'
import type { AppEnv } from '../types'

const app = new Hono<AppEnv>()

app.get('/ping', (c) => c.json({ status: 'ok', route: 'html-blog', version: '2.0.0' }))

app.get('/', async (c) => {
  try {
    const posts = await db
      .select({
        id: htmlBlogPosts.id,
        slug: htmlBlogPosts.slug,
        title: htmlBlogPosts.title,
        description: htmlBlogPosts.description,
        category: htmlBlogPosts.category,
        publishedAt: htmlBlogPosts.publishedAt,
      })
      .from(htmlBlogPosts)
      .orderBy(htmlBlogPosts.publishedAt)
    return c.json(posts)
  } catch (error: any) {
    return c.json({ message: error.message }, 500)
  }
})

app.post('/', authenticateToken, async (c) => {
  try {
    const body = await c.req.parseBody()
    const file = body['file']

    if (!file || !(file instanceof File)) return c.json({ message: 'No HTML file provided' }, 400)
    if (file.type !== 'text/html' && !file.name.endsWith('.html')) {
      return c.json({ message: 'Only HTML files are allowed' }, 400)
    }
    if (file.size > 10 * 1024 * 1024) return c.json({ message: 'File too large (max 10MB)' }, 400)

    const title = body['title'] as string
    const slug = body['slug'] as string
    const description = (body['description'] as string) || ''
    const category = (body['category'] as string) || 'General'

    if (!title || !slug) return c.json({ message: 'Title and slug are required' }, 400)

    const safeSlug = slug.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-')
    const htmlContent = await file.text()

    const existing = await db.select({ id: htmlBlogPosts.id }).from(htmlBlogPosts).where(eq(htmlBlogPosts.slug, safeSlug)).limit(1)

    let post
    if (existing.length > 0) {
      const updated = await db.update(htmlBlogPosts)
        .set({ title, description, category, htmlContent, updatedAt: new Date() })
        .where(eq(htmlBlogPosts.slug, safeSlug))
        .returning()
      post = updated[0]
    } else {
      const inserted = await db.insert(htmlBlogPosts)
        .values({ slug: safeSlug, title, description, category, htmlContent })
        .returning()
      post = inserted[0]
    }

    return c.json({ message: 'Blog post published', post })
  } catch (error: any) {
    return c.json({ message: error.message }, 500)
  }
})

app.delete('/:slug', authenticateToken, async (c) => {
  try {
    const slug = c.req.param('slug')
    const deleted = await db.delete(htmlBlogPosts).where(eq(htmlBlogPosts.slug, slug)).returning({ id: htmlBlogPosts.id })
    if (deleted.length === 0) return c.json({ message: 'Post not found' }, 404)
    return c.json({ message: 'Post deleted' })
  } catch (error: any) {
    return c.json({ message: error.message }, 500)
  }
})

export default app
