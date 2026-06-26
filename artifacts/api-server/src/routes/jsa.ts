import { Router, type Request } from "express";
import { eq, desc, and, isNull } from "drizzle-orm";
import { randomBytes } from "node:crypto";
import { db, jsaTable, companiesTable } from "@workspace/db";
import { z } from "zod";
import { getJsaNzTemplate } from "../lib/jsa-templates-nz";
import { generateAndStoreJsaSnapshot } from "./jsa-pdf";
import { computeContentHash, recordLockEvent } from "../lib/audit";

function getUserId(req: Request): string {
  return (req as Request & { userId?: string }).userId ?? "";
}

const router = Router();

const createJsaSchema = z.object({
  jobName: z.string().min(1),
  siteId: z.number().optional().nullable(),
  status: z.enum(["draft", "active", "archived"]).optional(),
  data: z.record(z.unknown()).optional(),
});

const updateJsaSchema = z.object({
  jobName: z.string().min(1).optional(),
  siteId: z.number().optional().nullable(),
  status: z.enum(["draft", "active", "archived"]).optional(),
  data: z.record(z.unknown()).optional(),
});

router.get("/", async (req, res) => {
  const userId = getUserId(req);
  try {
    const list = await db
      .select()
      .from(jsaTable)
      .where(eq(jsaTable.userId, userId))
      .orderBy(desc(jsaTable.updatedAt));
    res.json(list);
  } catch (err) {
    req.log.error({ err }, "Failed to list JSAs");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/", async (req, res) => {
  const userId = getUserId(req);
  const parsed = createJsaSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.issues });
    return;
  }
  try {
    // Always load the trade preset — steps and PPE reset to baseline every new doc
    // so each JSA is a genuine fresh hazard assessment, not a copy of yesterday's job.
    const [company] = await db
      .select({ primaryTrade: companiesTable.primaryTrade })
      .from(companiesTable)
      .where(eq(companiesTable.userId, userId))
      .limit(1);
    const tradeKey = company?.primaryTrade?.trim() || "general";
    const preset = getJsaNzTemplate(tradeKey) as unknown as Record<string, unknown>;

    const recentJsas = await db
      .select({ data: jsaTable.data })
      .from(jsaTable)
      .where(eq(jsaTable.userId, userId))
      .orderBy(desc(jsaTable.updatedAt))
      .limit(10);

    const lastWithContent = recentJsas.find(j => {
      const d = j.data as Record<string, unknown> | null | undefined;
      return Array.isArray(d?.steps) && (d.steps as unknown[]).length > 0;
    });

    let baseData: Record<string, unknown> = {};
    let starterKey: string | null = null;

    if (!lastWithContent) {
      // First JSA — full preset
      baseData = { ...preset };
      starterKey = tradeKey;
    } else {
      const prev = (lastWithContent.data ?? {}) as Record<string, unknown>;
      // Sticky: carry forward stable context fields (emergency info, work description, etc.)
      // Safety assessment fields (steps, PPE) always reset to the trade preset so the
      // tradie genuinely reviews hazards for each new job rather than rubber-stamping last time's.
      const PER_JOB = new Set(["date", "location", "supervisor", "supervisorPhone", "workers", "reviewedBy", "permitNumber"]);
      const RESET_TO_PRESET = new Set(["steps", "ppeRequired"]);
      for (const [k, v] of Object.entries(prev)) {
        if (!PER_JOB.has(k) && !RESET_TO_PRESET.has(k)) baseData[k] = v;
      }
      // Inject fresh preset assessment fields
      baseData.steps = preset.steps;
      baseData.ppeRequired = preset.ppeRequired;
      starterKey = tradeKey;
    }

    // Overlay anything the client explicitly submitted
    const submitted = (parsed.data.data ?? {}) as Record<string, unknown>;
    const mergedData: Record<string, unknown> = { ...baseData, ...submitted };
    if (starterKey) mergedData._starterTemplate = starterKey;

    const [jsa] = await db.insert(jsaTable).values({
      userId,
      jobName: parsed.data.jobName,
      siteId: parsed.data.siteId ?? null,
      status: parsed.data.status ?? "draft",
      data: mergedData,
    }).returning();
    res.status(201).json(jsa);
  } catch (err) {
    req.log.error({ err }, "Failed to create JSA");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:id", async (req, res) => {
  const userId = getUserId(req);
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  try {
    const [jsa] = await db
      .select()
      .from(jsaTable)
      .where(and(eq(jsaTable.id, id), eq(jsaTable.userId, userId)));
    if (!jsa) { res.status(404).json({ error: "Not found" }); return; }
    res.json(jsa);
  } catch (err) {
    req.log.error({ err }, "Failed to get JSA");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/:id", async (req, res) => {
  const userId = getUserId(req);
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const parsed = updateJsaSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.issues });
    return;
  }
  try {
    const updates: Record<string, unknown> = {};
    if (parsed.data.jobName !== undefined) updates.jobName = parsed.data.jobName;
    if (parsed.data.siteId !== undefined) updates.siteId = parsed.data.siteId;
    if (parsed.data.status !== undefined) updates.status = parsed.data.status;
    if (parsed.data.data !== undefined) updates.data = parsed.data.data;
    if (Object.keys(updates).length === 0) {
      const [current] = await db.select().from(jsaTable)
        .where(and(eq(jsaTable.id, id), eq(jsaTable.userId, userId)));
      if (!current) { res.status(404).json({ error: "Not found" }); return; }
      res.json(current);
      return;
    }
    // Atomic guard: only update if NOT locked. Reject edits on locked documents —
    // the record is now the permanent audit copy. The `locked_at IS NULL` predicate
    // closes the race between checking lock state and writing.
    const updated = await db
      .update(jsaTable)
      .set(updates)
      .where(and(eq(jsaTable.id, id), eq(jsaTable.userId, userId), isNull(jsaTable.lockedAt)))
      .returning();
    if (updated.length === 0) {
      const [exists] = await db.select({ lockedAt: jsaTable.lockedAt })
        .from(jsaTable).where(and(eq(jsaTable.id, id), eq(jsaTable.userId, userId)));
      if (!exists) { res.status(404).json({ error: "Not found" }); return; }
      res.status(409).json({ error: "Locked", message: "This JSA is locked and cannot be edited. It is the permanent audit record." });
      return;
    }
    res.json(updated[0]);
  } catch (err) {
    req.log.error({ err }, "Failed to update JSA");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /:id/lock — lock a JSA, making it the permanent read-only audit record
router.post("/:id/lock", async (req, res) => {
  const userId = getUserId(req);
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  try {
    // Atomic lock: single conditional update. If 0 rows change, the doc was
    // already locked (or doesn't belong to this user) — no SELECT-then-UPDATE
    // window where two concurrent requests could both lock.
    const updated = await db.update(jsaTable)
      .set({ lockedAt: new Date(), lockedBy: userId, status: "active", snapshotStatus: "pending" })
      .where(and(eq(jsaTable.id, id), eq(jsaTable.userId, userId), isNull(jsaTable.lockedAt)))
      .returning();
    if (updated.length === 0) {
      const [existing] = await db.select({ lockedAt: jsaTable.lockedAt })
        .from(jsaTable).where(and(eq(jsaTable.id, id), eq(jsaTable.userId, userId)));
      if (!existing) { res.status(404).json({ error: "Not found" }); return; }
      res.status(409).json({ error: "Already locked", lockedAt: existing.lockedAt });
      return;
    }
    const jsa = updated[0];
    // Append-only audit row: independent proof of when/by-whom/what-content the
    // lock happened, surviving any later tampering with the jsa row itself.
    const contentHash = computeContentHash({ jobName: jsa.jobName, siteId: jsa.siteId, data: jsa.data });
    await recordLockEvent({ documentType: "jsa", documentId: id, actorId: userId, siteId: jsa.siteId, contentHash });
    res.json(jsa);
    // Generate PDF snapshot in background — does not block the lock response
    const cookieStr = req.headers.cookie ?? "";
    const log = req.log;
    setImmediate(() => { generateAndStoreJsaSnapshot(id, cookieStr, log).catch(() => {}); });
  } catch (err) {
    req.log.error({ err }, "Failed to lock JSA");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/:id", async (req, res) => {
  const userId = getUserId(req);
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  try {
    const [jsa] = await db
      .delete(jsaTable)
      .where(and(eq(jsaTable.id, id), eq(jsaTable.userId, userId)))
      .returning();
    if (!jsa) { res.status(404).json({ error: "Not found" }); return; }
    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Failed to delete JSA");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /:id/share — ensure shareToken exists, return public sign URL
router.post("/:id/share", async (req, res) => {
  const userId = getUserId(req);
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  try {
    const [jsa] = await db.select().from(jsaTable)
      .where(and(eq(jsaTable.id, id), eq(jsaTable.userId, userId)));
    if (!jsa) { res.status(404).json({ error: "Not found" }); return; }
    const data = { ...((jsa.data ?? {}) as Record<string, unknown>) };
    if (typeof data.shareToken !== "string" || data.shareToken.length < 16) {
      data.shareToken = randomBytes(24).toString("hex");
      await db.update(jsaTable).set({ data }).where(eq(jsaTable.id, id));
    }
    const domain = process.env.REPLIT_DOMAINS?.split(",")[0];
    const url = domain
      ? `https://${domain}/jsa-sign/${data.shareToken}`
      : `http://localhost/jsa-sign/${data.shareToken}`;
    res.json({ url });
  } catch (err) {
    req.log.error({ err }, "Failed to generate JSA share link");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
