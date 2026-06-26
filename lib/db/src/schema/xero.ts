import { pgTable, text, serial, timestamp, integer, jsonb } from "drizzle-orm/pg-core";

export const xeroConnectionsTable = pgTable("xero_connections", {
  id: serial("id").primaryKey(),
  userId: text("user_id").unique(),
  clerkUserId: text("clerk_user_id"),
  tenantId: text("tenant_id").notNull(),
  tenantName: text("tenant_name").notNull(),
  accessToken: text("access_token").notNull(),
  refreshToken: text("refresh_token").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  scopes: text("scopes").notNull(),
  lastSyncedAt: timestamp("last_synced_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const xeroContactsTable = pgTable("xero_contacts", {
  id: serial("id").primaryKey(),
  userId: text("user_id"),
  clerkUserId: text("clerk_user_id"),
  xeroContactId: text("xero_contact_id").notNull(),
  name: text("name").notNull(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  emailAddress: text("email_address"),
  phone: text("phone"),
  addressLine: text("address_line"),
  city: text("city"),
  postalCode: text("postal_code"),
  country: text("country"),
  isCustomer: integer("is_customer").notNull().default(0),
  isSupplier: integer("is_supplier").notNull().default(0),
  raw: jsonb("raw"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export type XeroConnection = typeof xeroConnectionsTable.$inferSelect;
export type XeroContact = typeof xeroContactsTable.$inferSelect;
