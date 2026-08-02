import Stripe from 'stripe';
import { StripeSync } from 'stripe-replit-sync';

async function getStripeCredentials(): Promise<{ secretKey: string; webhookSecret?: string }> {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY
    ? "repl " + process.env.REPL_IDENTITY
    : process.env.WEB_REPL_RENEWAL
      ? "depl " + process.env.WEB_REPL_RENEWAL
      : null;

  console.log(`[STRIPE CLIENT] Resolving credentials — Replit connector hostname: ${hostname ? 'present' : 'absent'}`);

  if (hostname && xReplitToken) {
    try {
      const resp = await fetch(
        `https://${hostname}/api/v2/connection?include_secrets=true&connector_names=stripe`,
        {
          headers: { Accept: "application/json", X_REPLIT_TOKEN: xReplitToken },
          signal: AbortSignal.timeout(10_000),
        }
      );
      if (resp.ok) {
        const data = await resp.json();
        const settings = data.items?.[0]?.settings;
        if (settings?.secret_key) {
          console.log(`[STRIPE CLIENT] ✅ Credentials from Replit connector | webhook secret: ${settings.webhook_secret ? 'present' : 'absent'}`);
          return { secretKey: settings.secret_key, webhookSecret: settings.webhook_secret };
        }
        console.warn('[STRIPE CLIENT] Replit connector responded but secret_key missing in payload');
      } else {
        console.warn(`[STRIPE CLIENT] Replit connector HTTP ${resp.status} — falling back to env var`);
      }
    } catch (e: any) {
      console.warn(`[STRIPE CLIENT] Replit connector unavailable (${e.message}) — falling back to env var`);
    }
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (secretKey) {
    const keyPreview = secretKey.startsWith('sk_live') ? 'sk_live_…' : secretKey.startsWith('sk_test') ? 'sk_test_…' : '(unrecognised prefix)';
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    console.log(`[STRIPE CLIENT] ✅ Credentials from env var | key: ${keyPreview} | webhook secret: ${webhookSecret ? 'present' : '❌ absent'}`);
    return { secretKey, webhookSecret };
  }

  console.error('[STRIPE CLIENT] ❌ No Stripe credentials found — neither Replit connector nor STRIPE_SECRET_KEY env var is set');
  throw new Error(
    'Stripe not configured. Connect Stripe via the Integrations tab or set STRIPE_SECRET_KEY.'
  );
}

export async function getUncachableStripeClient(): Promise<Stripe> {
  const { secretKey } = await getStripeCredentials();
  return new Stripe(secretKey);
}

export async function getStripeSync(): Promise<StripeSync> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error('DATABASE_URL required');
  const { secretKey, webhookSecret } = await getStripeCredentials();
  return new StripeSync({
    poolConfig: { connectionString: databaseUrl },
    stripeSecretKey: secretKey,
    stripeWebhookSecret: webhookSecret ?? '',
  });
}
