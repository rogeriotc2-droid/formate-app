import { pgTable, varchar, json, timestamp, index } from "drizzle-orm/pg-core";

// Session store table for connect-pg-simple (express-session).
// connect-pg-simple manages the row contents at runtime, but the table itself
// is provisioned here so it ships with the schema migration on publish
// (createTableIfMissing is intentionally false — see middlewares/session.ts).
export const userSessionsTable = pgTable(
  "user_sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: json("sess").notNull(),
    expire: timestamp("expire", { precision: 6 }).notNull(),
  },
  (t) => [index("IDX_user_sessions_expire").on(t.expire)],
);
