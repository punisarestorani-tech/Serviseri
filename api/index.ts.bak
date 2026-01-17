import type { VercelRequest, VercelResponse } from '@vercel/node';
import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import pgSession from "connect-pg-simple";
import pg from "pg";
import { registerRoutes } from "../server/routes";

const app = express();

// Trust proxy for secure cookies
app.set('trust proxy', 1);

declare module 'express-session' {
  interface SessionData {
    userId?: string;
    organizationId?: string;
    userRole?: string;
  }
}

// CORS configuration
app.use((req, res, next) => {
  const origin = req.headers.origin;

  if (!origin || origin.includes('vercel.app') || origin.includes('localhost')) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
  }
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Database-backed session store for serverless
const PgStore = pgSession(session);
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

app.use(session({
  store: new PgStore({
    pool,
    tableName: 'session',
    createTableIfMissing: true
  }),
  secret: process.env.SESSION_SECRET || 'your-secret-key-change-this',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: true,
    httpOnly: true,
    sameSite: 'none',
    maxAge: 1000 * 60 * 60 * 24 * 7 // 7 days
  }
}));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Register all routes
let routesRegistered = false;
let routePromise: Promise<void> | null = null;

async function ensureRoutes() {
  if (routesRegistered) return;
  if (routePromise) return routePromise;

  routePromise = (async () => {
    await registerRoutes(app);
    routesRegistered = true;
  })();

  return routePromise;
}

// Error handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  res.status(status).json({ message });
});

// Vercel serverless handler
export default async function handler(req: VercelRequest, res: VercelResponse) {
  await ensureRoutes();

  return new Promise((resolve, reject) => {
    app(req as any, res as any, (err: any) => {
      if (err) {
        reject(err);
      } else {
        resolve(undefined);
      }
    });
  });
}
