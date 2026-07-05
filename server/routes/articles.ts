import { Hono } from 'hono'
import { db } from '../db'
import { articles, users, categories, articleTags, tags } from '../../shared/schema'
import { eq, desc, and, ilike, sql, SQL } from 'drizzle-orm'
import { authenticateToken, requireRole } from '../middleware/auth'
import type { AppEnv } from '../types'

const app = new Hono<AppEnv>()

function calculateReadingTime(content: string): number {
  return Math.ceil(content.split(/\s+/).length / 200)
}

function generateSlug(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim()
}

app.get('/', async (c) => {
  try {
    const page = parseInt(c.req.query('page') || '1')
    const limit = parseInt(c.req.query('limit') || '10')
    const category = c.req.query('category')
    const search = c.req.query('search')
    const status = c.req.query('status') || 'published'
    const offset = (page - 1) * limit

    const conditions: SQL<unknown>[] = []
    if (status === 'published') conditions.push(eq(articles.status, 'published'))
    if (category) {
      const [cat] = await db.select().from(categories).where(eq(categories.slug, category))
      if (cat) conditions.push(eq(articles.categoryId, cat.id))
    }
    if (search) conditions.push(ilike(articles.title, `%${search}%`))
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined

    const articlesData = await db.select({
      id: articles.id, title: articles.title, slug: articles.slug, excerpt: articles.excerpt,
      featuredImage: articles.featuredImage, featuredImageAlt: articles.featuredImageAlt,
      status: articles.status, isFeatured: articles.isFeatured, readingTime: articles.readingTime,
      viewCount: articles.viewCount, publishedAt: articles.publishedAt, createdAt: articles.createdAt,
      authorId: articles.authorId, authorName: users.name, authorImage: users.profileImage,
      categoryId: articles.categoryId, categoryName: categories.name, categorySlug: categories.slug,
    })
      .from(articles)
      .leftJoin(users, eq(articles.authorId, users.id))
      .leftJoin(categories, eq(articles.categoryId, categories.id))
      .where(whereClause)
      .orderBy(desc(articles.publishedAt), desc(articles.createdAt))
      .limit(limit).offset(offset)

    const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(articles).where(whereClause)

    return c.json({ articles: articlesData, pagination: { page, limit, total: Number(count), pages: Math.ceil(Number(count) / limit) } })
  } catch (error) {
    console.error('Get articles error:', error)
    return c.json({ message: 'Server error' }, 500)
  }
})

app.get('/featured', async (c) => {
  try {
    const featured = await db.select({
      id: articles.id, title: articles.title, slug: articles.slug, excerpt: articles.excerpt,
      featuredImage: articles.featuredImage, featuredImageAlt: articles.featuredImageAlt,
      readingTime: articles.readingTime, publishedAt: articles.publishedAt,
      authorName: users.name, categoryName: categories.name, categorySlug: categories.slug,
    })
      .from(articles)
      .leftJoin(users, eq(articles.authorId, users.id))
      .leftJoin(categories, eq(articles.categoryId, categories.id))
      .where(and(eq(articles.isFeatured, true), eq(articles.status, 'published')))
      .orderBy(desc(articles.publishedAt))
      .limit(5)
    return c.json(featured)
  } catch (error) {
    console.error('Get featured articles error:', error)
    return c.json({ message: 'Server error' }, 500)
  }
})

app.get('/admin/all', authenticateToken, requireRole('super_admin', 'editor', 'author'), async (c) => {
  try {
    const page = parseInt(c.req.query('page') || '1')
    const limit = parseInt(c.req.query('limit') || '10')
    const search = c.req.query('search')
    const status = c.req.query('status')
    const offset = (page - 1) * limit

    const conditions: SQL<unknown>[] = []
    if (status) conditions.push(eq(articles.status, status as any))
    if (search) conditions.push(ilike(articles.title, `%${search}%`))
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined

    const articlesData = await db.select({
      id: articles.id, title: articles.title, slug: articles.slug, status: articles.status,
      isFeatured: articles.isFeatured, viewCount: articles.viewCount,
      publishedAt: articles.publishedAt, createdAt: articles.createdAt,
      authorName: users.name, categoryName: categories.name,
    })
      .from(articles)
      .leftJoin(users, eq(articles.authorId, users.id))
      .leftJoin(categories, eq(articles.categoryId, categories.id))
      .where(whereClause)
      .orderBy(desc(articles.createdAt))
      .limit(limit).offset(offset)

    const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(articles).where(whereClause)
    return c.json({ articles: articlesData, pagination: { page, limit, total: Number(count), pages: Math.ceil(Number(count) / limit) } })
  } catch (error) {
    console.error('Get admin articles error:', error)
    return c.json({ message: 'Server error' }, 500)
  }
})

app.get('/category/:slug', async (c) => {
  try {
    const page = parseInt(c.req.query('page') || '1')
    const limit = parseInt(c.req.query('limit') || '10')
    const offset = (page - 1) * limit
    const [cat] = await db.select().from(categories).where(eq(categories.slug, c.req.param('slug')))
    if (!cat) return c.json({ message: 'Category not found' }, 404)

    const articlesData = await db.select({
      id: articles.id, title: articles.title, slug: articles.slug, excerpt: articles.excerpt,
      featuredImage: articles.featuredImage, readingTime: articles.readingTime,
      publishedAt: articles.publishedAt, authorName: users.name,
    })
      .from(articles)
      .leftJoin(users, eq(articles.authorId, users.id))
      .where(and(eq(articles.categoryId, cat.id), eq(articles.status, 'published')))
      .orderBy(desc(articles.publishedAt))
      .limit(limit).offset(offset)

    const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(articles)
      .where(and(eq(articles.categoryId, cat.id), eq(articles.status, 'published')))
    return c.json({ category: cat, articles: articlesData, pagination: { page, limit, total: Number(count), pages: Math.ceil(Number(count) / limit) } })
  } catch (error) {
    console.error('Get articles by category error:', error)
    return c.json({ message: 'Server error' }, 500)
  }
})

app.get('/author/:id', async (c) => {
  try {
    const authorId = parseInt(c.req.param('id'))
    const page = parseInt(c.req.query('page') || '1')
    const limit = parseInt(c.req.query('limit') || '10')
    const offset = (page - 1) * limit

    const articlesData = await db.select({
      id: articles.id, title: articles.title, slug: articles.slug, excerpt: articles.excerpt,
      featuredImage: articles.featuredImage, readingTime: articles.readingTime, publishedAt: articles.publishedAt,
      categoryName: categories.name, categorySlug: categories.slug,
    })
      .from(articles)
      .leftJoin(categories, eq(articles.categoryId, categories.id))
      .where(and(eq(articles.authorId, authorId), eq(articles.status, 'published')))
      .orderBy(desc(articles.publishedAt))
      .limit(limit).offset(offset)

    const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(articles)
      .where(and(eq(articles.authorId, authorId), eq(articles.status, 'published')))
    return c.json({ articles: articlesData, pagination: { page, limit, total: Number(count), pages: Math.ceil(Number(count) / limit) } })
  } catch (error) {
    console.error('Get articles by author error:', error)
    return c.json({ message: 'Server error' }, 500)
  }
})

app.get('/:slug', async (c) => {
  try {
    const slug = c.req.param('slug')
    const [article] = await db.select({
      id: articles.id, title: articles.title, slug: articles.slug, content: articles.content,
      excerpt: articles.excerpt, featuredImage: articles.featuredImage, featuredImageAlt: articles.featuredImageAlt,
      status: articles.status, isFeatured: articles.isFeatured, readingTime: articles.readingTime,
      viewCount: articles.viewCount, publishedAt: articles.publishedAt, createdAt: articles.createdAt, updatedAt: articles.updatedAt,
      metaTitle: articles.metaTitle, metaDescription: articles.metaDescription,
      authorId: articles.authorId, authorName: users.name, authorImage: users.profileImage, authorBio: users.bio,
      categoryId: articles.categoryId, categoryName: categories.name, categorySlug: categories.slug,
    })
      .from(articles)
      .leftJoin(users, eq(articles.authorId, users.id))
      .leftJoin(categories, eq(articles.categoryId, categories.id))
      .where(eq(articles.slug, slug))

    if (!article) return c.json({ message: 'Article not found' }, 404)

    // Increment view count (fire and forget)
    db.update(articles).set({ viewCount: sql`${articles.viewCount} + 1` }).where(eq(articles.id, article.id)).catch(() => {})

    // Get tags
    const articleTagsList = await db.select({ id: tags.id, name: tags.name, slug: tags.slug })
      .from(articleTags)
      .leftJoin(tags, eq(articleTags.tagId, tags.id))
      .where(eq(articleTags.articleId, article.id))

    // Get related articles
    const relatedConditions: SQL<unknown>[] = [eq(articles.status, 'published')]
    if (article.categoryId) relatedConditions.push(eq(articles.categoryId, article.categoryId))
    const related = await db.select({
      id: articles.id, title: articles.title, slug: articles.slug,
      featuredImage: articles.featuredImage, readingTime: articles.readingTime, publishedAt: articles.publishedAt,
    })
      .from(articles)
      .where(and(...relatedConditions, sql`${articles.id} != ${article.id}`))
      .orderBy(desc(articles.publishedAt))
      .limit(3)

    return c.json({ ...article, tags: articleTagsList, relatedArticles: related })
  } catch (error) {
    console.error('Get article error:', error)
    return c.json({ message: 'Server error' }, 500)
  }
})

app.post('/', authenticateToken, requireRole('super_admin', 'editor', 'author'), async (c) => {
  try {
    const body = await c.req.json()
    const { title, content, excerpt, featuredImage, featuredImageAlt, status, isFeatured,
      categoryId, metaTitle, metaDescription, tagIds } = body

    if (!title || !content) return c.json({ message: 'Title and content are required' }, 400)

    const user = c.get('user')
    const slug = generateSlug(title)
    const readingTime = calculateReadingTime(content)

    const [newArticle] = await db.insert(articles).values({
      title, slug, content, excerpt, featuredImage, featuredImageAlt,
      status: status || 'draft', isFeatured: isFeatured || false,
      readingTime, authorId: user.id, categoryId: categoryId || null,
      metaTitle, metaDescription,
      publishedAt: status === 'published' ? new Date() : null,
    }).returning()

    if (tagIds && Array.isArray(tagIds) && tagIds.length > 0) {
      await db.insert(articleTags).values(tagIds.map((tagId: number) => ({ articleId: newArticle.id, tagId })))
    }

    return c.json(newArticle, 201)
  } catch (error) {
    console.error('Create article error:', error)
    return c.json({ message: 'Server error' }, 500)
  }
})

app.put('/:id', authenticateToken, requireRole('super_admin', 'editor', 'author', 'contributor'), async (c) => {
  try {
    const articleId = parseInt(c.req.param('id'))
    const user = c.get('user')
    const body = await c.req.json()

    const [existing] = await db.select().from(articles).where(eq(articles.id, articleId))
    if (!existing) return c.json({ message: 'Article not found' }, 404)

    // Authors can only edit their own articles
    if (user.role === 'author' && existing.authorId !== user.id) {
      return c.json({ message: 'Insufficient permissions' }, 403)
    }

    const { title, content, excerpt, featuredImage, featuredImageAlt, status, isFeatured,
      categoryId, metaTitle, metaDescription, tagIds } = body

    const updates: Record<string, any> = { updatedAt: new Date() }
    if (title !== undefined) { updates.title = title; updates.slug = generateSlug(title) }
    if (content !== undefined) { updates.content = content; updates.readingTime = calculateReadingTime(content) }
    if (excerpt !== undefined) updates.excerpt = excerpt
    if (featuredImage !== undefined) updates.featuredImage = featuredImage
    if (featuredImageAlt !== undefined) updates.featuredImageAlt = featuredImageAlt
    if (status !== undefined) {
      updates.status = status
      if (status === 'published' && !existing.publishedAt) updates.publishedAt = new Date()
    }
    if (isFeatured !== undefined) updates.isFeatured = isFeatured
    if (categoryId !== undefined) updates.categoryId = categoryId || null
    if (metaTitle !== undefined) updates.metaTitle = metaTitle
    if (metaDescription !== undefined) updates.metaDescription = metaDescription

    const [updated] = await db.update(articles).set(updates).where(eq(articles.id, articleId)).returning()

    if (tagIds !== undefined && Array.isArray(tagIds)) {
      await db.delete(articleTags).where(eq(articleTags.articleId, articleId))
      if (tagIds.length > 0) {
        await db.insert(articleTags).values(tagIds.map((tagId: number) => ({ articleId, tagId })))
      }
    }

    return c.json(updated)
  } catch (error) {
    console.error('Update article error:', error)
    return c.json({ message: 'Server error' }, 500)
  }
})

app.delete('/:id', authenticateToken, requireRole('super_admin', 'editor'), async (c) => {
  try {
    const articleId = parseInt(c.req.param('id'))
    const [existing] = await db.select().from(articles).where(eq(articles.id, articleId))
    if (!existing) return c.json({ message: 'Article not found' }, 404)
    await db.delete(articleTags).where(eq(articleTags.articleId, articleId))
    await db.delete(articles).where(eq(articles.id, articleId))
    return c.json({ message: 'Article deleted successfully' })
  } catch (error) {
    console.error('Delete article error:', error)
    return c.json({ message: 'Server error' }, 500)
  }
})

export default app
