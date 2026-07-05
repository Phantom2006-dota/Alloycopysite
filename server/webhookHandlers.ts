import Stripe from 'stripe'

export class WebhookHandlers {
  static async processWebhook(rawBody: string, signature: string): Promise<void> {
    const secretKey = process.env.STRIPE_SECRET_KEY
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

    if (!secretKey) throw new Error('STRIPE_SECRET_KEY not configured')
    if (!webhookSecret) throw new Error('STRIPE_WEBHOOK_SECRET not configured')

    const stripe = new Stripe(secretKey)

    let event: Stripe.Event
    try {
      // constructEventAsync uses Web Crypto — works on both Workers and Node.js
      event = await stripe.webhooks.constructEventAsync(rawBody, signature, webhookSecret)
    } catch (err: any) {
      throw new Error(`Webhook signature verification failed: ${err.message}`)
    }

    console.log(`[Stripe] webhook event: ${event.type}`)

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        console.log('[Stripe] payment succeeded, session:', session.id, 'metadata:', session.metadata)
        break
      }
      case 'payment_intent.succeeded':
        console.log('[Stripe] PaymentIntent succeeded:', (event.data.object as Stripe.PaymentIntent).id)
        break
      case 'payment_intent.payment_failed':
        console.log('[Stripe] PaymentIntent failed:', (event.data.object as Stripe.PaymentIntent).id)
        break
      default:
        console.log(`[Stripe] unhandled event type: ${event.type}`)
    }
  }
}
