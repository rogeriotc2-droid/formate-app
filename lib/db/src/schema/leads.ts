import { pgTable, text, serial, timestamp, jsonb } from "drizzle-orm/pg-core";

/**
 * Marketing leads — captured from the public landing page's "Get the free
 * NZ SSSP template" form. These are NOT users (no Clerk account) — just
 * email addresses + optional context we can drip-market to.
 *
 * Source field tracks where the lead came from (e.g. "sssp-template",
 * "flyer-qr", "facebook-group"). Keep it simple — one row per submission.
 */
export const leadsTable = pgTable("leads", {
  id: serial("id").primaryKey(),
  email: text("email").notNull(),
  name: text("name"),
  trade: text("trade"),
  source: text("source").notNull().default("landing"),
  meta: jsonb("meta"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Lead = typeof leadsTable.$inferSelect;
export type NewLead = typeof leadsTable.$inferInsert;
