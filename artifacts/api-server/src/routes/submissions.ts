import { Router, type Request } from "express";
import { eq, and, sql } from "drizzle-orm";
import { db, submissionsTable, templatesTable, sitesTable, stickyValuesTable, activityTable, companiesTable } from "@workspace/db";
import { z } from "zod/v4";
import { sendEmail } from "../lib/email";
import type { Logger } from "pino";

function getUserId(req: Request): string {
  return (req as Request & { userId?: string }).userId ?? "";
}

type FieldDef = { key: string; label: string; type: string; sticky: boolean };

function renderSubmissionEmail(opts: {
  template: { name: string; category: string; fields: unknown };
  site: { name: string; address: string; pcbu: string };
  submittedBy: string;
  values: Record<string, unknown>;
  notes?: string | null;
  submissionId: number;
}): { subject: string; html: string } {
  const { template, site, submittedBy, values, notes, submissionId } = opts;
  const fields = (template.fields as FieldDef[]) ?? [];
  const today = new Date().toLocaleDateString("en-NZ", { day: "2-digit", month: "short", year: "numeric" });
  const rows = fields.map(f => {
    const raw = values[f.key];
    let display = String(raw ?? "");
    let cellHtml: string;
    if (f.type === "checkbox") {
      cellHtml = raw === true || raw === "true" ? "✓ Yes" : "✗ No";
    } else if (!display) {
      cellHtml = "<em style='color:#94a3b8'>—</em>";
    } else {
      cellHtml = escapeHtml(display).replace(/\n/g, "<br/>");
    }
    return `<tr><td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;font-weight:600;color:#475569;width:40%;">${escapeHtml(f.label)}</td><td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;color:#0f172a;">${cellHtml}</td></tr>`;
  }).join("");

  const subject = `[${site.name}] ${template.name} — ${today}`;
  const html = `<!doctype html><html><body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#0f172a;">
    <div style="max-width:640px;margin:0 auto;background:white;">
      <div style="background:#0F172A;color:white;padding:24px 28px;">
        <div style="font-size:11px;letter-spacing:0.15em;color:#94a3b8;text-transform:uppercase;margin-bottom:4px;">Formate Submission</div>
        <div style="font-size:22px;font-weight:800;">${escapeHtml(template.name)}</div>
        <div style="font-size:13px;color:#cbd5e1;margin-top:4px;">${escapeHtml(template.category)} · ${today}</div>
      </div>
      <div style="padding:24px 28px;border-bottom:1px solid #e2e8f0;background:#f8fafc;">
        <table style="width:100%;font-size:14px;">
          <tr><td style="padding:4px 0;color:#64748b;width:120px;">Site</td><td style="padding:4px 0;font-weight:600;">${escapeHtml(site.name)}</td></tr>
          <tr><td style="padding:4px 0;color:#64748b;">Address</td><td style="padding:4px 0;">${escapeHtml(site.address)}</td></tr>
          <tr><td style="padding:4px 0;color:#64748b;">PCBU</td><td style="padding:4px 0;">${escapeHtml(site.pcbu)}</td></tr>
          <tr><td style="padding:4px 0;color:#64748b;">Submitted by</td><td style="padding:4px 0;font-weight:600;">${escapeHtml(submittedBy)}</td></tr>
        </table>
      </div>
      <div style="padding:8px 28px 24px;">
        <div style="font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:#64748b;font-weight:700;margin:16px 0 8px;">Form contents</div>
        <table style="width:100%;border-collapse:collapse;font-size:14px;">${rows}</table>
        ${notes ? `<div style="margin-top:16px;padding:12px;background:#fff7ed;border-left:3px solid #f97316;border-radius:4px;"><div style="font-size:11px;font-weight:700;text-transform:uppercase;color:#9a3412;letter-spacing:0.08em;margin-bottom:4px;">Notes</div><div style="color:#0f172a;font-size:14px;">${escapeHtml(notes).replace(/\n/g, "<br/>")}</div></div>` : ""}
      </div>
      <div style="padding:20px 28px;background:#0F172A;color:#94a3b8;font-size:12px;text-align:center;">
        Sent by <span style="color:white;font-weight:700;">FOR</span><span style="color:#f97316;font-weight:700;">MATE</span> · Submission #${submissionId}
      </div>
    </div>
  </body></html>`;
  return { subject, html };
}

function escapeHtml(s: string): string {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

async function sendSubmissionEmail(
  recipients: string[],
  payload: { subject: string; html: string },
  log: Logger,
): Promise<void> {
  if (recipients.length === 0) return;
  try {
    await sendEmail({
      to: recipients,
      subject: payload.subject,
      html: payload.html,
    });
    log.info({ recipients }, "Submission email sent");
  } catch (err) {
    log.error({ err, recipients }, "Failed to send submission email");
  }
}

const router = Router();

const submissionInputSchema = z.object({
  templateId: z.number().int(),
  siteId: z.number().int(),
  submittedBy: z.string().min(1),
  status: z.enum(["draft", "submitted"]).optional().default("submitted"),
  values: z.record(z.string(), z.unknown()),
  notes: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  clientTimestamp: z.string().optional(),
});

const submissionUpdateSchema = z.object({
  status: z.enum(["draft", "submitted", "reviewed"]).optional(),
  notes: z.string().optional(),
  reviewedBy: z.string().optional(),
  values: z.record(z.string(), z.unknown()).optional(),
});

router.get("/", async (req, res) => {
  const userId = getUserId(req);
  try {
    const { templateId, siteId, status } = req.query;

    const conditions: ReturnType<typeof eq>[] = [eq(submissionsTable.userId, userId)];
    if (templateId) conditions.push(eq(submissionsTable.templateId, Number(templateId)));
    if (siteId) conditions.push(eq(submissionsTable.siteId, Number(siteId)));
    if (status && typeof status === "string") conditions.push(eq(submissionsTable.status, status));

    const submissions = await db
      .select()
      .from(submissionsTable)
      .where(and(...conditions))
      .orderBy(sql`${submissionsTable.createdAt} desc`);

    res.json(submissions);
  } catch (err) {
    req.log.error({ err }, "Failed to list submissions");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/", async (req, res) => {
  const userId = getUserId(req);
  const parsed = submissionInputSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.issues });
    return;
  }
  try {
    const { templateId, siteId, submittedBy, status, values, notes, latitude, longitude, clientTimestamp } = parsed.data;

    const [template] = await db
      .select()
      .from(templatesTable)
      .where(and(eq(templatesTable.id, templateId), eq(templatesTable.userId, userId)));
    if (!template) { res.status(400).json({ error: "Template not found" }); return; }

    const [site] = await db
      .select()
      .from(sitesTable)
      .where(and(eq(sitesTable.id, siteId), eq(sitesTable.userId, userId)));
    if (!site) { res.status(400).json({ error: "Site not found" }); return; }

    const [submission] = await db.insert(submissionsTable).values({
      userId,
      templateId,
      templateName: template.name,
      siteId,
      siteName: site.name,
      submittedBy,
      status: status ?? "submitted",
      values,
      notes,
      latitude,
      longitude,
      clientTimestamp: clientTimestamp ? new Date(clientTimestamp) : undefined,
    }).returning();

    await db.update(templatesTable)
      .set({ submissionCount: (template.submissionCount ?? 0) + 1 })
      .where(and(eq(templatesTable.id, templateId), eq(templatesTable.userId, userId)));

    const fields = (template.fields as Array<{ key: string; sticky: boolean }>) ?? [];
    const stickyFields = fields.filter(f => f.sticky).map(f => f.key);
    if (stickyFields.length > 0) {
      const valuesMap = values as Record<string, unknown>;
      const stickyValues: Record<string, unknown> = {};
      for (const key of stickyFields) {
        if (key in valuesMap) stickyValues[key] = valuesMap[key];
      }
      const [existing] = await db.select().from(stickyValuesTable).where(eq(stickyValuesTable.templateId, templateId));
      if (existing) {
        await db.update(stickyValuesTable)
          .set({ values: { ...(existing.values as Record<string, unknown>), ...stickyValues } })
          .where(eq(stickyValuesTable.templateId, templateId));
      } else {
        await db.insert(stickyValuesTable).values({ templateId, values: stickyValues });
      }
    }

    await db.insert(activityTable).values({
      userId,
      type: "submission_created",
      description: `${submittedBy} submitted ${template.name}`,
      entityId: submission.id,
      entityName: template.name,
    });

    const recipients = new Set<string>();
    if (site.principalEmail) recipients.add(site.principalEmail);
    if (template.extraRecipientEmail) recipients.add(template.extraRecipientEmail);
    const [company] = await db.select().from(companiesTable).where(eq(companiesTable.userId, userId));
    if (company?.mainContactEmail) recipients.add(company.mainContactEmail);

    if (recipients.size > 0) {
      const payload = renderSubmissionEmail({
        template,
        site,
        submittedBy,
        values,
        notes,
        submissionId: submission.id,
      });
      void sendSubmissionEmail(Array.from(recipients), payload, req.log);
    } else {
      req.log.info({ submissionId: submission.id }, "No recipients for submission email");
    }

    res.status(201).json(submission);
  } catch (err) {
    req.log.error({ err }, "Failed to create submission");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:id", async (req, res) => {
  const userId = getUserId(req);
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  try {
    const [submission] = await db
      .select()
      .from(submissionsTable)
      .where(and(eq(submissionsTable.id, id), eq(submissionsTable.userId, userId)));
    if (!submission) { res.status(404).json({ error: "Not found" }); return; }
    res.json(submission);
  } catch (err) {
    req.log.error({ err }, "Failed to get submission");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/:id", async (req, res) => {
  const userId = getUserId(req);
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const parsed = submissionUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.issues });
    return;
  }
  try {
    const updateData: Record<string, unknown> = { ...parsed.data };
    if (parsed.data.status === "reviewed" && parsed.data.reviewedBy) {
      updateData.reviewedAt = new Date();
    }

    const [submission] = await db
      .update(submissionsTable)
      .set(updateData)
      .where(and(eq(submissionsTable.id, id), eq(submissionsTable.userId, userId)))
      .returning();
    if (!submission) { res.status(404).json({ error: "Not found" }); return; }

    if (parsed.data.status === "reviewed") {
      await db.insert(activityTable).values({
        userId,
        type: "submission_reviewed",
        description: `${parsed.data.reviewedBy ?? "Someone"} reviewed ${submission.templateName}`,
        entityId: submission.id,
        entityName: submission.templateName,
      });
    }

    res.json(submission);
  } catch (err) {
    req.log.error({ err }, "Failed to update submission");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/:id", async (req, res) => {
  const userId = getUserId(req);
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  try {
    const [deleted] = await db
      .delete(submissionsTable)
      .where(and(eq(submissionsTable.id, id), eq(submissionsTable.userId, userId)))
      .returning();
    if (!deleted) { res.status(404).json({ error: "Not found" }); return; }
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete submission");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
