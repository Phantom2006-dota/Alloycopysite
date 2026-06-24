import express, { type Request, Response, NextFunction } from "express";
import cors from "cors";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";
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
    const signature = req.headers["stripe-signature"];
    if (!signature) return res.status(400).json({ error: "Missing stripe-signature" });
    try {
      const sig = Array.isArray(signature) ? signature[0] : signature;
      await WebhookHandlers.processWebhook(req.body as Buffer, sig);
      res.status(200).json({ received: true });
    } catch (error: any) {
      console.error("Stripe webhook error:", error.message);
      res.status(400).json({ error: "Webhook processing error" });
    }
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
  const originalUrl = req.originalUrl;
  const method = req.method;

  // Log the request start
  console.log(
    `\n📥 [${new Date().toISOString()}] ${method} ${originalUrl} - START`,
  );

  // Log request body for POST/PUT requests (but not for file uploads)
  if (
    (method === "POST" || method === "PUT") &&
    !req.originalUrl.includes("/uploads")
  ) {
    const oldWrite = res.write;
    const oldEnd = res.end;
    const chunks: any[] = [];

    // @ts-ignore
    res.write = function (chunk: any) {
      chunks.push(chunk);
      // @ts-ignore
      return oldWrite.apply(this, arguments);
    };

    // @ts-ignore
    res.end = function (chunk: any) {
      if (chunk) {
        chunks.push(chunk);
      }

      const duration = Date.now() - start;
      const body = Buffer.concat(chunks).toString("utf8");

      // Log response
      console.log(
        `📤 [${new Date().toISOString()}] ${method} ${originalUrl} - ${res.statusCode} (${duration}ms)`,
      );

      if (res.statusCode >= 400 && body) {
        try {
          const jsonBody = JSON.parse(body);
          console.error(`❌ Error Response:`, jsonBody);
        } catch (e) {
          console.error(`❌ Error Response (raw):`, body.substring(0, 500));
        }
      }

      // @ts-ignore
      return oldEnd.apply(this, arguments);
    };
  } else {
    // For other requests, just log completion
    res.on("finish", () => {
      const duration = Date.now() - start;
      console.log(
        `📤 [${new Date().toISOString()}] ${method} ${originalUrl} - ${res.statusCode} (${duration}ms)`,
      );
    });
  }

  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Debug test route
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
  console.log("📨 Echo request received:", {
    body: req.body,
    headers: req.headers,
    files: (req as any).file ? "File present" : "No file",
  });

  res.json({
    message: "Echo received",
    yourData: req.body,
    timestamp: new Date().toISOString(),
    contentType: req.headers["content-type"],
  });
});

app.get("/api/health", (_req: Request, res: Response) => {
  console.log("🏥 Health check called");
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    mode: process.env.BACKEND_MODE || "integrated",
  });
});

const apiRoutesToExclude = ["/api/payments/callback", "/payments/callback", "/api/health", "/health", "/api/stripe/webhook"];

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

// Serve HTML blog pages directly at /blog/:slug — before Vite intercepts
app.get("/blog/:slug", (req: Request, res: Response, next: NextFunction) => {
  const slug = req.params.slug;
  const filePath = path.resolve(__dirname, "../html-blog-pages/", slug + ".html");
  if (fs.existsSync(filePath)) {
    return res.sendFile(filePath);
  }
  next();
});

// Route to check environment variables (for debugging, remove in production)
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

  console.error("\n🔥 GLOBAL ERROR HANDLER:");
  console.error("Status:", status);
  console.error("Message:", message);
  console.error("Stack:", err.stack);
  console.error("Request URL:", _req.originalUrl);
  console.error("Request Method:", _req.method);
  console.error("Request Body:", _req.body);
  console.error("\n");

  res.status(status).json({
    message,
    error: err.name || "InternalServerError",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

(async () => {
  const server = createServer(app);

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
