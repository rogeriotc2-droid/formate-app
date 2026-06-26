import { Router, type Request } from "express";
import { eq, desc, and, isNull } from "drizzle-orm";
import { randomBytes } from "node:crypto";
import { db, swmsTable, companiesTable } from "@workspace/db";
import { z } from "zod";
import { sendEmail } from "../lib/email";
import { getSwmsTemplate } from "../lib/swms-templates";
import { generateAndStoreSwmsSnapshot } from "./swms-pdf";
import { computeContentHash, recordLockEvent } from "../lib/audit";

function getUserId(req: Request): string {
  return (req as Request & { userId?: string }).userId ?? "";
}

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

const createSwmsSchema = z.object({
  activityName: z.string().min(1),
  siteId: z.number().optional().nullable(),
  status: z.enum(["draft", "active", "archived"]).optional(),
  data: z.record(z.unknown()).optional(),
});

const updateSwmsSchema = z.object({
  activityName: z.string().min(1).optional(),
  siteId: z.number().optional().nullable(),
  status: z.enum(["draft", "active", "archived"]).optional(),
  data: z.record(z.unknown()).optional(),
});

router.get("/", async (req, res) => {
  const userId = getUserId(req);
  try {
    const list = await db
      .select()
      .from(swmsTable)
      .where(eq(swmsTable.userId, userId))
      .orderBy(desc(swmsTable.updatedAt));
    res.json(list);
  } catch (err) {
    req.log.error({ err }, "Failed to list SWMS");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/", async (req, res) => {
  const userId = getUserId(req);
  const parsed = createSwmsSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.issues });
    return;
  }
  try {
    // Always load the trade preset — steps, PPE, licences, and plant reset to baseline
    // every new doc so each SWMS is a genuine fresh hazard assessment for the new site.
    const [company] = await db
      .select({ primaryTrade: companiesTable.primaryTrade })
      .from(companiesTable)
      .where(eq(companiesTable.userId, userId))
      .limit(1);
    const tradeKey = company?.primaryTrade?.trim() || "general";
    const preset = getSwmsTemplate(tradeKey) as unknown as Record<string, unknown>;

    const recentSwms = await db
      .select({ data: swmsTable.data })
      .from(swmsTable)
      .where(eq(swmsTable.userId, userId))
      .orderBy(desc(swmsTable.updatedAt))
      .limit(10);

    const lastWithContent = recentSwms.find(s => {
      const d = s.data as Record<string, unknown> | null | undefined;
      return Array.isArray(d?.steps) && (d.steps as unknown[]).length > 0;
    });

    let baseData: Record<string, unknown> = {};
    let starterKey: string | null = null;

    if (!lastWithContent) {
      // First SWMS — full preset
      baseData = { ...preset };
      starterKey = tradeKey;
    } else {
      const prev = (lastWithContent.data ?? {}) as Record<string, unknown>;
      // Sticky: carry forward stable context fields (emergency info, PCBU, hrceType, etc.)
      // Safety assessment fields always reset to the trade preset so the tradie genuinely
      // reviews hazards and controls for each new site rather than copying the last job.
      const PER_JOB = new Set(["workLocation", "projectName", "startDate", "principalContractor", "principalContractorEmail", "supervisor", "supervisorPhone", "workers", "preparedBy", "reviewDate"]);
      const RESET_TO_PRESET = new Set(["steps", "ppeRequired", "licencesRequired", "plantsEquipment"]);
      for (const [k, v] of Object.entries(prev)) {
        if (!PER_JOB.has(k) && !RESET_TO_PRESET.has(k)) baseData[k] = v;
      }
      // Inject fresh preset assessment fields
      baseData.steps = preset.steps;
      baseData.ppeRequired = preset.ppeRequired;
      baseData.licencesRequired = preset.licencesRequired;
      baseData.plantsEquipment = preset.plantsEquipment;
      starterKey = tradeKey;
    }

    // Overlay anything the client explicitly submitted
    const submitted = (parsed.data.data ?? {}) as Record<string, unknown>;
    const mergedData: Record<string, unknown> = { ...baseData, ...submitted };
    if (starterKey) mergedData._starterTemplate = starterKey;

    const [swms] = await db.insert(swmsTable).values({
      userId,
      activityName: parsed.data.activityName,
      siteId: parsed.data.siteId ?? null,
      status: parsed.data.status ?? "draft",
      data: mergedData,
    }).returning();
    res.status(201).json(swms);
  } catch (err) {
    req.log.error({ err }, "Failed to create SWMS");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:id", async (req, res) => {
  const userId = getUserId(req);
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  try {
    const [swms] = await db
      .select()
      .from(swmsTable)
      .where(and(eq(swmsTable.id, id), eq(swmsTable.userId, userId)));
    if (!swms) { res.status(404).json({ error: "Not found" }); return; }
    res.json(swms);
  } catch (err) {
    req.log.error({ err }, "Failed to get SWMS");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/:id", async (req, res) => {
  const userId = getUserId(req);
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const parsed = updateSwmsSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.issues });
    return;
  }
  try {
    const updates: Record<string, unknown> = {};
    if (parsed.data.activityName !== undefined) updates.activityName = parsed.data.activityName;
    if (parsed.data.siteId !== undefined) updates.siteId = parsed.data.siteId;
    if (parsed.data.status !== undefined) updates.status = parsed.data.status;
    if (parsed.data.data !== undefined) updates.data = parsed.data.data;
    if (Object.keys(updates).length === 0) {
      const [current] = await db.select().from(swmsTable)
        .where(and(eq(swmsTable.id, id), eq(swmsTable.userId, userId)));
      if (!current) { res.status(404).json({ error: "Not found" }); return; }
      res.json(current);
      return;
    }
    // Atomic guard: only update if NOT locked. The `locked_at IS NULL` predicate
    // closes the race between checking lock state and writing.
    const updated = await db
      .update(swmsTable)
      .set(updates)
      .where(and(eq(swmsTable.id, id), eq(swmsTable.userId, userId), isNull(swmsTable.lockedAt)))
      .returning();
    if (updated.length === 0) {
      const [exists] = await db.select({ lockedAt: swmsTable.lockedAt })
        .from(swmsTable).where(and(eq(swmsTable.id, id), eq(swmsTable.userId, userId)));
      if (!exists) { res.status(404).json({ error: "Not found" }); return; }
      res.status(409).json({ error: "Locked", message: "This SWMS is locked and cannot be edited. It is the permanent audit record." });
      return;
    }
    res.json(updated[0]);
  } catch (err) {
    req.log.error({ err }, "Failed to update SWMS");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /:id/lock — lock a SWMS, making it the permanent read-only audit record
router.post("/:id/lock", async (req, res) => {
  const userId = getUserId(req);
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  try {
    // Atomic lock: single conditional update. If 0 rows change, the doc was
    // already locked (or doesn't belong to this user).
    const updated = await db.update(swmsTable)
      .set({ lockedAt: new Date(), lockedBy: userId, status: "active", snapshotStatus: "pending" })
      .where(and(eq(swmsTable.id, id), eq(swmsTable.userId, userId), isNull(swmsTable.lockedAt)))
      .returning();
    if (updated.length === 0) {
      const [existing] = await db.select({ lockedAt: swmsTable.lockedAt })
        .from(swmsTable).where(and(eq(swmsTable.id, id), eq(swmsTable.userId, userId)));
      if (!existing) { res.status(404).json({ error: "Not found" }); return; }
      res.status(409).json({ error: "Already locked", lockedAt: existing.lockedAt });
      return;
    }
    const swms = updated[0];
    const contentHash = computeContentHash({ activityName: swms.activityName, siteId: swms.siteId, data: swms.data });
    await recordLockEvent({ documentType: "swms", documentId: id, actorId: userId, siteId: swms.siteId, contentHash });
    res.json(swms);
    // Generate PDF snapshot in background — does not block the lock response
    const cookieStr = req.headers.cookie ?? "";
    const log = req.log;
    setImmediate(() => { generateAndStoreSwmsSnapshot(id, cookieStr, log).catch(() => {}); });
  } catch (err) {
    req.log.error({ err }, "Failed to lock SWMS");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/:id", async (req, res) => {
  const userId = getUserId(req);
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  try {
    const [swms] = await db
      .delete(swmsTable)
      .where(and(eq(swmsTable.id, id), eq(swmsTable.userId, userId)))
      .returning();
    if (!swms) { res.status(404).json({ error: "Not found" }); return; }
    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Failed to delete SWMS");
    res.status(500).json({ error: "Internal server error" });
  }
});

const sendEmailSchema = z.object({
  recipientEmail: z.string().email(),
  recipientName: z.string().optional(),
});

router.post("/:id/send-email", async (req, res) => {
  const userId = getUserId(req);
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const parsed = sendEmailSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.issues });
    return;
  }

  try {
    const [swms] = await db
      .select()
      .from(swmsTable)
      .where(and(eq(swmsTable.id, id), eq(swmsTable.userId, userId)));
    if (!swms) { res.status(404).json({ error: "Not found" }); return; }

    const data = (swms.data ?? {}) as Record<string, unknown>;
    const activityName = swms.activityName;
    const pcbu = (data.pcbu as string) ?? "Formate User";
    const principalContractor = (data.principalContractor as string) ?? "";
    const workLocation = (data.workLocation as string) ?? "Not specified";
    const startDate = (data.startDate as string) ?? "";
    const supervisor = (data.supervisor as string) ?? "";
    const supervisorPhone = (data.supervisorPhone as string) ?? "";

    const domains = process.env.REPLIT_DOMAINS?.split(",")[0];
    const swmsUrl = domains
      ? `https://${domains}/swms/${id}`
      : `http://localhost/swms/${id}`;

    const recipientName = parsed.data.recipientName ?? principalContractor ?? "Site Manager";
    await sendEmail({
      to: parsed.data.recipientEmail,
      subject: `SWMS: ${activityName} — from ${pcbu}`,
      html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;font-family:Inter,Arial,sans-serif;background:#f8fafc;">
  <div style="max-width:600px;margin:32px auto;background:#fff;border-radius:8px;overflow:hidden;border:1px solid #e2e8f0;">
    <div style="background:#0F172A;padding:24px 32px;">
      <div style="font-size:22px;font-weight:900;letter-spacing:-0.5px;"><span style="color:#ffffff;">FOR</span><span style="color:#f97316;">MATE</span></div>
      <div style="color:#94a3b8;font-size:13px;margin-top:4px;">Safe Work Method Statement (SWMS)</div>
    </div>
    <div style="padding:32px;">
      <p style="margin:0 0 8px;color:#64748b;font-size:14px;">Hi ${esc(recipientName)},</p>
      <p style="margin:0 0 24px;color:#1e293b;font-size:16px;line-height:1.6;">
        <strong>${esc(pcbu)}</strong> has sent you a Safe Work Method Statement (SWMS) for review before high-risk construction work commences.
      </p>

      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:20px;margin-bottom:24px;">
        <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:#94a3b8;margin-bottom:12px;">SWMS Details</div>
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="padding:6px 0;color:#64748b;font-size:14px;width:160px;">Activity</td>
            <td style="padding:6px 0;color:#1e293b;font-size:14px;font-weight:600;">${esc(activityName)}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;color:#64748b;font-size:14px;">Work location</td>
            <td style="padding:6px 0;color:#1e293b;font-size:14px;">${esc(workLocation)}</td>
          </tr>
          ${startDate ? `<tr>
            <td style="padding:6px 0;color:#64748b;font-size:14px;">Start date</td>
            <td style="padding:6px 0;color:#1e293b;font-size:14px;">${esc(startDate)}</td>
          </tr>` : ""}
          ${principalContractor ? `<tr>
            <td style="padding:6px 0;color:#64748b;font-size:14px;">Principal contractor</td>
            <td style="padding:6px 0;color:#1e293b;font-size:14px;">${esc(principalContractor)}</td>
          </tr>` : ""}
          <tr>
            <td style="padding:6px 0;color:#64748b;font-size:14px;">Submitted by</td>
            <td style="padding:6px 0;color:#1e293b;font-size:14px;">${esc(pcbu)}${supervisor ? ` — ${esc(supervisor)}` : ""}</td>
          </tr>
          ${supervisorPhone ? `<tr>
            <td style="padding:6px 0;color:#64748b;font-size:14px;">Contact phone</td>
            <td style="padding:6px 0;color:#1e293b;font-size:14px;">${esc(supervisorPhone)}</td>
          </tr>` : ""}
        </table>
      </div>

      <a href="${swmsUrl}" style="display:inline-block;background:#f97316;color:#fff;font-weight:700;font-size:15px;padding:14px 28px;border-radius:6px;text-decoration:none;margin-bottom:24px;">
        View Full SWMS →
      </a>

      <p style="margin:24px 0 0;color:#94a3b8;font-size:13px;line-height:1.6;">
        Questions? Reply to this email or contact ${esc(pcbu)} directly${supervisorPhone ? ` on ${esc(supervisorPhone)}` : ""}.
      </p>
    </div>
    <div style="background:#0F172A;padding:16px 32px;border-top:1px solid #1e293b;">
      <p style="margin:0;color:#94a3b8;font-size:12px;"><span style="color:#ffffff;font-weight:700;">FOR</span><span style="color:#f97316;font-weight:700;">MATE</span> · AU WHS Act 2011 compliant · <a href="${swmsUrl}" style="color:#f97316;">View SWMS online</a> · <a href="https://smart-form-fill.replit.app" style="color:#64748b;">formate.co.nz</a></p>
    </div>
  </div>
</body>
</html>`,
    });

    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Failed to send SWMS email");
    res.status(500).json({ error: "Failed to send email" });
  }
});

// POST /:id/share — ensure shareToken exists, return public sign URL
router.post("/:id/share", async (req, res) => {
  const userId = getUserId(req);
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  try {
    const [swms] = await db.select().from(swmsTable)
      .where(and(eq(swmsTable.id, id), eq(swmsTable.userId, userId)));
    if (!swms) { res.status(404).json({ error: "Not found" }); return; }
    const data = { ...((swms.data ?? {}) as Record<string, unknown>) };
    if (typeof data.shareToken !== "string" || data.shareToken.length < 16) {
      data.shareToken = randomBytes(24).toString("hex");
      await db.update(swmsTable).set({ data }).where(eq(swmsTable.id, id));
    }
    const domain = process.env.REPLIT_DOMAINS?.split(",")[0];
    const url = domain
      ? `https://${domain}/swms-sign/${data.shareToken}`
      : `http://localhost/swms-sign/${data.shareToken}`;
    res.json({ url });
  } catch (err) {
    req.log.error({ err }, "Failed to generate SWMS share link");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
