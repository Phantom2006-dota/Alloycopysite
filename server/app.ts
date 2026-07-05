import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { WebhookHandlers } from './webhookHandlers'
import { validateApiKey } from './middleware/apiKey'
import authRoutes from './routes/auth'
import articlesRoutes from './routes/articles'
import categoriesRoutes from './routes/categories'
import tagsRoutes from './routes/tags'
import mediaItemsRoutes from './routes/mediaItems'
import teamMembersRoutes from './routes/teamMembers'
import eventsRoutes from './routes/events'
import uploadsRoutes from './routes/uploads'
import productsRoutes from './routes/products'
import productCategoriesRoutes from './routes/productCategories'
import paymentsRoutes from './routes/payments'
import htmlBlogRoutes from './routes/htmlBlog'
import type { AppEnv } from './types'

const app = new Hono<AppEnv>()

// ── Stripe webhook ──────────────────────────────────────────────────────────
// Must be registered before any body-parsing middleware.
// In Hono, body is only read when explicitly requested, so ordering is safe.
app.post('/api/stripe/webhook', async (c) => {
  const signature = c.req.header('stripe-signature')
  if (!signature) return c.json({ error: 'Missing stripe-signature' }, 400)
  try {
    const rawBody = await c.req.text()
    await WebhookHandlers.processWebhook(rawBody, signature)
    return c.json({ received: true })
  } catch (error: any) {
    console.error('Stripe webhook error:', error.message)
    return c.json({ error: 'Webhook processing error' }, 400)
  }
})

// ── CORS ────────────────────────────────────────────────────────────────────
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '*').split(',').map((o) => o.trim())

app.use(
  '*',
  cors({
    origin: (origin) => {
      if (allowedOrigins.includes('*')) return '*'
      return allowedOrigins.includes(origin) ? origin : null
    },
    credentials: true,
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
  })
)

app.use('*', logger())

// ── API-key guard (standalone / Cloudflare mode) ────────────────────────────
app.use('/api/*', validateApiKey)

// ── Health ──────────────────────────────────────────────────────────────────
app.get('/api/health', (c) =>
  c.json({ status: 'ok', timestamp: new Date().toISOString(), runtime: 'hono' })
)

// ── Routes ──────────────────────────────────────────────────────────────────
app.route('/api/auth', authRoutes)
app.route('/api/articles', articlesRoutes)
app.route('/api/categories', categoriesRoutes)
app.route('/api/tags', tagsRoutes)
app.route('/api/media', mediaItemsRoutes)
app.route('/api/team', teamMembersRoutes)
app.route('/api/events', eventsRoutes)
app.route('/api/uploads', uploadsRoutes)
app.route('/api/products', productsRoutes)
app.route('/api/product-categories', productCategoriesRoutes)
app.route('/api/payments', paymentsRoutes)
app.route('/api/html-blog', htmlBlogRoutes)

// ── 404 ─────────────────────────────────────────────────────────────────────
app.notFound((c) => c.json({ message: 'Not found' }, 404))

app.onError((err, c) => {
  console.error('Unhandled error:', err)
  return c.json({ message: 'Internal server error' }, 500)
})

export default app
