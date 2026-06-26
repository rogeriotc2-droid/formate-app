import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";

/**
 * Append-only audit trail for document lock + snapshot events.
 *
 * INVARIANT: the application must ONLY INSERT into this table — never UPDATE or
 * DELETE. It is the independent, tamper-evident record that proves when a
 * document was locked, by whom, and what its content/PDF hash was at that
 * moment, even if the source row is later altered by a bug, bad migration, or
 * direct DB edit.
 *
 * Two event types per document:
 *  - 'locked'   — written at lock time, carries contentHash (pdfHash null)
 *  - 'snapshot' — written when the PDF snapshot finishes, carries pdfHash
 * Both rows carry documentId, documentType, siteId and actorId so a future
 * "all contractors on this site" export is a query change, not a schema change.
 */
export const auditLogTable = pgTable("audit_log", {
  id: serial("id").primaryKey(),
  documentType: text("document_type").notNull(), // 'jsa' | 'swms' | 'sssp'
  documentId: integer("document_id").notNull(),
  eventType: text("event_type").notNull(), // 'locked' | 'snapshot'
  occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull().defaultNow(),
  actorId: text("actor_id"),
  siteId: integer("site_id"),
  contentHash: text("content_hash"),
  pdfHash: text("pdf_hash"),
});

export type AuditLog = typeof auditLogTable.$inferSelect;
