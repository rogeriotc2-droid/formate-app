import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const pcbuPortalsTable = pgTable("pcbu_portals", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type PcbuPortal = typeof pcbuPortalsTable.$inferSelect;
