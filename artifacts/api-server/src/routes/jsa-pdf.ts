import { execSync } from "node:child_process";
import { Router, type Request, type Response } from "express";
import puppeteer from "puppeteer";
import { Storage } from "@google-cloud/storage";
import { eq, and, isNotNull } from "drizzle-orm";
import { db, jsaTable } from "@workspace/db";
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
 *
 * REPLIT_DOMAINS is a comma-separated list of domains assigned to this
 * deployment (e.g. "my-app.replit.app,my-custom.domain"). We use the first one.
 * The dev fallback stays localhost:80.
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
  // Derive cookie domain from the URL so cookies are valid whether Puppeteer
  // navigates to localhost (dev) or the public domain (production).
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
    if (parsedCookies.length > 0) await page.setCookie(...parsedCookies);
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

async function uploadPdfSnapshot(docType: string, id: number, pdfBuffer: Buffer): Promise<string> {
  const privateDir = process.env.PRIVATE_OBJECT_DIR ?? "";
  if (!privateDir) throw new Error("PRIVATE_OBJECT_DIR not set");
  const base = privateDir.endsWith("/") ? privateDir.slice(0, -1) : privateDir;
  const fullPath = `${base}/snapshots/${docType}/${id}.pdf`;
  const { bucketName, objectName } = parseStoragePath(fullPath);
  const file = storageClient.bucket(bucketName).file(objectName);
  await file.save(pdfBuffer, { contentType: "application/pdf", resumable: false });
  return `/${bucketName}/${objectName}`;
}

export async function generateAndStoreJsaSnapshot(id: number, cookieStr: string, log: { error: (obj: object, msg: string) => void }): Promise<void> {
  try {
    const printUrl = `${getPrintBaseUrl()}/jsa/${id}/print`;
    const pdfBuffer = await generatePdfBuffer(printUrl, cookieStr);
    const snapshotPdfKey = await uploadPdfSnapshot("jsa", id, pdfBuffer);
    const pdfHash = sha256Hex(pdfBuffer);
    const [row] = await db.update(jsaTable)
      .set({ snapshotPdfKey, snapshotStatus: "complete" })
      .where(eq(jsaTable.id, id))
      .returning({ siteId: jsaTable.siteId, userId: jsaTable.userId });
    // Append-only audit row binding the immutable PDF to its hash.
    await recordSnapshotEvent({ documentType: "jsa", documentId: id, actorId: row?.userId ?? null, siteId: row?.siteId ?? null, pdfHash });
  } catch (err) {
    log.error({ err }, "JSA PDF snapshot generation failed");
    // Flag the failure so the UI can offer a retry instead of silently serving
    // a stale or live-regenerated document that wouldn't match the audit hash.
    await db.update(jsaTable).set({ snapshotStatus: "failed" }).where(eq(jsaTable.id, id)).catch(() => {});
  }
}

function getUserId(req: Request): string {
  return (req as Request & { userId?: string }).userId ?? "";
}

const router = Router();

router.post("/:id/pdf", async (req: Request, res: Response) => {
  const userId = getUserId(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const { id } = req.params;
  const printUrl = `${getPrintBaseUrl()}/jsa/${encodeURIComponent(String(id))}/print`;
  const cookieStr = req.headers.cookie ?? "";

  try {
    const pdfBuffer = await generatePdfBuffer(printUrl, cookieStr);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="jsa-${id}.pdf"`);
    res.setHeader("Content-Length", String(pdfBuffer.length));
    res.end(pdfBuffer);
  } catch (err) {
    req.log.error({ err }, "JSA PDF generation failed");
    if (!res.headersSent) res.status(500).json({ error: "PDF generation failed" });
  }
});

router.get("/:id/snapshot", async (req: Request, res: Response) => {
  const userId = getUserId(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  try {
    const [jsa] = await db
      .select({ snapshotPdfKey: jsaTable.snapshotPdfKey, userId: jsaTable.userId })
      .from(jsaTable)
      .where(and(eq(jsaTable.id, id), eq(jsaTable.userId, userId)));

    if (!jsa) { res.status(404).json({ error: "Not found" }); return; }
    if (!jsa.snapshotPdfKey) { res.status(404).json({ error: "No snapshot available yet" }); return; }

    const { bucketName, objectName } = parseStoragePath(jsa.snapshotPdfKey);
    const file = storageClient.bucket(bucketName).file(objectName);
    const [exists] = await file.exists();
    if (!exists) { res.status(404).json({ error: "Snapshot file not found" }); return; }

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="jsa-${id}-locked.pdf"`);
    file.createReadStream().pipe(res);
  } catch (err) {
    req.log.error({ err }, "JSA snapshot serve failed");
    if (!res.headersSent) res.status(500).json({ error: "Failed to retrieve snapshot" });
  }
});

// POST /:id/snapshot/retry — re-attempt a failed snapshot for a locked JSA.
// Only valid on a locked document whose snapshot previously failed; never
// regenerates a complete snapshot (that would break the audit hash binding).
router.post("/:id/snapshot/retry", async (req: Request, res: Response) => {
  const userId = getUserId(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  try {
    // Atomic claim: flip failed -> pending only for a locked, owned doc.
    const claimed = await db.update(jsaTable)
      .set({ snapshotStatus: "pending" })
      .where(and(
        eq(jsaTable.id, id),
        eq(jsaTable.userId, userId),
        isNotNull(jsaTable.lockedAt),
        eq(jsaTable.snapshotStatus, "failed"),
      ))
      .returning({ id: jsaTable.id });
    if (claimed.length === 0) {
      res.status(409).json({ error: "Retry not available", message: "Snapshot retry is only available for a locked document with a failed snapshot." });
      return;
    }
    res.json({ status: "pending" });
    const cookieStr = req.headers.cookie ?? "";
    const log = req.log;
    setImmediate(() => { generateAndStoreJsaSnapshot(id, cookieStr, log).catch(() => {}); });
  } catch (err) {
    req.log.error({ err }, "JSA snapshot retry failed");
    if (!res.headersSent) res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
