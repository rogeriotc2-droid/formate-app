import { Router, type IRouter } from "express";
import { z } from "zod";
import { db, leadsTable } from "@workspace/db";
import { sendEmail } from "../lib/email.js";

const router: IRouter = Router();

// Trim + lowercase email; strip surrounding whitespace from other fields.
// `website` is a honeypot — real users never see/fill it, bots usually do.
const CreateLeadBody = z.object({
  email: z.string().trim().toLowerCase().email("Please enter a valid email"),
  name: z.string().trim().max(120).optional(),
  trade: z.string().trim().max(80).optional(),
  source: z.string().trim().max(60).optional(),
  meta: z.record(z.unknown()).optional(),
  website: z.string().optional(), // honeypot — must be empty
});

// ─── Simple in-memory IP rate limiter ────────────────────────────────────────
// 5 submissions per IP per 10 minutes. Process-local (fine for a single
// api-server instance); upgrade to Redis if/when we horizontally scale.
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 5;
const hits = new Map<string, number[]>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= MAX_PER_WINDOW) {
    hits.set(ip, recent);
    return true;
  }
  recent.push(now);
  hits.set(ip, recent);
  return false;
}

// Periodically prune cold IPs so the map doesn't grow forever.
setInterval(() => {
  const cutoff = Date.now() - WINDOW_MS;
  for (const [ip, ts] of hits) {
    const kept = ts.filter((t) => t > cutoff);
    if (kept.length === 0) hits.delete(ip);
    else hits.set(ip, kept);
  }
}, WINDOW_MS).unref?.();

// ─── Template email config ────────────────────────────────────────────────────
const BASE_URL = "https://formate.co.nz";

const TEMPLATE_CONFIG: Record<
  string,
  { title: string; file: string; subject: string }
> = {
  "free-sssp-template-page": {
    title: "Site-Specific Safety Plan (SSSP)",
    file: "/sssp-template.html",
    subject: "Your free NZ SSSP template",
  },
  "sssp-template": {
    title: "Site-Specific Safety Plan (SSSP)",
    file: "/sssp-template.html",
    subject: "Your free NZ SSSP template",
  },
  "swms-template-page": {
    title: "Safe Work Method Statement (SWMS)",
    file: "/swms-template.html",
    subject: "Your free SWMS template",
  },
  "jsa-template-page": {
    title: "Job Safety Analysis (JSA)",
    file: "/jsa-template.html",
    subject: "Your free JSA template",
  },
};

function buildTemplateEmail(
  config: (typeof TEMPLATE_CONFIG)[string],
): string {
  const url = `${BASE_URL}${config.file}`;
  return `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:#0f172a;padding:24px 32px;">
            <span style="font-size:20px;font-weight:900;letter-spacing:-0.5px;color:#ffffff;">
              FOR<span style="color:#f97316;">MATE</span>
            </span>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;">
            <h1 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#0f172a;line-height:1.3;">
              Here's your free ${config.title} template
            </h1>
            <p style="margin:0 0 24px;font-size:15px;color:#475569;line-height:1.6;">
              Built to WorkSafe NZ guidance — open it, print it, or save as PDF.
            </p>
            <a href="${url}" style="display:inline-block;background:#f97316;color:#ffffff;font-weight:700;font-size:15px;padding:14px 28px;border-radius:8px;text-decoration:none;">
              Open the template →
            </a>
            <hr style="margin:32px 0;border:none;border-top:1px solid #e2e8f0;">
            <p style="margin:0 0 8px;font-size:14px;font-weight:700;color:#0f172a;">
              Tired of filling this out from scratch every job?
            </p>
            <p style="margin:0 0 16px;font-size:14px;color:#475569;line-height:1.6;">
              Formate comes pre-loaded with your trade's hazards and controls.
              Open the app, change only what's different today, sign on your phone, send to the PCBU.
              Under 60 seconds.
            </p>
            <a href="${BASE_URL}/sign-up" style="display:inline-block;background:#0f172a;color:#ffffff;font-weight:700;font-size:14px;padding:12px 24px;border-radius:8px;text-decoration:none;">
              Start 30-day free trial — no credit card
            </a>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 32px 24px;background:#f8fafc;">
            <p style="margin:0;font-size:11px;color:#94a3b8;line-height:1.5;">
              © Afterglow Digital Ltd · Formate · formate.co.nz<br>
              This template is general guidance only. Verify against WorkSafe NZ requirements for your specific site and work.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * POST /leads
 * Public — no auth. Captures a marketing lead from landing page forms,
 * flyer QR codes, etc. Protected by an in-memory per-IP rate limit + a
 * honeypot field to deter bot spam. Sends the relevant template link by
 * email when the source matches a known template page.
 */
router.post("/", async (req, res) => {
  const ip = (req.ip ?? req.socket.remoteAddress ?? "unknown").toString();
  if (rateLimited(ip)) {
    req.log.warn({ ip }, "Lead submission rate-limited");
    res.status(429).json({ error: "Too many submissions — try again in a few minutes." });
    return;
  }

  const parsed = CreateLeadBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
    return;
  }

  // Honeypot hit — silently accept to not tip off bots, but don't persist.
  if (parsed.data.website && parsed.data.website.length > 0) {
    req.log.warn({ ip }, "Lead honeypot triggered — dropped");
    res.status(201).json({ ok: true });
    return;
  }

  try {
    const [lead] = await db.insert(leadsTable).values({
      email: parsed.data.email,
      name: parsed.data.name ?? null,
      trade: parsed.data.trade ?? null,
      source: parsed.data.source ?? "landing",
      meta: parsed.data.meta ?? null,
    }).returning({ id: leadsTable.id });
    req.log.info({ leadId: lead.id, source: parsed.data.source }, "Lead captured");

    // Fire-and-forget template email — don't block the response.
    const templateConfig = parsed.data.source
      ? TEMPLATE_CONFIG[parsed.data.source]
      : undefined;
    if (templateConfig) {
      sendEmail({
        to: parsed.data.email,
        subject: templateConfig.subject,
        html: buildTemplateEmail(templateConfig),
      }).catch((err) => {
        req.log.error({ err, leadId: lead.id }, "Failed to send template email");
      });
    }

    res.status(201).json({ ok: true });
  } catch (err) {
    req.log.error({ err }, "Failed to capture lead");
    res.status(500).json({ error: "Couldn't save — please try again" });
  }
});

export default router;
