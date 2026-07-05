# Bauhaus CMS API — Cloudflare Workers Deployment Guide

This guide covers deploying the Hono-based backend to Cloudflare Workers.  
The React frontend deploys separately to Vercel.

---

## Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Node.js | 18+ | https://nodejs.org |
| Wrangler CLI | v3+ | `npm install -g wrangler` |
| Cloudflare account | free tier OK | https://dash.cloudflare.com |
| Neon database | serverless Postgres | https://neon.tech |
| Cloudinary account | image hosting | https://cloudinary.com |
| Stripe account | payments | https://dashboard.stripe.com |

---

## Step 1 — Authenticate with Cloudflare

```bash
npx wrangler login
```

This opens a browser window. Authorise Wrangler to access your account.

---

## Step 2 — Set all secrets

Run each command below. Wrangler will prompt you to paste the value — it is never echoed to the terminal.

### Database (Neon)

```bash
npx wrangler secret put DATABASE_URL
```

**Where to find it:** Neon dashboard → your project → Connection string.  
Use the **pooled** connection string with `?sslmode=require` at the end.

```
postgresql://user:password@ep-xxxx.eu-central-1.aws.neon.tech/neondb?sslmode=require
```

---

### JWT

```bash
npx wrangler secret put JWT_SECRET
```

**Value:** A long random string — generate one with:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Paste the output as the secret value. Keep a copy somewhere safe — if you change it all existing tokens are immediately invalidated.

---

### Stripe

```bash
npx wrangler secret put STRIPE_SECRET_KEY
```

**Where to find it:** Stripe dashboard → Developers → API keys → **Secret key**.  
Use `sk_live_...` for production, `sk_test_...` for staging.

```bash
npx wrangler secret put STRIPE_WEBHOOK_SECRET
```

**Where to find it:** Stripe dashboard → Developers → Webhooks → your endpoint → **Signing secret** (`whsec_...`).  
⚠️ If this is a new deployment you won't have the endpoint URL yet — come back to this after Step 4.

---

### Cloudinary

```bash
npx wrangler secret put CLOUDINARY_CLOUD_NAME
```

**Where to find it:** Cloudinary dashboard → Settings → Account → **Cloud name**.

```bash
npx wrangler secret put CLOUDINARY_API_KEY
```

**Where to find it:** Cloudinary dashboard → Settings → Access Keys → **API Key**.

```bash
npx wrangler secret put CLOUDINARY_API_SECRET
```

**Where to find it:** Cloudinary dashboard → Settings → Access Keys → **API Secret**.

---

### CORS / Frontend origin

```bash
npx wrangler secret put ALLOWED_ORIGINS
```

**Value:** Comma-separated list of allowed frontend origins — no trailing slashes.

```
https://your-app.vercel.app,https://bauhausproduction.com
```

---

### Optional secrets

```bash
npx wrangler secret put FRONTEND_URL
```

**Value:** Your primary frontend URL, used to build Stripe success/cancel redirect URLs.

```
https://bauhausproduction.com
```

```bash
npx wrangler secret put CMS_API_KEY
```

**Value:** A random string used as a shared API key when `BACKEND_MODE=standalone`.  
Only needed if you are calling the API from a non-browser context (e.g. server-side scripts).  
Skip this if you are only calling from the React frontend.

---

## Step 3 — Verify secrets are set

```bash
npx wrangler secret list
```

You should see all the names listed (values are never shown):

```
DATABASE_URL
JWT_SECRET
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
ALLOWED_ORIGINS
FRONTEND_URL
```

---

## Step 4 — Deploy

```bash
npm run deploy
```

This runs `wrangler deploy`. On success, Wrangler prints your Worker URL:

```
Published bauhaus-cms-api (1.23 sec)
  https://bauhaus-cms-api.<your-subdomain>.workers.dev
```

Save this URL — you need it in the next two steps.

---

## Step 5 — Update Stripe webhook endpoint

1. Go to **Stripe dashboard → Developers → Webhooks**.
2. If you have an old endpoint (e.g. `fly.dev` or another URL), click it → **Update details** → change the URL to:
   ```
   https://bauhaus-cms-api.<your-subdomain>.workers.dev/api/stripe/webhook
   ```
3. If no endpoint exists yet, click **Add endpoint** with the URL above.
4. Under **Events to listen for**, enable:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
5. Click **Add endpoint**, then copy the **Signing secret** (`whsec_...`) and run:
   ```bash
   npx wrangler secret put STRIPE_WEBHOOK_SECRET
   ```

---

## Step 6 — Point your frontend at the new API

In your Vercel project settings (or `.env.production`), set:

```
VITE_API_URL=https://bauhaus-cms-api.<your-subdomain>.workers.dev
```

Redeploy the frontend on Vercel after changing this variable.

---

## Step 7 — Smoke test

```bash
curl https://bauhaus-cms-api.<your-subdomain>.workers.dev/api/health
```

Expected response:

```json
{"status":"ok","timestamp":"...","runtime":"hono"}
```

Run a few more checks:

```bash
# Public endpoints
curl https://bauhaus-cms-api.<your-subdomain>.workers.dev/api/articles
curl https://bauhaus-cms-api.<your-subdomain>.workers.dev/api/products
curl https://bauhaus-cms-api.<your-subdomain>.workers.dev/api/product-categories
curl https://bauhaus-cms-api.<your-subdomain>.workers.dev/api/events

# Login (returns a JWT)
curl -X POST https://bauhaus-cms-api.<your-subdomain>.workers.dev/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin01","password":"admin1234"}'
```

---

## Local Cloudflare Worker testing (optional)

If you want to test the Worker runtime locally before deploying:

1. Copy `.dev.vars.example` to `.dev.vars` and fill in all values:
   ```bash
   cp .dev.vars.example .dev.vars
   # then edit .dev.vars with your real credentials
   ```
2. Run the local Worker:
   ```bash
   npm run dev:worker   # starts wrangler dev on port 8787
   ```

`.dev.vars` is gitignored — never commit it.

---

## Secret reference table

| Secret name | Where to get it | Required |
|-------------|----------------|----------|
| `DATABASE_URL` | Neon dashboard → project → Connection string (pooled) | ✅ |
| `JWT_SECRET` | Generate: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"` | ✅ |
| `STRIPE_SECRET_KEY` | Stripe → Developers → API keys → Secret key | ✅ |
| `STRIPE_WEBHOOK_SECRET` | Stripe → Developers → Webhooks → endpoint → Signing secret | ✅ |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary → Settings → Account → Cloud name | ✅ |
| `CLOUDINARY_API_KEY` | Cloudinary → Settings → Access Keys → API Key | ✅ |
| `CLOUDINARY_API_SECRET` | Cloudinary → Settings → Access Keys → API Secret | ✅ |
| `ALLOWED_ORIGINS` | Your Vercel frontend URL(s), comma-separated | ✅ |
| `FRONTEND_URL` | Primary frontend URL for Stripe redirects | Recommended |
| `CMS_API_KEY` | Any random string — only for standalone/script use | Optional |

---

## Re-deploying after code changes

```bash
npm run deploy
```

No need to re-set secrets — they persist on Cloudflare until you explicitly delete them.

---

## Rotating a secret

```bash
npx wrangler secret put JWT_SECRET   # prompts for the new value
```

The Worker picks up the new value immediately on its next request (no redeploy needed).  
⚠️ Rotating `JWT_SECRET` invalidates all existing admin sessions — users will need to log in again.

---

## Viewing Worker logs

```bash
npx wrangler tail
```

Streams live logs from the deployed Worker to your terminal.
