import { pgTable, text, serial, timestamp, unique } from "drizzle-orm/pg-core";

export const integrationInterestTable = pgTable("integration_interest", {
  id: serial("id").primaryKey(),
  userId: text("user_id"),
  clerkUserId: text("clerk_user_id"),
  provider: text("provider").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [unique().on(t.userId, t.provider)]);

export type IntegrationInterest = typeof integrationInterestTable.$inferSelect;
