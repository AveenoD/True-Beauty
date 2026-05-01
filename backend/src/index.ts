import "dotenv/config";
import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import routes from "./routes";
import { errorHandler } from "./middleware/errorHandler";
import { requestContext } from "./middleware/requestContext";
import { httpLogger } from "./middleware/httpLogger";
import { log } from "./utils/logger";
import { uploadErrorHandler } from "./middleware/uploadErrorHandler";

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
app.use(cookieParser());
const corsOrigins = (process.env.CORS_ORIGIN || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const port = String(process.env.PORT || 3000);
const apiBase =
  (process.env.API_BASE_URL || "").replace(/\/$/, "") ||
  `http://localhost:${port}`;
// Same-origin browser calls (e.g. Swagger UI at /docs on this API) send Origin = API host
const sameOriginAllowlist = new Set<string>([
  apiBase,
  `http://localhost:${port}`,
  `http://127.0.0.1:${port}`,
]);

const devFrontendAllowlist = new Set<string>(
  process.env.NODE_ENV === "production"
    ? []
    : [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
      ]
);

app.use(
  cors({
    origin(origin, callback) {
      // Allow non-browser clients (no Origin header)
      if (!origin) return callback(null, true);

      // If no explicit origins configured, reflect the request origin
      if (corsOrigins.length === 0) return callback(null, true);

      // Support comma-separated origins in CORS_ORIGIN
      if (corsOrigins.includes(origin)) return callback(null, true);

      // Allow this API's own origin (Swagger UI, etc.)
      if (sameOriginAllowlist.has(origin)) return callback(null, true);

      // Dev: allow local frontends without requiring env config
      if (devFrontendAllowlist.has(origin)) return callback(null, true);

      // Do not pass Error — that becomes a 500; CORS deny is not an application error
      return callback(null, false);
    },
    credentials: true,
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || "15") * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX || "100"),
  message: { success: false, message: "Too many requests, please try again later" },
});
app.use(limiter);

// Body parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Logging
app.use(requestContext);
app.use(httpLogger);

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// API routes
app.use("/", routes);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// Global error handler
app.use(errorHandler);

// Multer upload error handler (must be after errorHandler to catch multer errors)
app.use(uploadErrorHandler);

// Start server
app.listen(PORT, () => {
  log("info", "server_started", {
    port: PORT,
    env: process.env.NODE_ENV || "development",
  });
});

export default app;
