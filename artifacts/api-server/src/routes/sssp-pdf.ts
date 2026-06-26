/**
 * SSSP PDF routes:
 *   POST /:id/pdf           — generate a fresh (unlocked) PDF on demand
 *   GET  /:id/snapshot      — serve the locked snapshot PDF from object storage
 *   POST /:id/snapshot/retry — re-kick snapshot for locked+failed SSSPs
 *
 * Also exports generateAndStoreSsspSnapshot for use by the lock route and the
 * public sign endpoint (freeze-on-sign).
 */

import { execSync } from "node:child_process";
import { Router, type Request, type Response } from "express";
import puppeteer from "puppeteer";
import { Storage } from "@google-cloud/storage";
import { eq, and } from "drizzle-orm";
import { db, ssspsTable } from "@workspace/db";
import { sha256Hex, recordSnapshotEvent } from "../lib/audit";

function resolveChromiumPath(): string {
  if (process.env.CHROMIUM_EXECUTABLE_PATH) {
    return process.env.CHROMIUM_EXECUTABLE_PATH;
  }
  try {
    return execSync("which chromium", { encoding: "utf8" }).trim();
  } catch {
    return "";
  }
}

const CHROMIUM_PATH = resolveChromiumPath();

/**
 * In development, Puppeteer reaches the frontend via the shared local proxy at
 * localhost:80. In production that proxy is absent; instead we navigate to the
 * public domain so the deployed frontend is reachable and TLS is valid.
 */
function getPrintBaseUrl(): string {
  const first = process.env.REPLIT_DOMAINS?.split(",")[0]?.trim();
  return first ? `https://${first}` : "http://localhost:80";
}

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

async function generatePdfBuffer(printUrl: string, cookieStr: string): Promise<Buffer> {
  const cookieDomain = (() => { try { return new URL(printUrl).hostname; } catch { return "localhost"; } })();
  const parsedCookies = cookieStr
    .split(";")
    .map((pair) => {
      const eqIdx = pair.indexOf("=");
      if (eqIdx === -1) return null;
      return { name: pair.slice(0, eqIdx).trim(), value: pair.slice(eqIdx + 1).trim(), domain: cookieDomain, path: "/" };
    })
    .filter((c): c is { name: string; value: string; domain: string; path: string } => c !== null && c.name.length > 0);

  const browser = await puppeteer.launch({
    headless: true,
    ...(CHROMIUM_PATH ? { executablePath: CHROMIUM_PATH } : {}),
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", "--disable-gpu"],
  });
  try {
    const page = await browser.newPage();
    await page.evaluateOnNewDocument(() => {
      (globalThis as unknown as { print: () => void }).print = () => {};
    });
    await page.setViewport({ width: 794, height: 1123 });
    if (parsedCookies.length > 0) {
      await page.setCookie(...parsedCookies);
    }
    await page.goto(printUrl, { waitUntil: "networkidle0", timeout: 30_000 });
    await new Promise<void>((r) => setTimeout(r, 600));
    const pdfUint8 = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "12mm", bottom: "12mm", left: "12mm", right: "12mm" },
    });
    return Buffer.from(pdfUint8);
  } finally {
    await browser.close().catch(() => {});
  }
}

async function uploadPdfSnapshot(id: number, pdfBuffer: Buffer): Promise<string> {
  const privateDir = process.env.PRIVATE_OBJECT_DIR ?? "";
  if (!privateDir) throw new Error("PRIVATE_OBJECT_DIR not set");
  const base = privateDir.endsWith("/") ? privateDir.slice(0, -1) : privateDir;
  const fullPath = `${base}/snapshots/sssp/${id}.pdf`;
  const { bucketName, objectName } = parseStoragePath(fullPath);
  const file = storageClient.bucket(bucketName).file(objectName);
  await file.save(pdfBuffer, { contentType: "application/pdf", resumable: false });
  return `/${bucketName}/${objectName}`;
}

type PinoLog = { error: (obj: object, msg: string) => void };

/**
 * Generate and store a locked SSSP snapshot PDF. Exported for use by:
 *  - POST /sssps/:id/lock (manual lock by owner — has session cookie)
 *  - public sign freeze-on-sign (no owner cookie — uses shareToken → public view)
 *
 * Snapshot is written to object storage and snapshotStatus is updated.
 * An audit 'snapshot' row (with PDF hash) is inserted on success.
 * On failure, snapshotStatus is set to 'failed' so the UI can offer a retry.
 */
export async function generateAndStoreSsspSnapshot(
  id: number,
  opts: { cookieStr?: string; shareToken?: string },
  log: PinoLog,
): Promise<void> {
  try {
    const base = getPrintBaseUrl();
    let printUrl: string;
    let cookieStr: string;
    if (opts.shareToken) {
      // Public view — no auth cookie needed; shareToken is the capability.
      printUrl = `${base}/sssp/${encodeURIComponent(opts.shareToken)}`;
      cookieStr = "";
    } else {
      // Auth-protected print page — forward the owner session cookie.
      printUrl = `${base}/sssps/print/${encodeURIComponent(String(id))}`;
      cookieStr = opts.cookieStr ?? "";
    }
    const pdfBuffer = await generatePdfBuffer(printUrl, cookieStr);
    const snapshotPdfKey = await uploadPdfSnapshot(id, pdfBuffer);
    const pdfHash = sha256Hex(pdfBuffer);
    const [row] = await db.update(ssspsTable)
      .set({ snapshotPdfKey, snapshotStatus: "complete" })
      .where(eq(ssspsTable.id, id))
      .returning({ siteId: ssspsTable.siteId, userId: ssspsTable.userId });
    await recordSnapshotEvent({
      documentType: "sssp",
      documentId: id,
      actorId: row?.userId ?? null,
      siteId: row?.siteId ?? null,
      pdfHash,
    });
  } catch (err) {
    log.error({ err }, "SSSP PDF snapshot generation failed");
    await db.update(ssspsTable).set({ snapshotStatus: "failed" }).where(eq(ssspsTable.id, id)).catch(() => {});
  }
}

function getUserId(req: Request): string {
  return (req as Request & { userId?: string }).userId ?? "";
}

const router = Router();

// POST /:id/pdf — generate a fresh (unlocked) PDF on demand
router.post("/:id/pdf", async (req: Request, res: Response) => {
  const userId = getUserId(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }
  const { id } = req.params;
  const printUrl = `${getPrintBaseUrl()}/sssps/print/${encodeURIComponent(String(id))}`;
  const cookieStr = req.headers.cookie ?? "";
  try {
    const pdfBuffer = await generatePdfBuffer(printUrl, cookieStr);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="sssp-${id}.pdf"`);
    res.setHeader("Content-Length", String(pdfBuffer.length));
    res.end(pdfBuffer);
  } catch (err) {
    req.log.error({ err }, "SSSP PDF generation failed");
    if (!res.headersSent) res.status(500).json({ error: "PDF generation failed" });
  }
});

// GET /:id/snapshot — serve the locked snapshot PDF from object storage
router.get("/:id/snapshot", async (req: Request, res: Response) => {
  const userId = getUserId(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  try {
    const [sssp] = await db
      .select({ snapshotPdfKey: ssspsTable.snapshotPdfKey, userId: ssspsTable.userId })
      .from(ssspsTable)
      .where(and(eq(ssspsTable.id, id), eq(ssspsTable.userId, userId)));
    if (!sssp) { res.status(404).json({ error: "Not found" }); return; }
    if (!sssp.snapshotPdfKey) { res.status(404).json({ error: "No snapshot available yet" }); return; }
    const { bucketName, objectName } = parseStoragePath(sssp.snapshotPdfKey);
    const file = storageClient.bucket(bucketName).file(objectName);
    const [exists] = await file.exists();
    if (!exists) { res.status(404).json({ error: "Snapshot file not found" }); return; }
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="sssp-${id}-locked.pdf"`);
    file.createReadStream().pipe(res);
  } catch (err) {
    req.log.error({ err }, "Failed to serve SSSP snapshot");
    if (!res.headersSent) res.status(500).json({ error: "Internal server error" });
  }
});

// POST /:id/snapshot/retry — re-kick snapshot generation for locked+failed SSSPs
router.post("/:id/snapshot/retry", async (req: Request, res: Response) => {
  const userId = getUserId(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  try {
    const [sssp] = await db
      .select({ lockedAt: ssspsTable.lockedAt, snapshotStatus: ssspsTable.snapshotStatus, data: ssspsTable.data })
      .from(ssspsTable)
      .where(and(eq(ssspsTable.id, id), eq(ssspsTable.userId, userId)));
    if (!sssp) { res.status(404).json({ error: "Not found" }); return; }
    if (!sssp.lockedAt) { res.status(409).json({ error: "Document is not locked" }); return; }
    if (sssp.snapshotStatus !== "failed") { res.status(409).json({ error: "Snapshot is not in failed state" }); return; }
    await db.update(ssspsTable).set({ snapshotStatus: "pending" }).where(eq(ssspsTable.id, id));
    const d = (sssp.data ?? {}) as Record<string, unknown>;
    const shareToken = typeof d.shareToken === "string" && d.shareToken.length >= 16 ? d.shareToken : undefined;
    const cookieStr = req.headers.cookie ?? "";
    void generateAndStoreSsspSnapshot(id, { cookieStr, shareToken }, req.log);
    res.json({ ok: true, status: "pending" });
  } catch (err) {
    req.log.error({ err }, "Failed to retry SSSP snapshot");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
