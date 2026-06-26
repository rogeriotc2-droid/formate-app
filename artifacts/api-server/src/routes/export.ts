/**
 * GET /api/export/submissions.csv  — all form submissions as CSV
 * GET /api/export/documents.csv    — all JSAs + SWMSs (with lock status)
 *
 * Both are auth-guarded, ownership-scoped, and return a file attachment.
 * No new dependencies — plain string CSV, no library needed.
 */

import { ZipArchive } from "archiver";
import { Router, type Request, type Response } from "express";
import { eq, desc, and, inArray, isNotNull } from "drizzle-orm";
import { Storage } from "@google-cloud/storage";
import { db, submissionsTable, jsaTable, swmsTable, ssspsTable, sitesTable } from "@workspace/db";
import { fetchAuditHashes } from "../lib/audit";

const REPLIT_SIDECAR_ENDPOINT = "http://127.0.0.1:1106";
const storageClient = new Storage({
  credentials: {
    audience: "replit",
    subject_token_type: "access_token",
    token_url: `${REPLIT_SIDECAR_ENDPOINT}/token`,
    type: "external_account",
    credential_source: {
      url: `${REPLIT_SIDECAR_ENDPOINT}/credential`,
      format: { type: "json", subject_token_field_name: "access_token" },
    },
    universe_domain: "googleapis.com",
  },
  projectId: "",
});

function parseStoragePath(path: string): { bucketName: string; objectName: string } {
  const cleaned = path.startsWith("/") ? path.slice(1) : path;
  const idx = cleaned.indexOf("/");
  if (idx === -1) return { bucketName: cleaned, objectName: "" };
  return { bucketName: cleaned.slice(0, idx), objectName: cleaned.slice(idx + 1) };
}

function getUserId(req: Request): string {
  return (req as Request & { userId?: string }).userId ?? "";
}

function esc(val: unknown): string {
  if (val === null || val === undefined) return "";
  const s = String(val);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function formatDate(d: Date | string | null | undefined): string {
  if (!d) return "";
  try {
    return new Date(d).toISOString().slice(0, 10);
  } catch {
    return "";
  }
}

function formatDateTime(d: Date | string | null | undefined): string {
  if (!d) return "";
  try {
    const dt = new Date(d);
    return `${dt.toISOString().slice(0, 10)} ${dt.toISOString().slice(11, 16)}`;
  } catch {
    return "";
  }
}

const router = Router();

// GET /api/export/submissions.csv
router.get("/export/submissions.csv", async (req: Request, res: Response) => {
  const userId = getUserId(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  try {
    const submissions = await db
      .select()
      .from(submissionsTable)
      .where(eq(submissionsTable.userId, userId))
      .orderBy(desc(submissionsTable.createdAt));

    const header = ["#", "Date", "Time", "Template", "Site", "Submitted By", "Status", "Reviewed By", "Reviewed Date", "Notes"].join(",");

    const rows = submissions.map(s => [
      esc(s.id),
      esc(formatDate(s.clientTimestamp ?? s.createdAt)),
      esc(s.clientTimestamp ? new Date(s.clientTimestamp).toISOString().slice(11, 16) : new Date(s.createdAt).toISOString().slice(11, 16)),
      esc(s.templateName),
      esc(s.siteName),
      esc(s.submittedBy),
      esc(s.status),
      esc(s.reviewedBy ?? ""),
      esc(formatDate(s.reviewedAt)),
      esc(s.notes ?? ""),
    ].join(","));

    const csv = [header, ...rows].join("\n");
    const today = formatDate(new Date());

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="formate-submissions-${today}.csv"`);
    res.end(csv);
  } catch (err) {
    req.log.error({ err }, "Failed to export submissions CSV");
    res.status(500).json({ error: "Export failed" });
  }
});

// GET /api/export/documents.csv — JSAs + SWMSs
router.get("/export/documents.csv", async (req: Request, res: Response) => {
  const userId = getUserId(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  try {
    const [jsas, swmsList] = await Promise.all([
      db.select().from(jsaTable).where(eq(jsaTable.userId, userId)).orderBy(desc(jsaTable.createdAt)),
      db.select().from(swmsTable).where(eq(swmsTable.userId, userId)).orderBy(desc(swmsTable.createdAt)),
    ]);

    // Collect all unique site IDs from both tables
    const siteIds = Array.from(new Set([
      ...jsas.map(j => j.siteId).filter((id): id is number => id !== null),
      ...swmsList.map(s => s.siteId).filter((id): id is number => id !== null),
    ]));

    const siteMap = new Map<number, string>();
    if (siteIds.length > 0) {
      const sites = await db.select({ id: sitesTable.id, name: sitesTable.name })
        .from(sitesTable)
        .where(and(eq(sitesTable.userId, userId), inArray(sitesTable.id, siteIds)));
      for (const site of sites) siteMap.set(site.id, site.name);
    }

    const header = ["Type", "#", "Name", "Site", "Created", "Status", "Locked", "Lock Date", "Snapshot PDF"].join(",");

    const jsaRows = jsas.map(j => [
      "JSA",
      esc(j.id),
      esc(j.jobName),
      esc(j.siteId ? (siteMap.get(j.siteId) ?? `Site #${j.siteId}`) : ""),
      esc(formatDateTime(j.createdAt)),
      esc(j.status),
      j.lockedAt ? "Yes" : "No",
      esc(formatDate(j.lockedAt)),
      j.snapshotPdfKey ? "Yes" : "No",
    ].join(","));

    const swmsRows = swmsList.map(s => [
      "SWMS",
      esc(s.id),
      esc(s.activityName),
      esc(s.siteId ? (siteMap.get(s.siteId) ?? `Site #${s.siteId}`) : ""),
      esc(formatDateTime(s.createdAt)),
      esc(s.status),
      s.lockedAt ? "Yes" : "No",
      esc(formatDate(s.lockedAt)),
      s.snapshotPdfKey ? "Yes" : "No",
    ].join(","));

    const csv = [header, ...jsaRows, ...swmsRows].join("\n");
    const today = formatDate(new Date());

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="formate-documents-${today}.csv"`);
    res.end(csv);
  } catch (err) {
    req.log.error({ err }, "Failed to export documents CSV");
    res.status(500).json({ error: "Export failed" });
  }
});

// GET /api/export/audit-bundle.zip — locked+complete JSAs/SWMSs/SSSPs as ZIP
// with PDFs from object storage and a manifest.csv with content/PDF hashes.
router.get("/export/audit-bundle.zip", async (req: Request, res: Response) => {
  const userId = getUserId(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const { from, to, siteId } = req.query;
  const fromDate = from && String(from).length >= 10 ? new Date(String(from)) : null;
  const toDate = to && String(to).length >= 10 ? new Date(String(to)) : null;
  const siteIdNum = siteId ? Number(siteId) : null;

  try {
    const [jsas, swmsList, sssps] = await Promise.all([
      db.select().from(jsaTable).where(and(
        eq(jsaTable.userId, userId),
        isNotNull(jsaTable.lockedAt),
        eq(jsaTable.snapshotStatus, "complete"),
        ...(siteIdNum && !isNaN(siteIdNum) ? [eq(jsaTable.siteId, siteIdNum)] : []),
      )),
      db.select().from(swmsTable).where(and(
        eq(swmsTable.userId, userId),
        isNotNull(swmsTable.lockedAt),
        eq(swmsTable.snapshotStatus, "complete"),
        ...(siteIdNum && !isNaN(siteIdNum) ? [eq(swmsTable.siteId, siteIdNum)] : []),
      )),
      db.select().from(ssspsTable).where(and(
        eq(ssspsTable.userId, userId),
        isNotNull(ssspsTable.lockedAt),
        eq(ssspsTable.snapshotStatus, "complete"),
        ...(siteIdNum && !isNaN(siteIdNum) ? [eq(ssspsTable.siteId, siteIdNum)] : []),
      )),
    ]);

    const inRange = (d: Date | null | undefined): boolean => {
      if (!d) return false;
      if (fromDate && d < fromDate) return false;
      if (toDate && d > toDate) return false;
      return true;
    };
    const hasRange = !!(fromDate || toDate);
    const filteredJsas = hasRange ? jsas.filter(j => inRange(j.lockedAt)) : jsas;
    const filteredSwms = hasRange ? swmsList.filter(s => inRange(s.lockedAt)) : swmsList;
    const filteredSssps = hasRange ? sssps.filter(s => inRange(s.lockedAt)) : sssps;

    const [jsaHashes, swmsHashes, ssspHashes] = await Promise.all([
      fetchAuditHashes("jsa", filteredJsas.map(j => j.id)),
      fetchAuditHashes("swms", filteredSwms.map(s => s.id)),
      fetchAuditHashes("sssp", filteredSssps.map(s => s.id)),
    ]);

    const allSiteIds = Array.from(new Set([
      ...filteredJsas.map(j => j.siteId).filter((id): id is number => id !== null),
      ...filteredSwms.map(s => s.siteId).filter((id): id is number => id !== null),
      ...filteredSssps.map(s => s.siteId).filter((id): id is number => id !== null),
    ]));
    const siteMap = new Map<number, string>();
    if (allSiteIds.length > 0) {
      const sites = await db.select({ id: sitesTable.id, name: sitesTable.name })
        .from(sitesTable)
        .where(and(eq(sitesTable.userId, userId), inArray(sitesTable.id, allSiteIds)));
      for (const site of sites) siteMap.set(site.id, site.name);
    }

    type BundleDoc = { type: string; id: number; name: string; siteId: number | null; lockedAt: Date | null; lockedBy?: string | null; snapshotPdfKey?: string | null };
    const allDocs: BundleDoc[] = [
      ...filteredJsas.map(j => ({ type: "jsa", id: j.id, name: j.jobName ?? `jsa-${j.id}`, siteId: j.siteId, lockedAt: j.lockedAt, lockedBy: j.lockedBy, snapshotPdfKey: j.snapshotPdfKey })),
      ...filteredSwms.map(s => ({ type: "swms", id: s.id, name: s.activityName ?? `swms-${s.id}`, siteId: s.siteId, lockedAt: s.lockedAt, lockedBy: s.lockedBy, snapshotPdfKey: s.snapshotPdfKey })),
      ...filteredSssps.map(s => ({ type: "sssp", id: s.id, name: s.projectName ?? `sssp-${s.id}`, siteId: s.siteId, lockedAt: s.lockedAt, lockedBy: s.lockedBy, snapshotPdfKey: s.snapshotPdfKey })),
    ];
    const hashMap = (doc: BundleDoc) => {
      if (doc.type === "jsa") return jsaHashes.get(doc.id);
      if (doc.type === "swms") return swmsHashes.get(doc.id);
      return ssspHashes.get(doc.id);
    };

    const csvHeader = ["Type","#","Name","Site","Locked At","Locked By","Content Hash","PDF Hash","File in ZIP"].join(",");
    const csvRows = allDocs.map(doc => {
      const h = hashMap(doc);
      const file = doc.snapshotPdfKey ? `pdfs/${doc.type}-${doc.id}-locked.pdf` : "";
      return [
        esc(doc.type), esc(String(doc.id)), esc(doc.name),
        esc(doc.siteId ? (siteMap.get(doc.siteId) ?? `Site #${doc.siteId}`) : ""),
        esc(doc.lockedAt ? doc.lockedAt.toISOString() : ""),
        esc(doc.lockedBy ?? ""),
        esc(h?.contentHash ?? ""),
        esc(h?.pdfHash ?? ""),
        esc(file),
      ].join(",");
    });
    const csvContent = [csvHeader, ...csvRows].join("\n");

    const today = formatDate(new Date());
    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", `attachment; filename="formate-audit-bundle-${today}.zip"`);

    const arc = new ZipArchive({ zlib: { level: 6 } });
    arc.pipe(res);
    arc.on("error", (err: Error) => {
      req.log.error({ err }, "Archiver error during audit bundle");
    });

    arc.append(Buffer.from(csvContent, "utf8"), { name: "manifest.csv" });

    for (const doc of allDocs) {
      if (!doc.snapshotPdfKey) continue;
      const { bucketName, objectName } = parseStoragePath(doc.snapshotPdfKey);
      const file = storageClient.bucket(bucketName).file(objectName);
      const [exists] = await file.exists();
      if (!exists) continue;
      arc.append(file.createReadStream(), { name: `pdfs/${doc.type}-${doc.id}-locked.pdf` });
    }

    await arc.finalize();
  } catch (err) {
    req.log.error({ err }, "Failed to generate audit bundle");
    if (!res.headersSent) res.status(500).json({ error: "Export failed" });
  }
});

export default router;
