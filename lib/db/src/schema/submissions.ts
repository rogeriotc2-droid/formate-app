import { pgTable, serial, text, timestamp, jsonb, integer, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { sitesTable } from "./sites";
import { templatesTable } from "./templates";

export const submissionsTable = pgTable("submissions", {
  id: serial("id").primaryKey(),
  userId: text("user_id"),
  templateId: integer("template_id").notNull().references(() => templatesTable.id),
  templateName: text("template_name").notNull(),
  siteId: integer("site_id").notNull().references(() => sitesTable.id),
  siteName: text("site_name").notNull(),
  submittedBy: text("submitted_by").notNull(),
  status: text("status").notNull().default("submitted"),
  values: jsonb("values").notNull().default({}),
  notes: text("notes"),
  reviewedBy: text("reviewed_by"),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  latitude: real("latitude"),
  longitude: real("longitude"),
  clientTimestamp: timestamp("client_timestamp", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertSubmissionSchema = createInsertSchema(submissionsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertSubmission = z.infer<typeof insertSubmissionSchema>;
export type Submission = typeof submissionsTable.$inferSelect;

export const stickyValuesTable = pgTable("sticky_values", {
  id: serial("id").primaryKey(),
  templateId: integer("template_id").notNull().references(() => templatesTable.id),
  values: jsonb("values").notNull().default({}),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});
