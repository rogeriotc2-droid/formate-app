import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { pool } from "@workspace/db";

// Make our session payload type-safe across the app.
declare module "express-session" {
  interface SessionData {
    userId?: string;
  }
}

const PgStore = connectPgSimple(session);

const THIRTY_DAYS_MS = 1000 * 60 * 60 * 24 * 30;

export function createSessionMiddleware() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error("SESSION_SECRET must be set (>=16 chars) for session signing");
  }

  return session({
    store: new PgStore({
      pool,
      tableName: "user_sessions",
      // The table is provisioned via the DB schema migration. We must NOT use
      // createTableIfMissing here: connect-pg-simple reads a bundled table.sql
      // at runtime, which doesn't survive esbuild bundling into dist/.
      createTableIfMissing: false,
      pruneSessionInterval: 60 * 60, // prune expired rows hourly
    }),
    name: "formate.sid",
    secret,
    resave: false,
    saveUninitialized: false,
    rolling: true, // refresh expiry on activity
    proxy: true, // trust X-Forwarded-Proto from the Replit reverse proxy
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: THIRTY_DAYS_MS,
      path: "/",
    },
  });
}
