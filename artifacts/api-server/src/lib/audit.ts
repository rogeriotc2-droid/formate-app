/**
 * Append-only audit trail helpers.
 *
 * The audit_log table is INSERT-only. These helpers never UPDATE or DELETE.
 * - recordLockEvent  — one 'locked' row at lock time, carrying the content hash.
 * - recordSnapshotEvent — one 'snapshot' row when the PDF finishes, carrying the pdf hash.
 *
 * The content hash is a SHA-256 over a canonical (stable-key-ordered) JSON of the
 * document's substantive content, so the same content always hashes identically
 * regardless of key insertion order.
 */

import { createHash } from "node:crypto";
import { and, eq, inArray } from "drizzle-orm";
import { db, auditLogTable } from "@workspace/db";

export type DocumentType = "jsa" | "swms" | "sssp";

/** Deterministic JSON: object keys sorted recursively so hashing is stable. */
function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(",")}]`;
  }
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  return `{${keys.map(k => `${JSON.stringify(k)}:${stableStringify(obj[k])}`).join(",")}}`;
}

export function sha256Hex(input: string | Buffer): string {
  return createHash("sha256").update(input).digest("hex");
}

/** SHA-256 of the document's substantive content at lock time. */
export function computeContentHash(content: unknown): string {
  return sha256Hex(stableStringify(content));
}

interface LockEventArgs {
  documentType: DocumentType;
  documentId: number;
  actorId: string | null;
  siteId: number | null;
  contentHash: string;
}

/** INSERT a 'locked' audit row. Returns nothing — append-only. */
export async function recordLockEvent(args: LockEventArgs): Promise<void> {
  await db.insert(auditLogTable).values({
    documentType: args.documentType,
    documentId: args.documentId,
    eventType: "locked",
    actorId: args.actorId,
    siteId: args.siteId,
    contentHash: args.contentHash,
  });
}

interface SnapshotEventArgs {
  documentType: DocumentType;
  documentId: number;
  actorId: string | null;
  siteId: number | null;
  pdfHash: string;
}

/** INSERT a 'snapshot' audit row carrying the PDF hash. Append-only. */
export async function recordSnapshotEvent(args: SnapshotEventArgs): Promise<void> {
  await db.insert(auditLogTable).values({
    documentType: args.documentType,
    documentId: args.documentId,
    eventType: "snapshot",
    actorId: args.actorId,
    siteId: args.siteId,
    pdfHash: args.pdfHash,
  });
}

export interface AuditHashes {
  contentHash: string | null;
  pdfHash: string | null;
  lockedAt: Date | null;
  actorId: string | null;
  siteId: number | null;
}

/**
 * Collapse the append-only audit rows for a set of documents into one record
 * per document: the content hash from its 'locked' row and the pdf hash from
 * its 'snapshot' row. Used to build the audit-bundle manifest.
 */
export async function fetchAuditHashes(
  documentType: DocumentType,
  documentIds: number[],
): Promise<Map<number, AuditHashes>> {
  const map = new Map<number, AuditHashes>();
  if (documentIds.length === 0) return map;
  const rows = await db
    .select()
    .from(auditLogTable)
    .where(and(
      eq(auditLogTable.documentType, documentType),
      inArray(auditLogTable.documentId, documentIds),
    ));
  for (const r of rows) {
    const cur = map.get(r.documentId) ?? { contentHash: null, pdfHash: null, lockedAt: null, actorId: null, siteId: null };
    if (r.eventType === "locked") {
      cur.contentHash = r.contentHash;
      cur.lockedAt = r.occurredAt;
      cur.actorId = r.actorId;
      cur.siteId = r.siteId;
    } else if (r.eventType === "snapshot") {
      cur.pdfHash = r.pdfHash;
    }
    map.set(r.documentId, cur);
  }
  return map;
}
