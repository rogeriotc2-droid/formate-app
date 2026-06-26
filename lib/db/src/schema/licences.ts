import { pgTable, serial, text, date, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const licencesTable = pgTable("licences", {
  id: serial("id").primaryKey(),
  userId: text("user_id"),
  workerName: text("worker_name").notNull(),
  recordType: text("record_type").notNull().default("licence"),
  name: text("name").notNull(),
  referenceNumber: text("reference_number"),
  issueDate: date("issue_date", { mode: "string" }),
  expiryDate: date("expiry_date", { mode: "string" }),
  reminderEmail: text("reminder_email"),
  remindersEnabled: boolean("reminders_enabled").notNull().default(true),
  lastReminderWindow: text("last_reminder_window"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertLicenceSchema = createInsertSchema(licencesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertLicence = z.infer<typeof insertLicenceSchema>;
export type Licence = typeof licencesTable.$inferSelect;
