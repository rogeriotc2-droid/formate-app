import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const sitesTable = pgTable("sites", {
  id: serial("id").primaryKey(),
  userId: text("user_id"),
  name: text("name").notNull(),
  address: text("address").notNull(),
  pcbu: text("pcbu").notNull(),
  principalEmail: text("principal_email"),
  contactName: text("contact_name"),
  contactPhone: text("contact_phone"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertSiteSchema = createInsertSchema(sitesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertSite = z.infer<typeof insertSiteSchema>;
export type Site = typeof sitesTable.$inferSelect;
