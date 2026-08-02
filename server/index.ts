import express, { type Request, Response, NextFunction } from "express";
import cors from "cors";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";
import { runStartupMigrations } from "./db";
import authRoutes from "./routes/auth";
import articlesRoutes from "./routes/articles";
import categoriesRoutes from "./routes/categories";
import tagsRoutes from "./routes/tags";
import mediaItemsRoutes from "./routes/mediaItems";
import teamMembersRoutes from "./routes/teamMembers";
import eventsRoutes from "./routes/events";
import uploadsRoutes from "./routes/uploads";
import productsRoutes from "./routes/products";
import productCategoriesRoutes from "./routes/productCategories";
import paymentsRoutes from "./routes/payments";
import htmlBlogRoutes from "./routes/htmlBlog";
import pressRoutes from "./routes/press";
import { WebhookHandlers } from "./webhookHandlers";
import fs from "fs";
import { validateApiKey, checkApiKeyConfigured } from "./middleware/apiKey";
import { setupVite, serveStatic } from "./vite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isStandaloneMode = process.env.BACKEND_MODE === "standalone";

checkApiKeyConfigured();

const app = express();
const PORT = parseInt(process.env.PORT || "5000", 10);

// Trust proxy headers for Fly.io and other reverse proxies
app.set('trust proxy', 1);

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map((origin) => origin.trim())
  : isStandaloneMode
    ? []
    : ["*"];

// Stripe webhook must be registered BEFORE express.json() so body is raw Buffer
app.post(
  "/api/stripe/webhook",
  express.raw({ type: "application/json" }),
  async (req: Request, res: Response) => {
    const ts = new Date().toISOString();
    console.log(`\n[STRIPE WEBHOOK] ── ${ts} ──────────────────────────`);
    console.log(`[STRIPE WEBHOOK] Content-Type : ${req.headers["content-type"]}`);
    console.log(`[STRIPE WEBHOOK] Body type    : ${typeof req.body} | isBuffer: ${Buffer.isBuffer(req.body)} | length: ${req.body?.length ?? 0}`);

    const signature = req.headers["stripe-signature"];
    if (!signature) {
      console.error("[STRIPE WEBHOOK] ❌ Missing stripe-signature header — Stripe did not send this or the header was stripped by a proxy");
      return res.status(400).json({ error: "Missing stripe-signature" });
    }
    console.log(`[STRIPE WEBHOOK] Signature    : ${String(signature).substring(0, 60)}…`);

    // Check webhook secret availability before attempting verification
    const hasWebhookSecret = !!(process.env.STRIPE_WEBHOOK_SECRET);
    console.log(`[STRIPE WEBHOOK] Webhook secret configured: ${hasWebhookSecret}`);
    if (!hasWebhookSecret) {
      console.error("[STRIPE WEBHOOK] ❌ STRIPE_WEBHOOK_SECRET is not set — signature verification will fail");
    }

    try {
      const sig = Array.isArray(signature) ? signature[0] : signature;
      await WebhookHandlers.processWebhook(req.body as Buffer, sig);
      console.log(`[STRIPE WEBHOOK] ✅ Processed successfully`);
      res.status(200).json({ received: true });
    } catch (error: any) {
      console.error(`[STRIPE WEBHOOK] ❌ Error: ${error.message}`);
      if (error.message?.includes("No signatures found")) {
        console.error("[STRIPE WEBHOOK]    → Signature mismatch. Common causes:");
        console.error("[STRIPE WEBHOOK]      1. STRIPE_WEBHOOK_SECRET doesn't match the endpoint secret in Stripe Dashboard");
        console.error("[STRIPE WEBHOOK]      2. Request body was parsed (not raw Buffer) before reaching this handler");
        console.error("[STRIPE WEBHOOK]      3. A reverse proxy modified the body before forwarding");
      }
      if (error.message?.includes("Timestamp outside")) {
        console.error("[STRIPE WEBHOOK]    → Timestamp too old — Stripe replays must arrive within 300s");
      }
      res.status(400).json({ error: "Webhook processing error", detail: error.message });
    }
    console.log(`[STRIPE WEBHOOK] ────────────────────────────────────────\n`);
  }
);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin && !isStandaloneMode) {
        callback(null, true);
      } else if (
        allowedOrigins.length === 0 ||
        allowedOrigins.includes("*") ||
        (origin && allowedOrigins.includes(origin))
      ) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-API-Key"],
  }),
);

// Add request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  const { originalUrl, method } = req;
  res.on("finish", () => {
    const duration = Date.now() - start;
    console.log(
      `[${new Date().toISOString()}] ${method} ${originalUrl} - ${res.statusCode} (${duration}ms)`,
    );
  });
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Debug routes — development only
if (process.env.NODE_ENV === "development") {
app.get("/api/debug/test", (_req: Request, res: Response) => {
  console.log("✅ Debug route called at", new Date().toISOString());
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    environment: {
      node_env: process.env.NODE_ENV,
      mode: isStandaloneMode ? "standalone" : "integrated",
      port: PORT,
    },
    cloudinary: {
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME
        ? `${process.env.CLOUDINARY_CLOUD_NAME.substring(0, 10)}...`
        : "Not set",
      configured:
        !!process.env.CLOUDINARY_CLOUD_NAME &&
        !!process.env.CLOUDINARY_API_KEY &&
        !!process.env.CLOUDINARY_API_SECRET,
    },
    database: {
      configured: !!process.env.DATABASE_URL,
    },
  });
});

// Simple echo route for testing POST requests
app.post("/api/debug/echo", (req: Request, res: Response) => {
  res.json({
    message: "Echo received",
    yourData: req.body,
    timestamp: new Date().toISOString(),
    contentType: req.headers["content-type"],
  });
});
} // end development-only debug routes

// Stripe diagnostic endpoint — available in all environments
app.get("/api/stripe/debug", async (_req: Request, res: Response) => {
  const result: Record<string, any> = {
    timestamp: new Date().toISOString(),
    env: {
      STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY
        ? `${process.env.STRIPE_SECRET_KEY.substring(0, 8)}… (${process.env.STRIPE_SECRET_KEY.startsWith('sk_live') ? 'LIVE' : 'TEST'} key)`
        : "❌ NOT SET",
      STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET
        ? `${process.env.STRIPE_WEBHOOK_SECRET.substring(0, 10)}… (set)`
        : "❌ NOT SET",
      DATABASE_URL: process.env.DATABASE_URL ? "✅ set" : "❌ NOT SET",
    },
    stripeClientTest: null as any,
    webhookEndpointUrl: "POST /api/stripe/webhook",
    notes: [] as string[],
  };

  if (!process.env.STRIPE_SECRET_KEY) {
    result.notes.push("STRIPE_SECRET_KEY is missing — all payment routes will fail");
  }
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    result.notes.push("STRIPE_WEBHOOK_SECRET is missing — webhook signature verification will fail");
  }

  try {
    const { getUncachableStripeClient } = await import("./stripeClient");
    const stripe = await getUncachableStripeClient();
    // Make a lightweight API call to verify the key actually works
    const account = await (stripe as any).accounts ? null : await stripe.balance.retrieve().catch(() => null);
    result.stripeClientTest = { ok: true, note: "Stripe client initialised successfully" };
  } catch (e: any) {
    result.stripeClientTest = { ok: false, error: e.message };
    result.notes.push(`Stripe client error: ${e.message}`);
  }

  res.json(result);
});

app.get("/api/health", (_req: Request, res: Response) => {
  console.log("🏥 Health check called");
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    version: "2.0.0",
    mode: process.env.BACKEND_MODE || "integrated",
    routes: ["html-blog", "media", "products", "auth", "articles", "events", "team"],
  });
});

// Diagnostics for the local-disk uploads directory (thumbnails, etc.).
// Use this in production to confirm the uploads dir exists, is writable,
// and that files survive across requests/restarts (Fly.io machines wipe
// unmounted disk on every deploy/restart unless a volume is mounted at
// this path — see fly.toml [[mounts]]).
app.get("/api/debug/uploads", (_req: Request, res: Response) => {
  const uploadsDir = path.resolve(__dirname, "../uploads");
  const thumbsDir = path.join(uploadsDir, "thumbnails");
  const info: Record<string, any> = {
    uploadsDir,
    uploadsDirExists: fs.existsSync(uploadsDir),
    thumbsDir,
    thumbsDirExists: fs.existsSync(thumbsDir),
  };

  try {
    if (info.thumbsDirExists) {
      const files = fs.readdirSync(thumbsDir);
      info.thumbnailFileCount = files.length;
      info.thumbnailFiles = files.slice(0, 20).map((name) => {
        const stat = fs.statSync(path.join(thumbsDir, name));
        return { name, sizeBytes: stat.size, modifiedAt: stat.mtime.toISOString() };
      });
    } else {
      info.thumbnailFileCount = 0;
      info.thumbnailFiles = [];
    }

    const probeFile = path.join(uploadsDir, `.write-test-${Date.now()}`);
    fs.mkdirSync(uploadsDir, { recursive: true });
    fs.writeFileSync(probeFile, "ok");
    fs.unlinkSync(probeFile);
    info.writable = true;
  } catch (error: any) {
    info.writable = false;
    info.writeError = error.message;
  }

  res.json(info);
});

const apiRoutesToExclude = ["/api/payments/callback", "/payments/callback", "/api/health", "/health", "/api/stripe/webhook", "/api/html-blog/ping", "/api/html-blog"];

const conditionalValidateApiKey = (req: Request, res: Response, next: NextFunction) => {
  const path = req.path;
  const originalUrl = req.originalUrl;
  
  const isExcluded = apiRoutesToExclude.some(route => 
    path === route || 
    path.startsWith(route + "?") ||
    originalUrl === route ||
    originalUrl.startsWith(route + "?")
  );

  if (isExcluded) {
    return next();
  }
  return validateApiKey(req, res, next);
};

if (isStandaloneMode) {
  app.use("/api", conditionalValidateApiKey);
}

// Static file serving for uploads and attached_assets
app.use("/uploads", express.static(path.resolve(__dirname, "../uploads")));
app.use("/attached_assets", express.static(path.resolve(__dirname, "../attached_assets")));

app.use("/api/auth", authRoutes);
app.use("/api/articles", articlesRoutes);
app.use("/api/categories", categoriesRoutes);
app.use("/api/tags", tagsRoutes);
app.use("/api/media", mediaItemsRoutes);
app.use("/api/team", teamMembersRoutes);
app.use("/api/events", eventsRoutes);
app.use("/api/uploads", uploadsRoutes);
app.use("/api/products", productsRoutes);
app.use("/api/product-categories", productCategoriesRoutes);
app.use("/api/payments", paymentsRoutes);
app.use("/api/html-blog", htmlBlogRoutes);
app.use("/api/press", pressRoutes);


if (process.env.NODE_ENV === "development") {
  // Route to check environment variables (development only)
  app.get("/api/debug/env", (_req: Request, res: Response) => {
    res.json({
      port: PORT,
      node_env: process.env.NODE_ENV,
      backend_mode: process.env.BACKEND_MODE,
      allowed_origins: allowedOrigins,
      cloudinary_configured: !!process.env.CLOUDINARY_CLOUD_NAME,
      database_configured: !!process.env.DATABASE_URL,
      api_key_configured: !!process.env.CMS_API_KEY,
    });
  });
}

// Custom 404 handler for API routes
app.use("/api", (_req: Request, res: Response) => {
  res.status(404).json({
    message: "API endpoint not found",
    error: "The requested API endpoint does not exist",
    requestedPath: _req.originalUrl,
  });
});

// Global error handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const status = err.status || 500;
  const message = err.message || "Something went wrong";

  console.error(`[ERROR] ${_req.method} ${_req.originalUrl} - ${status}: ${message}`);

  res.status(status).json({
    message,
    error: err.name || "InternalServerError",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

(async () => {
  const server = createServer(app);

  // Auto-create any missing tables on startup
  await runStartupMigrations();

  // Display startup configuration
  console.log("\n" + "=".repeat(60));
  console.log("🚀 SERVER STARTUP CONFIGURATION");
  console.log("=".repeat(60));
  console.log(`📌 Port: ${PORT}`);
  console.log(
    `🏗️  Mode: ${isStandaloneMode ? "Standalone Backend" : "Integrated (Frontend + Backend)"}`,
  );
  console.log(`🌱 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(
    `☁️  Cloudinary: ${process.env.CLOUDINARY_CLOUD_NAME ? "✓ Configured" : "✗ Not configured"}`,
  );
  console.log(
    `🗄️  Database: ${process.env.DATABASE_URL ? "✓ Configured" : "✗ Not configured"}`,
  );
  console.log(
    `🔑 API Key Auth: ${process.env.CMS_API_KEY ? "✓ Enabled" : "✗ Disabled"}`,
  );
  console.log("=".repeat(60) + "\n");

  if (!isStandaloneMode) {
    if (process.env.NODE_ENV === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }
  } else {
    console.log("Running in standalone backend mode - no frontend served");
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`✅ Server is running!`);
    console.log(`   Local: http://localhost:${PORT}`);
    console.log(`   Network: http://0.0.0.0:${PORT}`);
    
    console.log(`   🌐 Root URL: http://localhost:${PORT}/`);

    console.log("\n🔍 Available Debug Routes:");
    console.log(`   • Health Check: http://localhost:${PORT}/api/health`);
    console.log(`   • Debug Test: http://localhost:${PORT}/api/debug/test`);
    console.log(
      `   • Echo Test (POST): http://localhost:${PORT}/api/debug/echo`,
    );
    console.log(
      `   • Environment Info: http://localhost:${PORT}/api/debug/env`,
    );
    console.log(
      `   • Media DB Test: http://localhost:${PORT}/api/media/debug/test-db`,
    );
    console.log(
      `   • Events DB Test: http://localhost:${PORT}/api/events/debug/test-db`,
    );

    console.log("\n📚 Main API Routes:");
    console.log(`   • Auth: /api/auth/*`);
    console.log(`   • Media Items: /api/media/*`);
    console.log(`   • Events: /api/events/*`);
    console.log(`   • Uploads: /api/uploads/*`);
    console.log(`   • Articles: /api/articles/*`);
    console.log("\n" + "=".repeat(60) + "\n");
  });

  // Handle server errors
  server.on("error", (error: Error) => {
    console.error("💥 Server error:", error);
    process.exit(1);
  });

  // Handle graceful shutdown
  process.on("SIGTERM", () => {
    console.log("🛑 SIGTERM received, shutting down gracefully...");
    server.close(() => {
      console.log("✅ Server closed");
      process.exit(0);
    });
  });

  process.on("SIGINT", () => {
    console.log("🛑 SIGINT received, shutting down...");
    server.close(() => {
      console.log("✅ Server closed");
      process.exit(0);
    });
  });
})();
// [file content end]
