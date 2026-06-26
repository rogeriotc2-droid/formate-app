import { Router, type Request } from "express";
import { eq, desc, and, isNull } from "drizzle-orm";
import { randomBytes } from "node:crypto";
import { db, ssspsTable, companiesTable, pcbuPortalsTable } from "@workspace/db";
import { getTradeTemplate } from "../lib/trade-templates";
import { getTradeTemplate as getJhaTemplate } from "../lib/jha-templates";
import { computeContentHash, recordLockEvent } from "../lib/audit";
import { generateAndStoreSsspSnapshot } from "./sssp-pdf";

/** Get the authenticated tradie's userId (requireAuth middleware sets it). */
function getUserId(req: Request): string {
  return (req as Request & { userId?: string }).userId ?? "";
}
import { z } from "zod";
import { sendEmail } from "../lib/email";

function esc(s: string | null | undefined): string {
  if (!s) return "";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const router = Router();

// SSSP `data` is a free-form JSONB blob. Frontend TypeScript (SsspData in
// pages/sssps/detail.tsx) is the source of truth for its shape; the server
// stores whatever it's given so we don't strip fields the editor relies on
// (pcbu1, pcbu2, taskSteps, substances, etc.).
const ssspDataSchema = z.record(z.unknown());

// Per-job fields that should NOT carry forward as sticky defaults — these
// describe THIS specific job and must be filled fresh every time.
// Field names match the SsspData shape in safeiq/src/pages/sssps/detail.tsx.
const PER_JOB_FIELDS = new Set([
  "siteAddress",
  "pcbu1",
  // Declaration & signatures — must always be signed fresh for this specific job.
  "pcbu1SignedBy",
  "pcbu1SignedDate",
  "pcbu2SignedBy",
  "pcbu2SignedDate",
  "pcbu2SignatureImage",
  // Server-managed, per-document capability tokens & sign metadata. These MUST
  // NOT carry forward into a new SSSP — copying them means two SSSPs share the
  // same token, and the public lookups (`data->>'pcbu1SignToken' = token` /
  // `shareToken`) use LIMIT 1, so a link could resolve to the wrong document or
  // appear "no longer valid". Each SSSP must mint its own tokens on demand.
  "pcbu1SignToken",
  "pcbu1SignSentAt",
  "pcbu1SignSentTo",
  "pcbu1SignatureImage",
  "pcbu1SignedAt",
  "shareToken",
  // Site photos belong to ONE specific job — copying yesterday's hazard photos
  // into today's new SSSP confuses the tradie and ends up in customer-facing
  // PDFs/emails. Always start a fresh SSSP with zero photos.
  "photos",
  // Server-set markers, not real user data
  "_template",
  "_starterTemplate",
]);

/**
 * Sticky-merge: build the `data` blob for a NEW sssp by taking the user's last
 * SSSP as a base and overlaying whatever the client submitted on top. Anything
 * the tradie filled last time carries forward; anything they explicitly send
 * in this request wins. Per-job fields (siteAddress, PCBU 1, signatures) are
 * NOT carried forward — they're job-specific by definition.
 */
function buildStickyData(
  lastData: Record<string, unknown> | null | undefined,
  submitted: Record<string, unknown> | null | undefined,
): Record<string, unknown> {
  const base = (lastData ?? {}) as Record<string, unknown>;
  const sub = (submitted ?? {}) as Record<string, unknown>;

  // Start from last SSSP, minus per-job fields
  const merged: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(base)) {
    if (!PER_JOB_FIELDS.has(k)) merged[k] = v;
  }
  // Overlay submitted values — submitted always wins
  for (const [k, v] of Object.entries(sub)) {
    if (k === "_template") continue; // marker, not real data
    merged[k] = v;
  }
  // Deep-merge pcbu2 (your company info) so partial submissions don't wipe sticky fields
  const basePcbu2 = (base.pcbu2 ?? {}) as Record<string, unknown>;
  const subPcbu2 = (sub.pcbu2 ?? {}) as Record<string, unknown>;
  if (Object.keys(basePcbu2).length || Object.keys(subPcbu2).length) {
    merged.pcbu2 = { ...basePcbu2, ...subPcbu2 };
  }
  return merged;
}

const createSsspSchema = z.object({
  projectName: z.string().min(1),
  siteId: z.number().optional().nullable(),
  status: z.enum(["draft", "active", "archived"]).optional(),
  data: ssspDataSchema.optional(),
});

const updateSsspSchema = z.object({
  projectName: z.string().min(1).optional(),
  siteId: z.number().optional().nullable(),
  status: z.enum(["draft", "active", "archived"]).optional(),
  data: ssspDataSchema.optional(),
});

router.get("/", async (req, res) => {
  try {
    const userId = getUserId(req);
    // Scoped to the authenticated tradie's own SSSPs.
    const sssps = await db
      .select()
      .from(ssspsTable)
      .where(eq(ssspsTable.userId, userId))
      .orderBy(desc(ssspsTable.updatedAt));
    res.json(sssps);
  } catch (err) {
    req.log.error({ err }, "Failed to list SSSPs");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/", async (req, res) => {
  const parsed = createSsspSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.issues });
    return;
  }
  try {
    const userId = getUserId(req);
    // Pull all recent SSSPs and prefer the most-recently-updated one that
    // actually has hazards filled in. This prevents an empty SSSP from
    // breaking the sticky chain when the user has content in an older plan.
    const recentSssps = await db
      .select({ data: ssspsTable.data })
      .from(ssspsTable)
      .where(eq(ssspsTable.userId, userId))
      .orderBy(desc(ssspsTable.updatedAt))
      .limit(20);

    const lastSsspWithContent = recentSssps.find(s => {
      const d = s.data as Record<string, unknown> | null | undefined;
      const hazards = d?.hazards;
      return Array.isArray(hazards) && hazards.length > 0;
    });

    // If the tradie has NO prior SSSP with content (i.e. this is their
    // first real SSSP), seed it with the starter template for their trade.
    // The banner on the SSSP detail page tells them to review and customise.
    let baseData: Record<string, unknown> | null | undefined =
      lastSsspWithContent?.data as Record<string, unknown> | null | undefined;
    let starterTemplateKey: string | null = null;

    if (!lastSsspWithContent) {
      const [company] = await db
        .select({ primaryTrade: companiesTable.primaryTrade, country: companiesTable.country })
        .from(companiesTable)
        .where(eq(companiesTable.userId, userId))
        .limit(1);
      const tradeKey = company?.primaryTrade?.trim() || "general";
      // US companies get the OSHA-aligned JHA starter (911, OSHA, Poison
      // Control); everyone else gets the NZ/AU template (111, WorkSafe).
      baseData = (company?.country === "US"
        ? getJhaTemplate(tradeKey)
        : getTradeTemplate(tradeKey)) as unknown as Record<string, unknown>;
      starterTemplateKey = tradeKey;
    }

    const mergedData = buildStickyData(
      baseData,
      parsed.data.data as Record<string, unknown> | null | undefined,
    );

    // Tag the SSSP so the frontend can show a "review this template" banner.
    if (starterTemplateKey) {
      mergedData._starterTemplate = starterTemplateKey;
    }

    const [sssp] = await db.insert(ssspsTable).values({
      userId,
      projectName: parsed.data.projectName,
      siteId: parsed.data.siteId ?? null,
      status: parsed.data.status ?? "draft",
      data: mergedData,
    }).returning();
    res.status(201).json(sssp);
  } catch (err) {
    req.log.error({ err }, "Failed to create SSSP");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  try {
    const userId = getUserId(req);
    const [sssp] = await db.select().from(ssspsTable)
      .where(and(eq(ssspsTable.id, id), eq(ssspsTable.userId, userId)));
    if (!sssp) { res.status(404).json({ error: "Not found" }); return; }
    res.json(sssp);
  } catch (err) {
    req.log.error({ err }, "Failed to get SSSP");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const parsed = updateSsspSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.issues });
    return;
  }
  try {
    const userId = getUserId(req);
    // Reject edits on locked documents.
    const [lockCheck] = await db
      .select({ lockedAt: ssspsTable.lockedAt })
      .from(ssspsTable)
      .where(and(eq(ssspsTable.id, id), eq(ssspsTable.userId, userId)));
    if (!lockCheck) { res.status(404).json({ error: "Not found" }); return; }
    if (lockCheck.lockedAt) { res.status(409).json({ error: "This SSSP is locked and cannot be edited." }); return; }
    const updates: Record<string, unknown> = {};
    if (parsed.data.projectName !== undefined) updates.projectName = parsed.data.projectName;
    if (parsed.data.siteId !== undefined) updates.siteId = parsed.data.siteId;
    if (parsed.data.status !== undefined) updates.status = parsed.data.status;
    if (parsed.data.data !== undefined) {
      // The client sends its own copy of the document, which does NOT include
      // server-managed sign fields (the sign-off token, and any signature the
      // client captured via the public /sign link). A blind overwrite here
      // wipes the token, which breaks the emailed sign link ("Link no longer
      // valid"). Preserve those server-only keys by merging them back on top.
      const [current] = await db
        .select({ data: ssspsTable.data })
        .from(ssspsTable)
        .where(and(eq(ssspsTable.id, id), eq(ssspsTable.userId, userId)));
      const existingData = (current?.data as Record<string, unknown>) ?? {};
      const incomingData = (parsed.data.data as Record<string, unknown>) ?? {};
      const PRESERVE_KEYS = [
        "pcbu1SignSentAt",
        "pcbu1SignSentTo",
        "pcbu1SignedBy",
        "pcbu1SignedDate",
        "pcbu1SignatureImage",
        "pcbu1SignedAt",
      ] as const;
      const preserved: Record<string, unknown> = {};
      for (const key of PRESERVE_KEYS) {
        const incomingVal = incomingData[key];
        // Treat "omitted", explicit null, AND empty string as "client isn't
        // managing this field". The owner's edit form binds these to inputs as
        // `value={data.pcbu1SignedBy ?? ""}`, so an owner who loaded the document
        // BEFORE PCBU 1 signed via the public /sign link will PATCH back empty
        // strings for these keys — which would silently wipe the signature the
        // recipient just captured. The recipient's externally-captured signature
        // must win over a stale empty owner snapshot. (Clearing a real signature
        // by hand is intentionally not supported here; re-sending for sign is the
        // path that resets it.)
        const clientUnset = incomingVal === undefined || incomingVal === null || incomingVal === "";
        const existingVal = existingData[key];
        if (existingVal !== undefined && existingVal !== "" && clientUnset) {
          preserved[key] = existingVal;
        }
      }
      const merged: Record<string, unknown> = { ...incomingData, ...preserved };
      // pcbu1SignToken is STRICTLY server-managed — minted only by
      // /send-for-sign and rotated only there. The client must never set or
      // change it via PATCH: not by omitting it, not by sending null, and not
      // by echoing back a stale snapshot it loaded earlier. The frontend save()
      // spreads its whole local data blob (including a possibly-stale token)
      // into every PATCH, so trusting the incoming value can silently overwrite
      // a newer server token and break the live emailed sign link. Always drop
      // the client's value and re-apply the server's current token (if any).
      delete merged.pcbu1SignToken;
      if (typeof existingData.pcbu1SignToken === "string") {
        merged.pcbu1SignToken = existingData.pcbu1SignToken;
      }
      // shareToken is likewise STRICTLY server-managed (minted by send-for-sign /
      // share) and backs the public full-document view link at /sssp/<token>.
      // The client's PATCH must never overwrite it with a stale echo, or the
      // signer's "view full plan" link silently breaks. Drop incoming, re-apply server's.
      delete merged.shareToken;
      if (typeof existingData.shareToken === "string") {
        merged.shareToken = existingData.shareToken;
      }
      updates.data = merged;
    }
    const [sssp] = await db.update(ssspsTable).set(updates)
      .where(and(eq(ssspsTable.id, id), eq(ssspsTable.userId, userId))).returning();
    if (!sssp) { res.status(404).json({ error: "Not found" }); return; }
    res.json(sssp);
  } catch (err) {
    req.log.error({ err }, "Failed to update SSSP");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/:id/lock", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const userId = getUserId(req);
  try {
    // Read current content first — needed for the content hash.
    const [current] = await db.select().from(ssspsTable)
      .where(and(eq(ssspsTable.id, id), eq(ssspsTable.userId, userId)));
    if (!current) { res.status(404).json({ error: "Not found" }); return; }
    if (current.lockedAt) { res.status(409).json({ error: "Already locked" }); return; }
    // Atomic lock: WHERE lockedAt IS NULL prevents double-lock under concurrency.
    const [locked] = await db.update(ssspsTable)
      .set({ lockedAt: new Date(), lockedBy: userId, snapshotStatus: "pending" })
      .where(and(eq(ssspsTable.id, id), eq(ssspsTable.userId, userId), isNull(ssspsTable.lockedAt)))
      .returning();
    if (!locked) { res.status(409).json({ error: "Already locked" }); return; }
    // Append-only audit row: content hash of the document at lock time.
    const contentHash = computeContentHash(current.data);
    await recordLockEvent({ documentType: "sssp", documentId: id, actorId: userId, siteId: current.siteId, contentHash });
    // Fire-and-forget snapshot: use shareToken for public-view navigation if
    // available (works without owner session); fall back to owner cookie + print page.
    const d = (current.data ?? {}) as Record<string, unknown>;
    const shareToken = typeof d.shareToken === "string" && d.shareToken.length >= 16 ? d.shareToken : undefined;
    const cookieStr = req.headers.cookie ?? "";
    void generateAndStoreSsspSnapshot(id, { cookieStr, shareToken }, req.log);
    res.json(locked);
  } catch (err) {
    req.log.error({ err }, "Failed to lock SSSP");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  try {
    const userId = getUserId(req);
    const [sssp] = await db.delete(ssspsTable)
      .where(and(eq(ssspsTable.id, id), eq(ssspsTable.userId, userId))).returning();
    if (!sssp) { res.status(404).json({ error: "Not found" }); return; }
    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Failed to delete SSSP");
    res.status(500).json({ error: "Internal server error" });
  }
});

const sendEmailSchema = z.object({
  recipientEmail: z.string().email(),
  recipientName: z.string().optional(),
});

/** Pick the best public domain to put in user-facing links (prefer custom domain). */
function publicDomain(): string {
  const all = process.env.REPLIT_DOMAINS?.split(",").map(s => s.trim()).filter(Boolean) ?? [];
  return all.find(d => !d.endsWith(".replit.app") && !d.endsWith(".replit.dev"))
    ?? all.find(d => d.endsWith(".replit.app"))
    ?? all[0]
    ?? "localhost";
}

/**
 * POST /:id/send-for-sign — Generates a one-time sign token for PCBU 1, stores
 * it in data.pcbu1SignToken, emails them a link to /sign/<token> where they
 * can review the plan and sign without an account.
 */
router.post("/:id/send-for-sign", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const parsed = sendEmailSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input", details: parsed.error.issues }); return; }
  try {
    const userId = getUserId(req);
    const [sssp] = await db.select().from(ssspsTable)
      .where(and(eq(ssspsTable.id, id), eq(ssspsTable.userId, userId)));
    if (!sssp) { res.status(404).json({ error: "Not found" }); return; }

    const data = { ...(sssp.data as Record<string, unknown> ?? {}) };
    const pcbu1 = (data.pcbu1 ?? {}) as Record<string, string>;
    const pcbu2 = (data.pcbu2 ?? {}) as Record<string, string>;

    // Guard: PCBU 2 must sign before sending to client.
    if (!data.pcbu2SignatureImage || !data.pcbu2SignedBy) {
      res.status(400).json({ error: "Sign the SSSP yourself before sending it to your client — your signature is required first." });
      return;
    }

    // Country for emergency number localisation
    const [emCompany] = await db
      .select({ country: companiesTable.country })
      .from(companiesTable)
      .where(eq(companiesTable.userId, userId))
      .limit(1);
    const isUS = emCompany?.country === "US";

    // Keep existing sign token so any previously-sent link stays valid.
    // Only generate a new one if this SSSP has never been sent before.
    const token = (typeof data.pcbu1SignToken === "string" && data.pcbu1SignToken.length >= 16)
      ? data.pcbu1SignToken as string
      : randomBytes(24).toString("hex");
    data.pcbu1SignToken = token;
    data.pcbu1SignSentAt = new Date().toISOString();
    data.pcbu1SignSentTo = parsed.data.recipientEmail;
    // Clear any prior PCBU1 signature so a fresh sign-back is needed when resending.
    delete (data as Record<string, unknown>).pcbu1SignedBy;
    delete (data as Record<string, unknown>).pcbu1SignedDate;
    delete (data as Record<string, unknown>).pcbu1SignatureImage;

    // Ensure a stable, unguessable shareToken so the signer can open and print
    // the FULL safety plan (the public view page). Generate once and keep stable.
    if (typeof data.shareToken !== "string" || data.shareToken.length < 16) {
      data.shareToken = randomBytes(24).toString("hex");
    }
    const shareToken = data.shareToken as string;

    // Look up or create the PCBU portal — one permanent URL per email address.
    const recipientEmailNorm = parsed.data.recipientEmail.toLowerCase().trim();
    const [existingPortal] = await db.select().from(pcbuPortalsTable)
      .where(eq(pcbuPortalsTable.email, recipientEmailNorm)).limit(1);
    const portalToken = existingPortal?.token ?? (await db.insert(pcbuPortalsTable)
      .values({ email: recipientEmailNorm, token: randomBytes(24).toString("hex") })
      .returning())[0].token;
    const portalUrl = `https://${publicDomain()}/pcbu/${portalToken}`;

    await db.update(ssspsTable).set({ data }).where(eq(ssspsTable.id, id));

    const signUrl = `https://${publicDomain()}/sign/${token}`;
    const viewUrl = `https://${publicDomain()}/sssp/${shareToken}`;
    const recipientName = parsed.data.recipientName ?? pcbu1.contact ?? "there";
    const pcbu2Company = pcbu2.company ?? "your contractor";
    const pcbu2Contact = pcbu2.contact ?? "";
    const pcbu2Phone = pcbu2.phone ?? "";
    const pcbu2Email = pcbu2.email ?? "";
    const projectName = sssp.projectName;
    const siteAddress = (data.siteAddress as string) ?? "Not specified";
    const activities = (data.activities as string) ?? "";
    const pcbu2SignedBy = (data.pcbu2SignedBy as string) ?? "";
    const pcbu2SignedDate = (data.pcbu2SignedDate as string) ?? "";
    const pcbu2SignatureImage = (data.pcbu2SignatureImage as string) ?? "";

    // Full data sections
    const hazards = (data.hazards as Array<Record<string,string>> | undefined) ?? [];
    const ppeRequired = (data.ppeRequired as string[] | undefined) ?? [];
    const taskSteps = (data.taskSteps as Array<Record<string,string>> | undefined) ?? [];
    const emergencyContacts = (data.emergencyContacts as Array<Record<string,string>> | undefined) ?? [];
    const substances = (data.substances as Array<Record<string,string>> | undefined) ?? [];
    const trainingItems = (data.trainingItems as string[] | undefined) ?? [];
    const photos = (data.photos as Array<{ id: string; objectPath: string; caption?: string }> | undefined) ?? [];
    const highRiskHazards = hazards.filter(h => h.initialRisk === "High" || h.initialRisk === "Critical");

    // Email HTML helpers
    const riskStyle = (r: string) => {
      if (r === "Critical" || r === "High") return "background:#fef2f2;color:#991b1b;";
      if (r === "Moderate") return "background:#fefce8;color:#92400e;";
      if (r === "Low") return "background:#f0fdf4;color:#166534;";
      return "background:#eff6ff;color:#1d4ed8;";
    };
    const badge = (r: string) => r ? `<span style="display:inline-block;padding:1px 8px;border-radius:99px;font-size:11px;font-weight:700;${riskStyle(r)}">${esc(r)}</span>` : "";
    const sectionHdr = (title: string) =>
      `<div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:#64748b;padding:10px 16px;background:#f1f5f9;border-bottom:1px solid #e2e8f0;">${title}</div>`;
    const kvRow = (label: string, value: string) => value ? `
      <tr>
        <td style="padding:7px 16px;color:#64748b;font-size:13px;width:170px;border-bottom:1px solid #f1f5f9;white-space:nowrap;">${label}</td>
        <td style="padding:7px 16px;color:#1e293b;font-size:13px;border-bottom:1px solid #f1f5f9;">${value}</td>
      </tr>` : "";

    const hazardTable = hazards.length > 0 ? `
      <div style="margin-bottom:24px;border:1px solid #e2e8f0;border-radius:6px;overflow:hidden;">
        ${sectionHdr(`Hazard &amp; Risk Register — ${hazards.length} hazard${hazards.length !== 1 ? "s" : ""} identified`)}
        ${highRiskHazards.length > 0 ? `<div style="background:#fef2f2;border-bottom:1px solid #fecaca;padding:8px 16px;font-size:12px;font-weight:700;color:#dc2626;">⚠ ${highRiskHazards.length} HIGH / CRITICAL HAZARD${highRiskHazards.length !== 1 ? "S" : ""} — REVIEW BEFORE WORK STARTS</div>` : ""}
        <table style="width:100%;border-collapse:collapse;font-size:12px;">
          <thead><tr style="background:#f8fafc;">
            <th style="padding:8px 12px;text-align:left;font-size:11px;font-weight:700;color:#64748b;border-bottom:1px solid #e2e8f0;width:25%;">Hazard</th>
            <th style="padding:8px 12px;text-align:left;font-size:11px;font-weight:700;color:#64748b;border-bottom:1px solid #e2e8f0;width:9%;">Initial</th>
            <th style="padding:8px 12px;text-align:left;font-size:11px;font-weight:700;color:#64748b;border-bottom:1px solid #e2e8f0;">Controls</th>
            <th style="padding:8px 12px;text-align:left;font-size:11px;font-weight:700;color:#64748b;border-bottom:1px solid #e2e8f0;width:9%;">Residual</th>
          </tr></thead>
          <tbody>${hazards.map((h, i) => `
            <tr style="background:${i % 2 === 0 ? "#fff" : "#f8fafc"};">
              <td style="padding:8px 12px;color:#1e293b;font-weight:600;border-bottom:1px solid #f1f5f9;vertical-align:top;">${esc(h.hazard ?? "")}</td>
              <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;vertical-align:top;">${badge(h.initialRisk)}</td>
              <td style="padding:8px 12px;color:#374151;border-bottom:1px solid #f1f5f9;vertical-align:top;font-size:12px;line-height:1.5;">${esc(h.controls ?? "—")}</td>
              <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;vertical-align:top;">${badge(h.residualRisk)}</td>
            </tr>`).join("")}</tbody>
        </table>
      </div>` : "";

    const taskTable = taskSteps.length > 0 ? `
      <div style="margin-bottom:24px;border:1px solid #e2e8f0;border-radius:6px;overflow:hidden;">
        ${sectionHdr(`Task Analysis — ${taskSteps.length} step${taskSteps.length !== 1 ? "s" : ""}`)}
        <table style="width:100%;border-collapse:collapse;font-size:12px;">
          <thead><tr style="background:#f8fafc;">
            <th style="padding:8px 12px;text-align:left;font-size:11px;font-weight:700;color:#64748b;border-bottom:1px solid #e2e8f0;width:22%;">Step</th>
            <th style="padding:8px 12px;text-align:left;font-size:11px;font-weight:700;color:#64748b;border-bottom:1px solid #e2e8f0;width:20%;">Hazards</th>
            <th style="padding:8px 12px;text-align:left;font-size:11px;font-weight:700;color:#64748b;border-bottom:1px solid #e2e8f0;">Controls</th>
            <th style="padding:8px 12px;text-align:left;font-size:11px;font-weight:700;color:#64748b;border-bottom:1px solid #e2e8f0;width:9%;">Residual</th>
          </tr></thead>
          <tbody>${taskSteps.map((s, i) => `
            <tr style="background:${i % 2 === 0 ? "#fff" : "#f8fafc"};">
              <td style="padding:8px 12px;color:#1e293b;font-weight:600;border-bottom:1px solid #f1f5f9;vertical-align:top;">${esc(s.step ?? "")}</td>
              <td style="padding:8px 12px;color:#374151;border-bottom:1px solid #f1f5f9;vertical-align:top;">${esc(s.hazards ?? "—")}</td>
              <td style="padding:8px 12px;color:#374151;border-bottom:1px solid #f1f5f9;vertical-align:top;font-size:12px;line-height:1.5;">${esc(s.controls ?? "—")}</td>
              <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;vertical-align:top;">${badge(s.residualRisk)}</td>
            </tr>`).join("")}</tbody>
        </table>
      </div>` : "";

    const substanceTable = substances.length > 0 ? `
      <div style="margin-bottom:24px;border:1px solid #e2e8f0;border-radius:6px;overflow:hidden;">
        ${sectionHdr(`Dangerous Goods &amp; Hazardous Substances — ${substances.length} product${substances.length !== 1 ? "s" : ""}`)}
        ${substances.map((s, i) => `
        <div style="background:${i % 2 === 0 ? "#fff" : "#f8fafc"};border-bottom:1px solid #f1f5f9;padding:12px 16px;">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
            <span style="font-weight:700;color:#1e293b;font-size:13px;">${esc(s.product ?? "Unknown product")}</span>
            ${s.unNumber ? `<span style="font-size:11px;color:#64748b;font-weight:600;">UN ${esc(s.unNumber)}</span>` : ""}
            ${badge(s.initialRisk)}<span style="color:#9ca3af;font-size:11px;"> → </span>${badge(s.residualRisk)}
          </div>
          <table style="width:100%;border-collapse:collapse;font-size:12px;"><tbody>
            ${s.state ? `<tr><td style="padding:2px 0;color:#64748b;width:140px;">State</td><td style="padding:2px 0;color:#374151;">${esc(s.state)}</td></tr>` : ""}
            ${s.hazardType ? `<tr><td style="padding:2px 0;color:#64748b;">Hazard type</td><td style="padding:2px 0;color:#374151;">${esc(s.hazardType)}</td></tr>` : ""}
            ${s.maxQty ? `<tr><td style="padding:2px 0;color:#64748b;">Max qty on site</td><td style="padding:2px 0;color:#374151;">${esc(s.maxQty)}</td></tr>` : ""}
            ${s.storage ? `<tr><td style="padding:2px 0;color:#64748b;">Storage</td><td style="padding:2px 0;color:#374151;">${esc(s.storage)}</td></tr>` : ""}
            ${s.sdsLocation ? `<tr><td style="padding:2px 0;color:#64748b;">SDS location</td><td style="padding:2px 0;color:#374151;">${esc(s.sdsLocation)}</td></tr>` : ""}
            ${s.controls ? `<tr><td style="padding:2px 0;color:#64748b;vertical-align:top;">Controls</td><td style="padding:2px 0;color:#374151;line-height:1.5;">${esc(s.controls)}</td></tr>` : ""}
            ${s.ppe ? `<tr><td style="padding:2px 0;color:#64748b;">PPE for this product</td><td style="padding:2px 0;color:#374151;">${esc(s.ppe)}</td></tr>` : ""}
          </tbody></table>
        </div>`).join("")}
      </div>` : "";

    const ppeBlock = ppeRequired.length > 0 ? `
      <div style="margin-bottom:24px;border:1px solid #e2e8f0;border-radius:6px;overflow:hidden;">
        ${sectionHdr("PPE Required on Site")}
        <div style="padding:12px 16px;display:flex;flex-wrap:wrap;gap:8px;">
          ${ppeRequired.map(p => `<span style="background:#f1f5f9;border:1px solid #e2e8f0;border-radius:4px;padding:4px 10px;font-size:12px;color:#1e293b;font-weight:500;">${esc(p)}</span>`).join("")}
        </div>
      </div>` : "";

    const emergencyBlock = (emergencyContacts.length > 0 || data.nearestHospital || data.musterPoint) ? `
      <div style="margin-bottom:24px;border:1px solid #e2e8f0;border-radius:6px;overflow:hidden;">
        ${sectionHdr("Emergency Response")}
        <table style="width:100%;border-collapse:collapse;">
          ${isUS
            ? kvRow("Emergency", "<strong>911</strong> — Police, Fire, Ambulance") + kvRow("Poison Control", "1-800-222-1222") + kvRow("OSHA", "1-800-321-6742")
            : kvRow("Emergency", "<strong>111</strong> — Police, Fire, Ambulance") + kvRow("Poisons Centre", "0800 764 766") + kvRow("WorkSafe NZ", "0800 030 040")}
          ${data.nearestHospital ? kvRow("Nearest Hospital", esc(data.nearestHospital as string)) : ""}
          ${data.hospitalPhone ? kvRow("Hospital Phone", esc(data.hospitalPhone as string)) : ""}
          ${data.musterPoint ? kvRow("Muster / Assembly Point", esc(data.musterPoint as string)) : ""}
          ${emergencyContacts.map(c => kvRow(c.role ? esc(c.role) : "Emergency Contact", `${esc(c.name ?? "")}${c.phone ? " · " + esc(c.phone) : ""}`)).join("")}
        </table>
      </div>` : "";

    const communicationBlock = (data.commToolboxFreq || data.commPreStartFreq || data.commProgressFreq) ? `
      <div style="margin-bottom:24px;border:1px solid #e2e8f0;border-radius:6px;overflow:hidden;">
        ${sectionHdr("Communication &amp; Reporting Plan")}
        <table style="width:100%;border-collapse:collapse;">
          ${data.commToolboxFreq ? kvRow("Toolbox talks", esc(data.commToolboxFreq as string)) : ""}
          ${data.commPreStartFreq ? kvRow("Pre-start briefings", esc(data.commPreStartFreq as string)) : ""}
          ${data.commProgressFreq ? kvRow("Progress meetings", esc(data.commProgressFreq as string)) : ""}
          ${kvRow("Serious injury / near miss", "Report to PCBU 1 immediately by phone")}
          ${kvRow("Minor near miss / damage", "Report to PCBU 1 within 24 hours")}
        </table>
      </div>` : "";

    const trainingBlock = (trainingItems.length > 0 || pcbu2.contact || data.inductionProcess) ? `
      <div style="margin-bottom:24px;border:1px solid #e2e8f0;border-radius:6px;overflow:hidden;">
        ${sectionHdr("Training &amp; Competency")}
        <table style="width:100%;border-collapse:collapse;">
          ${pcbu2.contact ? kvRow("On-site Safety Rep", esc(pcbu2.contact)) : ""}
          ${pcbu2.role ? kvRow("Role", esc(pcbu2.role)) : ""}
        </table>
        ${trainingItems.length > 0 ? `<div style="padding:12px 16px;border-top:1px solid #f1f5f9;">
          <div style="font-size:11px;font-weight:700;color:#64748b;margin-bottom:8px;text-transform:uppercase;letter-spacing:0.05em;">Training Requirements</div>
          <ul style="margin:0;padding:0 0 0 16px;font-size:12px;color:#374151;line-height:1.8;">${trainingItems.map(t => `<li>${esc(t)}</li>`).join("")}</ul>
        </div>` : ""}
        ${data.inductionProcess ? `<div style="padding:12px 16px;border-top:1px solid #f1f5f9;">
          <div style="font-size:11px;font-weight:700;color:#64748b;margin-bottom:6px;text-transform:uppercase;letter-spacing:0.05em;">Induction Process</div>
          <p style="margin:0;font-size:12px;color:#374151;line-height:1.6;">${esc(data.inductionProcess as string)}</p>
        </div>` : ""}
      </div>` : "";

    const photoBase = `https://${publicDomain()}`;
    const photosBlock = photos.length > 0 ? `
      <div style="margin-bottom:24px;border:1px solid #e2e8f0;border-radius:6px;overflow:hidden;">
        ${sectionHdr(`Site Photos — ${photos.length} photo${photos.length !== 1 ? "s" : ""}`)}
        <div style="padding:12px 16px;">
          <table style="width:100%;border-collapse:separate;border-spacing:6px;"><tbody>
            ${(() => {
              const rows: string[] = [];
              for (let i = 0; i < photos.length; i += 2) {
                const a = photos[i];
                const b = photos[i + 1];
                rows.push(`<tr>
                  <td style="width:50%;vertical-align:top;border:1px solid #e2e8f0;border-radius:4px;overflow:hidden;">
                    <img src="${esc(photoBase + "/api/storage" + a.objectPath)}" alt="${esc(a.caption ?? "Site photo")}" style="display:block;width:100%;height:160px;object-fit:cover;" />
                    ${a.caption ? `<div style="padding:5px 8px;font-size:11px;color:#374151;">${esc(a.caption)}</div>` : ""}
                  </td>
                  ${b ? `<td style="width:50%;vertical-align:top;border:1px solid #e2e8f0;border-radius:4px;overflow:hidden;">
                    <img src="${esc(photoBase + "/api/storage" + b.objectPath)}" alt="${esc(b.caption ?? "Site photo")}" style="display:block;width:100%;height:160px;object-fit:cover;" />
                    ${b.caption ? `<div style="padding:5px 8px;font-size:11px;color:#374151;">${esc(b.caption)}</div>` : ""}
                  </td>` : `<td style="width:50%;"></td>`}
                </tr>`);
              }
              return rows.join("");
            })()}
          </tbody></table>
        </div>
      </div>` : "";

    const sigBlock = `
      <div style="margin-bottom:24px;border:2px solid #f97316;border-radius:6px;overflow:hidden;">
        ${sectionHdr("PCBU 2 — Contractor Signature")}
        <div style="padding:16px 20px;background:#fffbf5;">
          ${pcbu2SignatureImage ? `<img src="${pcbu2SignatureImage}" alt="Contractor signature" style="display:block;max-height:80px;max-width:280px;margin-bottom:10px;" />` : ""}
          <div style="font-size:14px;color:#1e293b;font-weight:700;">${esc(pcbu2SignedBy)}</div>
          <div style="font-size:12px;color:#64748b;margin-top:2px;">Signed ${pcbu2SignedDate ? esc(pcbu2SignedDate) : "today"} — ${esc(pcbu2Company)}</div>
        </div>
      </div>`;

    await sendEmail({
      replyTo: pcbu2Email || undefined,
      to: parsed.data.recipientEmail,
      subject: `SSSP — ${projectName} (signed by ${pcbu2Company})`,
      html: `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;font-family:Inter,Arial,sans-serif;background:#f8fafc;">
  <div style="max-width:600px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;">
    <div style="background:#0F172A;padding:20px 28px;">
      <div style="font-size:20px;font-weight:900;letter-spacing:-0.5px;"><span style="color:#fff;">FOR</span><span style="color:#f97316;">MATE</span></div>
      <div style="color:#94a3b8;font-size:12px;margin-top:3px;">Site-Specific Safety Plan — sign-off request</div>
    </div>
    <div style="padding:28px 28px 24px;">
      <p style="margin:0 0 6px;color:#64748b;font-size:14px;">Hi ${esc(recipientName)},</p>
      <p style="margin:0 0 22px;color:#1e293b;font-size:15px;line-height:1.6;">
        <strong>${esc(pcbu2Company)}</strong> has sent you a Site-Specific Safety Plan for your review and sign-off.
      </p>
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px 18px;margin-bottom:24px;">
        <div style="font-size:14px;font-weight:700;color:#1e293b;margin-bottom:4px;">${esc(projectName)}</div>
        ${siteAddress ? `<div style="font-size:13px;color:#64748b;margin-bottom:2px;">📍 ${esc(siteAddress)}</div>` : ""}
        ${activities ? `<div style="font-size:13px;color:#64748b;margin-bottom:2px;">🔧 ${esc(activities)}</div>` : ""}
        <div style="font-size:12px;color:#94a3b8;margin-top:6px;">From ${esc(pcbu2Company)}${pcbu2Contact ? ` · ${esc(pcbu2Contact)}` : ""}${pcbu2Phone ? ` · ${esc(pcbu2Phone)}` : ""}</div>
      </div>
      <div style="text-align:center;margin:0 0 18px;">
        <a href="${signUrl}" style="display:inline-block;background:#f97316;color:#fff;font-weight:700;font-size:16px;text-decoration:none;padding:16px 44px;border-radius:8px;">Review &amp; Sign →</a>
        <div style="margin-top:10px;font-size:12px;color:#94a3b8;">The full safety plan opens in your browser — type your name to sign. No account needed.</div>
      </div>
      <div style="text-align:center;margin:0 0 24px;">
        <a href="${viewUrl}" style="font-size:13px;color:#f97316;font-weight:600;text-decoration:underline;">📄 View &amp; print / save the full safety plan (PDF) →</a>
        <div style="margin-top:4px;font-size:11px;color:#94a3b8;">Opens the complete plan — every hazard, control and section — ready to print or save for your records.</div>
      </div>
      <div style="background:#fef9f0;border:1px solid #fed7aa;border-radius:6px;padding:14px 18px;margin:0 0 24px;">
        <div style="font-size:12px;font-weight:700;color:#92400e;margin-bottom:6px;">📋 SAVE THIS EMAIL — the full safety plan is included below</div>
        <div style="font-size:13px;color:#78350f;line-height:1.5;">Every section is in this email so you can print it or keep it for your records — no login or app needed. To sign electronically and save paper, tap <strong>Review &amp; Sign</strong> above.</div>
      </div>
      ${pcbu1.company ? `<div style="margin-bottom:24px;border:1px solid #e2e8f0;border-radius:6px;overflow:hidden;">
        ${sectionHdr("PCBU 1 — Principal / Client")}
        <table style="width:100%;border-collapse:collapse;">
          ${kvRow("Company", `<strong>${esc(pcbu1.company)}</strong>`)}
          ${pcbu1.contact ? kvRow("Contact", esc(pcbu1.contact)) : ""}
          ${pcbu1.phone ? kvRow("Phone", esc(pcbu1.phone)) : ""}
        </table>
      </div>` : ""}
      ${hazardTable}
      ${taskTable}
      ${substanceTable}
      ${ppeBlock}
      ${emergencyBlock}
      ${communicationBlock}
      ${trainingBlock}
      ${photosBlock}
      ${sigBlock}
      <div style="text-align:center;margin:0 0 24px;">
        <a href="${signUrl}" style="display:inline-block;background:transparent;color:#f97316;font-weight:700;font-size:14px;text-decoration:none;padding:10px 28px;border-radius:6px;border:2px solid #f97316;">Review &amp; Sign electronically →</a>
      </div>
      <div style="text-align:center;border-top:1px solid #f1f5f9;padding-top:18px;">
        <a href="${portalUrl}" style="font-size:13px;color:#64748b;text-decoration:underline;">📋 View all SSSPs in your sign-off portal →</a>
        <div style="margin-top:4px;font-size:11px;color:#94a3b8;">Bookmark this — shows every SSSP sent to ${esc(parsed.data.recipientEmail)}</div>
      </div>
    </div>
    <div style="background:#0F172A;padding:14px 28px;">
      <p style="margin:0;color:#94a3b8;font-size:12px;">
        <span style="color:#fff;font-weight:700;">FOR</span><span style="color:#f97316;font-weight:700;">MATE</span>
        &nbsp;·&nbsp; ${isUS ? "OSHA aligned" : "NZ WorkSafe compliant"}
        ${pcbu2Phone ? `&nbsp;·&nbsp; Questions? Call ${esc(pcbu2Phone)}` : ""}
      </p>
    </div>
  </div>
</body></html>`,
      text: `Hi ${recipientName},\n\n${pcbu2Company} has sent you the completed SSSP for "${projectName}".\n\nSite: ${siteAddress}${activities ? "\nActivities: " + activities : ""}\nSigned by: ${pcbu2SignedBy}\n\nReview & sign: ${signUrl}\n\nView, print or save the FULL safety plan (PDF) for your records: ${viewUrl}\n\nThe document is valid as sent.`,
    });

    req.log.info({ ssspId: id, to: parsed.data.recipientEmail }, "sent full SSSP with signature to PCBU1");
    res.json({ ok: true, sentTo: parsed.data.recipientEmail, pcbu1SignToken: token });
  } catch (err) {
    req.log.error({ err }, "Failed to send SSSP for sign-off");
    res.status(500).json({ error: err instanceof Error ? err.message : "Internal server error" });
  }
});

router.post("/:id/send-email", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const parsed = sendEmailSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.issues });
    return;
  }

  try {
    const userId = getUserId(req);
    const [sssp] = await db.select().from(ssspsTable)
      .where(and(eq(ssspsTable.id, id), eq(ssspsTable.userId, userId)));
    if (!sssp) { res.status(404).json({ error: "Not found" }); return; }

    const data = { ...((sssp.data ?? {}) as Record<string, unknown>) };
    const pcbu1 = (data.pcbu1 ?? {}) as Record<string, string>;
    const pcbu2 = (data.pcbu2 ?? {}) as Record<string, string>;

    // Ensure an unguessable shareToken exists for the public view link.
    // Generate once and keep stable so previously-sent links continue to work.
    if (!data.shareToken || typeof data.shareToken !== "string" || data.shareToken.length < 16) {
      data.shareToken = randomBytes(24).toString("hex");
    }
    const shareToken = data.shareToken as string;

    // PCBU 1 is the signer — but only AFTER the contractor (PCBU 2) has signed,
    // matching the send-for-sign rule (contractor signs first). Once PCBU 2 has
    // signed, this email carries a sign-off link too: reuse any existing token so
    // previously-sent links keep working, otherwise mint one. Before that it stays
    // a read-only copy and no sign capability is created.
    const pcbu2HasSigned = !!data.pcbu2SignatureImage && !!data.pcbu2SignedBy;
    let signUrl = "";
    if (pcbu2HasSigned) {
      const pcbu1SignToken = typeof data.pcbu1SignToken === "string" && data.pcbu1SignToken.length >= 16
        ? (data.pcbu1SignToken as string)
        : randomBytes(24).toString("hex");
      data.pcbu1SignToken = pcbu1SignToken;
      data.pcbu1SignSentAt = new Date().toISOString();
      data.pcbu1SignSentTo = parsed.data.recipientEmail;
      signUrl = `https://${publicDomain()}/sign/${pcbu1SignToken}`;
    }
    await db.update(ssspsTable).set({ data }).where(eq(ssspsTable.id, id));

    // Country drives which national emergency numbers appear in the email/PDF.
    const [emCompany] = await db
      .select({ country: companiesTable.country })
      .from(companiesTable)
      .where(eq(companiesTable.userId, userId))
      .limit(1);
    const isUS = emCompany?.country === "US";

    const projectName = sssp.projectName;
    const siteAddress = (data.siteAddress as string) ?? "Not specified";
    const activities = (data.activities as string) ?? "";
    const pcbu2Company = pcbu2.company ?? "Formate User";

    const printUrl = `https://${publicDomain()}/sssp/${shareToken}`;

    const recipientName = parsed.data.recipientName ?? pcbu1.contact ?? "Site Manager";
    const pcbu2Email = pcbu2.email;
    const pcbu2Phone = pcbu2.phone;
    const pcbu2Contact = pcbu2.contact;

    // Full data extraction for email
    const hazards = (data.hazards as Array<Record<string,string>> | undefined) ?? [];
    const substances = (data.substances as Array<Record<string,string>> | undefined) ?? [];
    const ppeRequired = (data.ppeRequired as string[] | undefined) ?? [];
    const taskSteps = (data.taskSteps as Array<Record<string,string>> | undefined) ?? [];
    const emergencyContacts = (data.emergencyContacts as Array<Record<string,string>> | undefined) ?? [];
    const photos = (data.photos as Array<{ id: string; objectPath: string; caption?: string }> | undefined) ?? [];
    const highRiskHazards = hazards.filter(h => h.initialRisk === "High" || h.initialRisk === "Critical");

    // Helper: risk badge colour inline for email
    const riskStyle = (r: string) => {
      if (r === "Critical" || r === "High") return "background:#fef2f2;color:#991b1b;";
      if (r === "Moderate") return "background:#fefce8;color:#92400e;";
      if (r === "Low") return "background:#f0fdf4;color:#166534;";
      return "background:#eff6ff;color:#1d4ed8;";
    };
    const badge = (r: string) => r ? `<span style="display:inline-block;padding:1px 8px;border-radius:99px;font-size:11px;font-weight:700;${riskStyle(r)}">${esc(r)}</span>` : "";

    const sectionHeader = (title: string) =>
      `<div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:#64748b;padding:10px 16px;background:#f1f5f9;border-bottom:1px solid #e2e8f0;">${title}</div>`;

    const kvRow = (label: string, value: string) => value ? `
      <tr>
        <td style="padding:7px 16px;color:#64748b;font-size:13px;width:180px;border-bottom:1px solid #f1f5f9;white-space:nowrap;">${label}</td>
        <td style="padding:7px 16px;color:#1e293b;font-size:13px;border-bottom:1px solid #f1f5f9;">${value}</td>
      </tr>` : "";

    // Full hazard register table
    const hazardTable = hazards.length > 0 ? `
      <div style="margin-bottom:24px;border:1px solid #e2e8f0;border-radius:6px;overflow:hidden;">
        ${sectionHeader(`Hazard &amp; Risk Register — ${hazards.length} hazard${hazards.length !== 1 ? "s" : ""} identified`)}
        ${highRiskHazards.length > 0 ? `<div style="background:#fef2f2;border-bottom:1px solid #fecaca;padding:8px 16px;font-size:12px;font-weight:700;color:#dc2626;">⚠ ${highRiskHazards.length} HIGH / CRITICAL HAZARD${highRiskHazards.length !== 1 ? "S" : ""} — REVIEW BEFORE WORK STARTS</div>` : ""}
        <table style="width:100%;border-collapse:collapse;font-size:12px;">
          <thead>
            <tr style="background:#f8fafc;">
              <th style="padding:8px 12px;text-align:left;font-size:11px;font-weight:700;color:#64748b;border-bottom:1px solid #e2e8f0;width:22%;">Hazard</th>
              <th style="padding:8px 12px;text-align:left;font-size:11px;font-weight:700;color:#64748b;border-bottom:1px solid #e2e8f0;width:9%;">Initial Risk</th>
              <th style="padding:8px 12px;text-align:left;font-size:11px;font-weight:700;color:#64748b;border-bottom:1px solid #e2e8f0;width:40%;">Controls in Place</th>
              <th style="padding:8px 12px;text-align:left;font-size:11px;font-weight:700;color:#64748b;border-bottom:1px solid #e2e8f0;width:20%;">Control Level</th>
              <th style="padding:8px 12px;text-align:left;font-size:11px;font-weight:700;color:#64748b;border-bottom:1px solid #e2e8f0;width:9%;">Residual</th>
            </tr>
          </thead>
          <tbody>
            ${hazards.map((h, i) => `
            <tr style="background:${i % 2 === 0 ? "#fff" : "#f8fafc"};">
              <td style="padding:8px 12px;color:#1e293b;font-weight:600;border-bottom:1px solid #f1f5f9;vertical-align:top;">${esc(h.hazard ?? "")}</td>
              <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;vertical-align:top;">${badge(h.initialRisk)}</td>
              <td style="padding:8px 12px;color:#374151;border-bottom:1px solid #f1f5f9;vertical-align:top;font-size:12px;line-height:1.5;">${esc(h.controls ?? "—")}</td>
              <td style="padding:8px 12px;color:#374151;border-bottom:1px solid #f1f5f9;vertical-align:top;font-size:11px;">${esc(h.controlLevel ?? "—")}</td>
              <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;vertical-align:top;">${badge(h.residualRisk)}</td>
            </tr>`).join("")}
          </tbody>
        </table>
      </div>` : "";

    // Full task analysis table
    const taskTable = taskSteps.length > 0 ? `
      <div style="margin-bottom:24px;border:1px solid #e2e8f0;border-radius:6px;overflow:hidden;">
        ${sectionHeader(`Task Analysis — ${taskSteps.length} step${taskSteps.length !== 1 ? "s" : ""}`)}
        <table style="width:100%;border-collapse:collapse;font-size:12px;">
          <thead>
            <tr style="background:#f8fafc;">
              <th style="padding:8px 12px;text-align:left;font-size:11px;font-weight:700;color:#64748b;border-bottom:1px solid #e2e8f0;width:20%;">Step</th>
              <th style="padding:8px 12px;text-align:left;font-size:11px;font-weight:700;color:#64748b;border-bottom:1px solid #e2e8f0;width:18%;">Hazards</th>
              <th style="padding:8px 12px;text-align:left;font-size:11px;font-weight:700;color:#64748b;border-bottom:1px solid #e2e8f0;width:9%;">Initial</th>
              <th style="padding:8px 12px;text-align:left;font-size:11px;font-weight:700;color:#64748b;border-bottom:1px solid #e2e8f0;width:34%;">Controls</th>
              <th style="padding:8px 12px;text-align:left;font-size:11px;font-weight:700;color:#64748b;border-bottom:1px solid #e2e8f0;width:9%;">Residual</th>
            </tr>
          </thead>
          <tbody>
            ${taskSteps.map((s, i) => `
            <tr style="background:${i % 2 === 0 ? "#fff" : "#f8fafc"};">
              <td style="padding:8px 12px;color:#1e293b;font-weight:600;border-bottom:1px solid #f1f5f9;vertical-align:top;">${esc(s.step ?? "")}</td>
              <td style="padding:8px 12px;color:#374151;border-bottom:1px solid #f1f5f9;vertical-align:top;">${esc(s.hazards ?? "—")}</td>
              <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;vertical-align:top;">${badge(s.initialRisk)}</td>
              <td style="padding:8px 12px;color:#374151;border-bottom:1px solid #f1f5f9;vertical-align:top;font-size:12px;line-height:1.5;">${esc(s.controls ?? "—")}</td>
              <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;vertical-align:top;">${badge(s.residualRisk)}</td>
            </tr>`).join("")}
          </tbody>
        </table>
      </div>` : "";

    // Full dangerous goods / hazardous substances register
    const substanceTable = substances.length > 0 ? `
      <div style="margin-bottom:24px;border:1px solid #e2e8f0;border-radius:6px;overflow:hidden;">
        ${sectionHeader(`Dangerous Goods &amp; Hazardous Substances Register — ${substances.length} product${substances.length !== 1 ? "s" : ""}`)}
        ${substances.map((s, i) => `
        <div style="background:${i % 2 === 0 ? "#fff" : "#f8fafc"};border-bottom:1px solid #f1f5f9;padding:12px 16px;">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
            <span style="font-weight:700;color:#1e293b;font-size:13px;">${esc(s.product ?? "Unknown product")}</span>
            ${s.unNumber ? `<span style="font-size:11px;color:#64748b;font-weight:600;">UN ${esc(s.unNumber)}</span>` : ""}
            ${badge(s.initialRisk)}
            <span style="color:#9ca3af;font-size:11px;">→</span>
            ${badge(s.residualRisk)}
          </div>
          <table style="width:100%;border-collapse:collapse;font-size:12px;">
            <tbody>
              ${s.state ? `<tr><td style="padding:2px 0;color:#64748b;width:140px;">State</td><td style="padding:2px 0;color:#374151;">${esc(s.state)}</td></tr>` : ""}
              ${s.hazardType ? `<tr><td style="padding:2px 0;color:#64748b;">Hazard type</td><td style="padding:2px 0;color:#374151;">${esc(s.hazardType)}</td></tr>` : ""}
              ${s.maxQty ? `<tr><td style="padding:2px 0;color:#64748b;">Max qty on site</td><td style="padding:2px 0;color:#374151;">${esc(s.maxQty)}</td></tr>` : ""}
              ${s.storage ? `<tr><td style="padding:2px 0;color:#64748b;">Storage</td><td style="padding:2px 0;color:#374151;">${esc(s.storage)}</td></tr>` : ""}
              ${s.segregation ? `<tr><td style="padding:2px 0;color:#64748b;">Segregation</td><td style="padding:2px 0;color:#374151;">${esc(s.segregation)}</td></tr>` : ""}
              ${s.sdsLocation ? `<tr><td style="padding:2px 0;color:#64748b;">SDS location</td><td style="padding:2px 0;color:#374151;">${esc(s.sdsLocation)}</td></tr>` : ""}
              ${s.controls ? `<tr><td style="padding:2px 0;color:#64748b;vertical-align:top;">Control measures</td><td style="padding:2px 0;color:#374151;line-height:1.5;">${esc(s.controls)}</td></tr>` : ""}
              ${s.ppe ? `<tr><td style="padding:2px 0;color:#64748b;">PPE required</td><td style="padding:2px 0;color:#374151;">${esc(s.ppe)}</td></tr>` : ""}
            </tbody>
          </table>
        </div>`).join("")}
      </div>` : "";

    // PPE list
    const ppeBlock = ppeRequired.length > 0 ? `
      <div style="margin-bottom:24px;border:1px solid #e2e8f0;border-radius:6px;overflow:hidden;">
        ${sectionHeader("PPE Required on Site")}
        <div style="padding:12px 16px;display:flex;flex-wrap:wrap;gap:8px;">
          ${ppeRequired.map(p => `<span style="background:#f1f5f9;border:1px solid #e2e8f0;border-radius:4px;padding:4px 10px;font-size:12px;color:#1e293b;font-weight:500;">${esc(p)}</span>`).join("")}
        </div>
      </div>` : "";

    // Emergency contacts
    const emergencyBlock = (emergencyContacts.length > 0 || data.nearestHospital || data.musterPoint) ? `
      <div style="margin-bottom:24px;border:1px solid #e2e8f0;border-radius:6px;overflow:hidden;">
        ${sectionHeader("Emergency Response")}
        <table style="width:100%;border-collapse:collapse;">
          ${isUS
            ? kvRow("Emergency", "<strong>911</strong> — Police, Fire, Ambulance") +
              kvRow("Poison Control", "1-800-222-1222") +
              kvRow("CDC Info", "1-800-232-4636 (non-urgent advice)") +
              kvRow("OSHA", "1-800-321-6742 (notifiable events)")
            : kvRow("Emergency", "<strong>111</strong> — Police, Fire, Ambulance") +
              kvRow("Poisons Centre", "0800 764 766") +
              kvRow("Healthline", "0800 611 116 (non-urgent advice)") +
              kvRow("WorkSafe NZ", "0800 030 040")}
          ${data.nearestHospital ? kvRow("Nearest Hospital", esc(data.nearestHospital as string)) : ""}
          ${data.hospitalPhone ? kvRow("Hospital Phone", esc(data.hospitalPhone as string)) : ""}
          ${data.musterPoint ? kvRow("Muster / Assembly Point", esc(data.musterPoint as string)) : ""}
          ${emergencyContacts.map(c => kvRow(c.role ? esc(c.role) : "Emergency Contact", `${esc(c.name ?? "")}${c.phone ? " · " + esc(c.phone) : ""}`)).join("")}
        </table>
      </div>` : "";

    // Site photos — absolute URLs so they render in email clients.
    // Captions are user-supplied and end up in both HTML text and attribute
    // contexts, so escape them before interpolating.
    const photoBase = `https://${publicDomain()}`;
    const photosBlock = photos.length > 0 ? `
      <div style="margin-bottom:24px;border:1px solid #e2e8f0;border-radius:6px;overflow:hidden;">
        ${sectionHeader(`Site Photos — ${photos.length} photo${photos.length !== 1 ? "s" : ""}`)}
        <div style="padding:12px 16px;">
          <table style="width:100%;border-collapse:separate;border-spacing:6px;">
            <tbody>
              ${(() => {
                const rows: string[] = [];
                for (let i = 0; i < photos.length; i += 2) {
                  const a = photos[i];
                  const b = photos[i + 1];
                  rows.push(`<tr>
                    <td style="width:50%;vertical-align:top;border:1px solid #e2e8f0;border-radius:4px;overflow:hidden;">
                      <img src="${esc(photoBase + "/api/storage" + a.objectPath)}" alt="${esc(a.caption ?? "Site photo")}" style="display:block;width:100%;height:180px;object-fit:cover;" />
                      ${a.caption ? `<div style="padding:6px 8px;font-size:11px;color:#374151;line-height:1.4;">${esc(a.caption)}</div>` : ""}
                    </td>
                    ${b ? `<td style="width:50%;vertical-align:top;border:1px solid #e2e8f0;border-radius:4px;overflow:hidden;">
                      <img src="${esc(photoBase + "/api/storage" + b.objectPath)}" alt="${esc(b.caption ?? "Site photo")}" style="display:block;width:100%;height:180px;object-fit:cover;" />
                      ${b.caption ? `<div style="padding:6px 8px;font-size:11px;color:#374151;line-height:1.4;">${esc(b.caption)}</div>` : ""}
                    </td>` : `<td style="width:50%;"></td>`}
                  </tr>`);
                }
                return rows.join("");
              })()}
            </tbody>
          </table>
        </div>
      </div>` : "";

    await sendEmail({
      replyTo: pcbu2Email ?? undefined,
      to: parsed.data.recipientEmail,
      subject: `SSSP: ${projectName} — from ${pcbu2Company}`,
      html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;font-family:Inter,Arial,sans-serif;background:#f8fafc;">
  <div style="max-width:680px;margin:32px auto;background:#fff;border-radius:8px;overflow:hidden;border:1px solid #e2e8f0;">

    <!-- Header -->
    <div style="background:#0F172A;padding:24px 32px;">
      <div style="font-size:22px;font-weight:900;letter-spacing:-0.5px;"><span style="color:#ffffff;">FOR</span><span style="color:#f97316;">MATE</span></div>
      <div style="color:#94a3b8;font-size:13px;margin-top:4px;">Site-Specific Safety Plan</div>
    </div>

    <div style="padding:28px 32px;">
      <p style="margin:0 0 6px;color:#64748b;font-size:14px;">Hi ${esc(recipientName)},</p>
      <p style="margin:0 0 24px;color:#1e293b;font-size:15px;line-height:1.6;">
        <strong>${esc(pcbu2Company)}</strong> has sent you a Site-Specific Safety Plan for review before work commences on site.
      </p>

      <!-- Plan Details -->
      <div style="margin-bottom:24px;border:1px solid #e2e8f0;border-radius:6px;overflow:hidden;">
        ${sectionHeader("Plan Details")}
        <table style="width:100%;border-collapse:collapse;">
          ${kvRow("Project", esc(projectName))}
          ${kvRow("Site address", esc(siteAddress))}
          ${activities ? kvRow("Activities", esc(activities)) : ""}
          ${kvRow("Submitted by", `${esc(pcbu2Company)}${pcbu2Contact ? " — " + esc(pcbu2Contact) : ""}`)}
          ${pcbu2Phone ? kvRow("Contact phone", esc(pcbu2Phone)) : ""}
          ${pcbu2Email ? kvRow("Contact email", `<a href="mailto:${esc(pcbu2Email)}" style="color:#f97316;">${esc(pcbu2Email)}</a>`) : ""}
        </table>
      </div>

      <!-- PCBU 1 -->
      ${pcbu1.company ? `
      <div style="margin-bottom:24px;border:1px solid #e2e8f0;border-radius:6px;overflow:hidden;">
        ${sectionHeader("PCBU 1 — Principal Contractor")}
        <table style="width:100%;border-collapse:collapse;">
          ${kvRow("Company", `<strong>${esc(pcbu1.company)}</strong>`)}
          ${pcbu1.contact ? kvRow("Contact", esc(pcbu1.contact)) : ""}
          ${pcbu1.phone ? kvRow("Phone", esc(pcbu1.phone)) : ""}
          ${pcbu1.email ? kvRow("Email", `<a href="mailto:${esc(pcbu1.email)}" style="color:#f97316;">${esc(pcbu1.email)}</a>`) : ""}
          ${pcbu1.safetyRep ? kvRow("Safety rep", `${esc(pcbu1.safetyRep)}${pcbu1.safetyRepPhone ? " · " + esc(pcbu1.safetyRepPhone) : ""}`) : ""}
          ${pcbu1.firstAid ? kvRow("First aid rep", `${esc(pcbu1.firstAid)}${(pcbu1 as Record<string,string>).firstAidPhone ? " · " + esc((pcbu1 as Record<string,string>).firstAidPhone) : ""}`) : ""}
        </table>
      </div>` : ""}

      <!-- PCBU 2 -->
      <div style="margin-bottom:24px;border:1px solid #e2e8f0;border-radius:6px;overflow:hidden;">
        ${sectionHeader("PCBU 2 — Contractor")}
        <table style="width:100%;border-collapse:collapse;">
          ${kvRow("Company", `<strong>${esc(pcbu2Company)}</strong>`)}
          ${pcbu2Contact ? kvRow("Contact", esc(pcbu2Contact)) : ""}
          ${pcbu2Phone ? kvRow("Phone", esc(pcbu2Phone)) : ""}
          ${pcbu2Email ? kvRow("Email", `<a href="mailto:${esc(pcbu2Email)}" style="color:#f97316;">${esc(pcbu2Email)}</a>`) : ""}
          ${(data.pcbu2 as Record<string,string>)?.safetyRep ? kvRow("Safety rep", esc((data.pcbu2 as Record<string,string>).safetyRep)) : ""}
        </table>
      </div>

      <!-- Sign / View buttons -->
      ${signUrl ? `
      <div style="text-align:center;margin:28px 0;">
        <a href="${signUrl}" style="display:inline-block;background:#f97316;color:#fff;font-weight:700;font-size:16px;padding:16px 44px;border-radius:8px;text-decoration:none;">
          Review &amp; Sign →
        </a>
        <div style="margin-top:8px;font-size:12px;color:#94a3b8;">Type your name to sign — no login or app required.</div>
        <div style="margin-top:14px;">
          <a href="${printUrl}" style="font-size:13px;color:#f97316;font-weight:600;text-decoration:underline;">View &amp; print the full SSSP (PDF) →</a>
        </div>
      </div>` : `
      <div style="text-align:center;margin:28px 0;">
        <a href="${printUrl}" style="display:inline-block;background:#f97316;color:#fff;font-weight:700;font-size:15px;padding:14px 36px;border-radius:6px;text-decoration:none;">
          View &amp; Print Full SSSP →
        </a>
        <div style="margin-top:8px;font-size:12px;color:#94a3b8;">Opens in browser — no login required</div>
      </div>`}

      <!-- Hazard Register -->
      ${hazardTable}

      <!-- Task Analysis -->
      ${taskTable}

      <!-- Dangerous Goods -->
      ${substanceTable}

      <!-- PPE -->
      ${ppeBlock}

      <!-- Emergency -->
      ${emergencyBlock}

      <!-- Site Photos -->
      ${photosBlock}

      <p style="margin:20px 0 0;color:#94a3b8;font-size:13px;line-height:1.6;">
        Questions? Reply to this email or contact ${esc(pcbu2Company)} directly${pcbu2Phone ? ` on ${esc(pcbu2Phone)}` : ""}.
      </p>
    </div>

    <!-- Footer -->
    <div style="background:#0F172A;padding:16px 32px;border-top:1px solid #1e293b;">
      <p style="margin:0;color:#94a3b8;font-size:12px;">
        <span style="color:#ffffff;font-weight:700;">FOR</span><span style="color:#f97316;font-weight:700;">MATE</span>
        &nbsp;·&nbsp; ${isUS ? "OSHA aligned" : "NZ WorkSafe compliant"}
        &nbsp;·&nbsp; <a href="${printUrl}" style="color:#f97316;">View SSSP online</a>
        &nbsp;·&nbsp; <a href="https://smart-form-fill.replit.app" style="color:#64748b;">formate.co.nz</a>
      </p>
    </div>
  </div>
</body>
</html>`,
    });

    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Failed to send SSSP email");
    res.status(500).json({ error: "Failed to send email" });
  }
});

export default router;
