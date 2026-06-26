import { pgTable, serial, text, integer, jsonb, timestamp } from "drizzle-orm/pg-core";

export const ssspsTable = pgTable("sssps", {
  id: serial("id").primaryKey(),
  // Clerk user id of the tradie this SSSP belongs to. Nullable so legacy rows
  // remain readable; new rows always set it. Used to scope sticky prefill so
  // each tradie's last SSSP only carries forward into their own next plan.
  userId: text("user_id"),
  siteId: integer("site_id"),
  projectName: text("project_name").notNull(),
  status: text("status").notNull().default("draft"), // draft | active | archived
  data: jsonb("data").notNull().default("{}"),
  lockedAt: timestamp("locked_at", { withTimezone: true }),
  lockedBy: text("locked_by"),
  snapshotPdfKey: text("snapshot_pdf_key"),
  snapshotStatus: text("snapshot_status"), // pending | complete | failed
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export type Sssp = typeof ssspsTable.$inferSelect;
