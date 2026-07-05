import Stripe from 'stripe'

export async function getUncachableStripeClient(): Promise<Stripe> {
  const secretKey = process.env.STRIPE_SECRET_KEY
  if (!secretKey) {
    throw new Error(
      'Stripe not configured. Set STRIPE_SECRET_KEY environment variable.'
    )
  }
  return new Stripe(secretKey)
}
