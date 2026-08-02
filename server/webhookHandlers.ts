import { getStripeSync } from './stripeClient';

export class WebhookHandlers {
  static async processWebhook(payload: Buffer, signature: string): Promise<void> {
    if (!Buffer.isBuffer(payload)) {
      throw new Error(
        'STRIPE WEBHOOK ERROR: Payload must be a Buffer. ' +
        'Ensure webhook route is registered BEFORE app.use(express.json()).'
      );
    }

    // Parse event type without verifying signature — just for logging
    try {
      const raw = JSON.parse(payload.toString());
      console.log(`[STRIPE WEBHOOK] Event type: ${raw.type} | id: ${raw.id}`);
    } catch {
      console.warn('[STRIPE WEBHOOK] Could not parse event JSON for logging');
    }

    console.log('[STRIPE WEBHOOK] Calling getStripeSync…');
    const sync = await getStripeSync();
    console.log('[STRIPE WEBHOOK] StripeSync ready — calling processWebhook…');
    await sync.processWebhook(payload, signature);
  }
}
