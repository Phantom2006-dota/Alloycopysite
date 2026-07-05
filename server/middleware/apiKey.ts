import { Request, Response, NextFunction } from "express";

export interface ApiKeyRequest extends Request {
  apiKeyValid?: boolean;
}

export function validateApiKey(req: ApiKeyRequest, res: Response, next: NextFunction) {
  const apiKey = req.headers["x-api-key"] as string;
  const configuredApiKey = process.env.CMS_API_KEY;
  const isStandaloneMode = process.env.BACKEND_MODE === "standalone";

  if (!configuredApiKey) {
    if (isStandaloneMode) {
      return res.status(503).json({ 
        message: "Service unavailable",
        error: "CMS_API_KEY is not configured. Backend requires API key in standalone mode." 
      });
    }
    req.apiKeyValid = true;
    return next();
  }

  if (!apiKey) {
    return res.status(401).json({ 
      message: "API key required",
      error: "Missing x-api-key header" 
    });
  }

  if (apiKey !== configuredApiKey) {
    return res.status(403).json({ 
      message: "Invalid API key",
      error: "The provided API key is not valid" 
    });
  }

  req.apiKeyValid = true;
  next();
}

export function optionalApiKey(req: ApiKeyRequest, res: Response, next: NextFunction) {
  const apiKey = req.headers["x-api-key"] as string;
  const configuredApiKey = process.env.CMS_API_KEY;

  if (!configuredApiKey || !apiKey) {
    req.apiKeyValid = false;
    return next();
  }

  req.apiKeyValid = apiKey === configuredApiKey;
  next();
}

export function checkApiKeyConfigured(): void {
  const isStandaloneMode = process.env.BACKEND_MODE === "standalone";
  const configuredApiKey = process.env.CMS_API_KEY;
  
  if (isStandaloneMode && !configuredApiKey) {
    console.error("FATAL: CMS_API_KEY must be set when running in standalone mode.");
    console.error("Set CMS_API_KEY environment variable and restart the server.");
    process.exit(1);
  }
}
