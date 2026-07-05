import { Hono } from 'hono'
import { db } from '../db'
import { sql } from 'drizzle-orm'
import { getUncachableStripeClient } from '../stripeClient'
import type { AppEnv } from '../types'

const app = new Hono<AppEnv>()

app.post('/create-checkout-session', async (c) => {
  try {
    const { email, name, phone, productId } = await c.req.json()
    if (!productId || !email || !name) return c.json({ message: 'Product ID, email, and name are required' }, 400)

    const productResult = await db.execute(
      sql`SELECT id, title, price, is_in_stock FROM products WHERE id = ${productId} AND status = 'published'`
    )
    if (!productResult.rows || productResult.rows.length === 0) {
      return c.json({ message: 'Product not found or unavailable' }, 404)
    }

    const product = productResult.rows[0] as { id: number; title: string; price: number; is_in_stock: boolean }
    if (!product.is_in_stock) return c.json({ message: 'This product is currently out of stock' }, 400)

    const stripe = await getUncachableStripeClient()

    // Derive the base URL from the request or env
    const origin = c.req.header('Origin') || process.env.FRONTEND_URL || 'https://bauhausproduction.com'

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: email,
      line_items: [{
        price_data: {
          currency: 'gbp',
          unit_amount: product.price,
          product_data: {
            name: product.title,
            metadata: { product_id: String(product.id) },
          },
        },
        quantity: 1,
      }],
      success_url: `${origin}/payment/success?session_id={CHECKOUT_SESSION_ID}&product_title=${encodeURIComponent(product.title)}`,
      cancel_url: `${origin}/payment/cancelled`,
      metadata: {
        product_id: String(product.id),
        product_title: product.title,
        customer_name: name,
        customer_phone: phone || '',
      },
    })

    return c.json({ status: 'success', url: session.url })
  } catch (error: any) {
    console.error('Stripe checkout session error:', error)
    return c.json({ message: 'Failed to create checkout session', error: error.message }, 500)
  }
})

app.get('/session/:sessionId', async (c) => {
  try {
    const stripe = await getUncachableStripeClient()
    const session = await stripe.checkout.sessions.retrieve(c.req.param('sessionId'))
    return c.json({
      status: session.payment_status,
      amount: session.amount_total,
      currency: session.currency,
      customer_email: session.customer_email,
      metadata: session.metadata,
    })
  } catch (error: any) {
    console.error('Session retrieval error:', error)
    return c.json({ message: 'Failed to retrieve session', error: error.message }, 500)
  }
})

app.get('/config', async (c) => {
  try {
    await getUncachableStripeClient()
    return c.json({ configured: true, provider: 'stripe' })
  } catch {
    return c.json({ configured: false, provider: 'stripe' })
  }
})

export default app
