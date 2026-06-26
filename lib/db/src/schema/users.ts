import { pgTable, text, timestamp, boolean } from "drizzle-orm/pg-core";
import { randomUUID } from "node:crypto";

// Internal user identity (replaces Clerk). The `id` is a stable opaque string
// referenced by every tenant-owned table's `user_id` column.
export const usersTable = pgTable("users", {
  id: text("id").primaryKey().$defaultFn(() => `usr_${randomUUID().replace(/-/g, "")}`),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

// Short-lived password-reset tokens. We store only a SHA-256 hash of the token
// (never the raw token) so a DB leak can't be used to reset accounts.
export const passwordResetTokensTable = pgTable("password_reset_tokens", {
  tokenHash: text("token_hash").primaryKey(),
  userId: text("user_id").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  usedAt: timestamp("used_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type User = typeof usersTable.$inferSelect;
export type PasswordResetToken = typeof passwordResetTokensTable.$inferSelect;
