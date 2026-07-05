import { Hono } from 'hono'
import { db } from '../db'
import { events } from '../../shared/schema'
import { eq, desc, asc, and, sql } from 'drizzle-orm'
import { authenticateToken, requireRole } from '../middleware/auth'
import { uploadToCloudinary } from '../lib/cloudinary'
import type { AppEnv } from '../types'

const app = new Hono<AppEnv>()

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']

app.get('/debug/test-db', async (c) => {
  try {
    const result = await db.select({ count: sql<number>`count(*)` }).from(events)
    return c.json({ dbConnected: true, eventCount: result[0].count })
  } catch (error: any) {
    return c.json({ error: error.message }, 500)
  }
})

app.get('/admin/all', authenticateToken, requireRole('super_admin', 'editor'), async (c) => {
  try {
    const eventsList = await db.select().from(events).orderBy(desc(events.eventDate))
    return c.json(eventsList)
  } catch (error) {
    console.error('Get admin events error:', error)
    return c.json({ message: 'Server error' }, 500)
  }
})

app.get('/upcoming', async (c) => {
  try {
    const upcoming = await db.select().from(events)
      .where(eq(events.status, 'upcoming'))
      .orderBy(asc(events.eventDate))
      .limit(10)
    return c.json(upcoming)
  } catch (error) {
    console.error('Get upcoming events error:', error)
    return c.json({ message: 'Server error' }, 500)
  }
})

app.get('/past', async (c) => {
  try {
    const past = await db.select().from(events)
      .where(eq(events.status, 'past'))
      .orderBy(desc(events.eventDate))
      .limit(10)
    return c.json(past)
  } catch (error) {
    console.error('Get past events error:', error)
    return c.json({ message: 'Server error' }, 500)
  }
})

app.get('/', async (c) => {
  try {
    const page = parseInt(c.req.query('page') || '1')
    const limit = parseInt(c.req.query('limit') || '10')
    const status = c.req.query('status')
    const offset = (page - 1) * limit

    const whereClause =
      status && status !== 'all'
        ? eq(events.status, status as 'upcoming' | 'ongoing' | 'past')
        : undefined
    const eventsList = await db.select().from(events).where(whereClause).orderBy(desc(events.eventDate)).limit(limit).offset(offset)
    const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(events).where(whereClause)
    return c.json({ events: eventsList, pagination: { page, limit, total: Number(count), pages: Math.ceil(Number(count) / limit) } })
  } catch (error) {
    console.error('Get events error:', error)
    return c.json({ message: 'Server error' }, 500)
  }
})

app.get('/:slug', async (c) => {
  try {
    const [event] = await db.select().from(events).where(eq(events.slug, c.req.param('slug')))
    if (!event) return c.json({ message: 'Event not found' }, 404)
    return c.json(event)
  } catch (error) {
    console.error('Get event error:', error)
    return c.json({ message: 'Server error' }, 500)
  }
})

function generateSlug(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim()
}

async function parseEventBody(c: any) {
  const contentType = c.req.header('Content-Type') || ''
  if (contentType.includes('multipart/form-data')) {
    const body = await c.req.parseBody()
    const file = body['featuredImage']
    let imageUrl: string | null = null
    if (file instanceof File) {
      if (!IMAGE_TYPES.includes(file.type)) throw new Error('Invalid image type')
      const buffer = Buffer.from(await file.arrayBuffer())
      const result = await uploadToCloudinary(buffer, { folder: 'bauhaus-cms/events', mimeType: file.type })
      imageUrl = result.secure_url
    }
    const data: Record<string, any> = {}
    const fields = ['title', 'description', 'location', 'status', 'eventType', 'virtualLink', 'registrationLink']
    for (const f of fields) {
      if (body[f] !== undefined) data[f] = body[f]
    }
    if (body['eventDate']) data.eventDate = new Date(body['eventDate'] as string)
    if (body['endDate']) data.endDate = new Date(body['endDate'] as string)
    if (body['isVirtual'] !== undefined) data.isVirtual = body['isVirtual'] === 'true'
    if (imageUrl) data.featuredImage = imageUrl
    return data
  } else {
    const data = await c.req.json()
    if (data.eventDate) data.eventDate = new Date(data.eventDate)
    if (data.endDate) data.endDate = new Date(data.endDate)
    return data
  }
}

app.post('/', authenticateToken, requireRole('super_admin', 'editor'), async (c) => {
  try {
    const data = await parseEventBody(c)
    if (!data.title) return c.json({ message: 'Title is required' }, 400)
    if (!data.eventDate) return c.json({ message: 'eventDate is required' }, 400)
    if (!data.slug) data.slug = generateSlug(data.title)
    const [newEvent] = await db.insert(events).values(data).returning()
    return c.json(newEvent, 201)
  } catch (error: any) {
    console.error('Create event error:', error)
    return c.json({ message: error.message || 'Server error' }, 500)
  }
})

app.put('/:id', authenticateToken, requireRole('super_admin', 'editor'), async (c) => {
  try {
    const eventId = parseInt(c.req.param('id'))
    const [existing] = await db.select().from(events).where(eq(events.id, eventId))
    if (!existing) return c.json({ message: 'Event not found' }, 404)
    const data = await parseEventBody(c)
    data.updatedAt = new Date()
    const [updated] = await db.update(events).set(data).where(eq(events.id, eventId)).returning()
    return c.json(updated)
  } catch (error: any) {
    console.error('Update event error:', error)
    return c.json({ message: error.message || 'Server error' }, 500)
  }
})

app.delete('/:id', authenticateToken, requireRole('super_admin'), async (c) => {
  try {
    const eventId = parseInt(c.req.param('id'))
    const [existing] = await db.select().from(events).where(eq(events.id, eventId))
    if (!existing) return c.json({ message: 'Event not found' }, 404)
    await db.delete(events).where(eq(events.id, eventId))
    return c.json({ message: 'Event deleted successfully' })
  } catch (error) {
    console.error('Delete event error:', error)
    return c.json({ message: 'Server error' }, 500)
  }
})

export default app
