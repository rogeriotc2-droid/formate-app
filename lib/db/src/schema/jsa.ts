import { pgTable, serial, text, integer, jsonb, timestamp } from "drizzle-orm/pg-core";

export const jsaTable = pgTable("jsa", {
  id: serial("id").primaryKey(),
  userId: text("user_id"),
  siteId: integer("site_id"),
  jobName: text("job_name").notNull(),
  status: text("status").notNull().default("draft"),
  data: jsonb("data").notNull().default("{}"),
  lockedAt: timestamp("locked_at", { withTimezone: true }),
  lockedBy: text("locked_by"),
  snapshotPdfKey: text("snapshot_pdf_key"),
  snapshotStatus: text("snapshot_status"), // pending | complete | failed
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export type Jsa = typeof jsaTable.$inferSelect;
