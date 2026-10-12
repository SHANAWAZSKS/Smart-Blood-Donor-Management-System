/**
 * Vercel Serverless Entry Point — Backend
 *
 * Vercel runs this file as a Node.js serverless function.
 * It boots the Express app and exports it so Vercel can call it per-request.
 *
 * The full app is in TypeScript (_core/index.ts) but Vercel's @vercel/node
 * build step compiles TypeScript automatically, so we just re-export the
 * compiled app here.
 */

// Load environment variables first
import "dotenv/config";

import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "../routers.js";
import { createContext } from "../_core/context.js";
import { registerOAuthRoutes } from "../_core/oauth.js";
import { registerStorageProxy } from "../_core/storageProxy.js";
import cors from "cors";

const app = express();

// ── CORS ─────────────────────────────────────────────────────────────────────
// Allow the Vercel-deployed frontend to call this backend cross-origin.
const ALLOWED_ORIGINS = [
  "https://smart-blood-donor-management-system.vercel.app",
  "http://localhost:3000",
  "http://localhost:5173",
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (curl, Postman, server-to-server)
      if (!origin) return callback(null, true);
      if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
      callback(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true, // required so the session cookie is sent cross-origin
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ── Body parsing ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// ── Routes ────────────────────────────────────────────────────────────────────
registerStorageProxy(app);
registerOAuthRoutes(app);

// tRPC API at /api/trpc
app.use(
  "/api/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext,
  })
);

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ── Export for Vercel ─────────────────────────────────────────────────────────
export default app;
