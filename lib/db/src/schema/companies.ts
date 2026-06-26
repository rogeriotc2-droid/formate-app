import { pgTable, text, serial, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const companiesTable = pgTable("companies", {
  id: serial("id").primaryKey(),
  userId: text("user_id").unique(),
  clerkUserId: text("clerk_user_id"),
  businessName: text("business_name").notNull(),
  tradingName: text("trading_name"),
  website: text("website"),
  mainContactName: text("main_contact_name").notNull(),
  mainContactPhone: text("main_contact_phone").notNull(),
  mainContactEmail: text("main_contact_email"),
  safetyRepName: text("safety_rep_name"),
  safetyRepPhone: text("safety_rep_phone"),
  firstAidName: text("first_aid_name"),
  firstAidPhone: text("first_aid_phone"),
  primaryTrade: text("primary_trade").notNull().default("general"),
  signupIntent: text("signup_intent"),
  country: text("country").notNull().default("NZ"),
  state: text("state"),
  plan: text("plan").notNull().default("free"),
  logoUrl: text("logo_url"),
  // Stripe billing
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  // Trial tracking
  trialStartedAt: timestamp("trial_started_at", { withTimezone: true }),
  trialEmail3Sent: boolean("trial_email_3_sent").notNull().default(false),
  trialEmail7LeftSent: boolean("trial_email_7left_sent").notNull().default(false),
  trialEmail3LeftSent: boolean("trial_email_3left_sent").notNull().default(false),
  trialEmailLastSent: boolean("trial_email_last_sent").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertCompanySchema = createInsertSchema(companiesTable).omit({
  id: true,
  userId: true,
  plan: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertCompany = z.infer<typeof insertCompanySchema>;
export type Company = typeof companiesTable.$inferSelect;
