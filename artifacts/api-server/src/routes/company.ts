import { Router } from "express";
import { db } from "@workspace/db";
import { companiesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { sendEmail } from "../lib/email";

const router = Router();

// Where new-signup alerts are sent. Override via env if it ever changes.
const FOUNDER_NOTIFY_EMAIL = process.env.FOUNDER_NOTIFY_EMAIL ?? "hello@afterglowreviewapp.co.nz";

const emptyToNull = z.preprocess((v) => (v === "" ? null : v), z.string().optional().nullable());
const emptyToNullEmail = z.preprocess((v) => (v === "" ? null : v), z.string().email().optional().nullable());

const upsertSchema = z.object({
  businessName: z.string().min(1),
  tradingName: emptyToNull,
  website: emptyToNull,
  mainContactName: z.string().min(1),
  mainContactPhone: z.string().min(1),
  mainContactEmail: emptyToNullEmail,
  safetyRepName: emptyToNull,
  safetyRepPhone: emptyToNull,
  firstAidName: emptyToNull,
  firstAidPhone: emptyToNull,
  primaryTrade: z.string().min(1),
  // Constrained to the fixed options the onboarding UI offers, so arbitrary
  // strings can never reach the alert email. Empty → null (question is optional).
  signupIntent: z.preprocess(
    (v) => (v === "" || v == null ? null : v),
    z.enum(["builder_asked", "prequal", "from_paper", "from_other_app", "exploring"]).nullable().optional(),
  ),
  country: z.enum(["NZ", "AU", "US"]).default("NZ"),
  state: emptyToNull,
  logoUrl: emptyToNull,
});

// Human-readable labels for the founder alert. Keys match the onboarding options.
const INTENT_LABELS: Record<string, string> = {
  builder_asked: "A builder / GC asked for safety docs",
  prequal: "Renewing or meeting a prequal requirement",
  from_paper: "Sick of doing it on paper",
  from_other_app: "Switching from another app",
  exploring: "Just having a look",
};

// Escape HTML so company-provided strings can't inject markup into the alert email.
function esc(s: string | null | undefined): string {
  return (s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Fire-and-forget founder alert when a brand-new company finishes onboarding.
// Never let an email failure break the signup itself.
async function notifyFounderOfSignup(
  log: { error: (obj: unknown, msg?: string) => void },
  company: { businessName: string; primaryTrade: string; country: string; signupIntent: string | null; mainContactEmail: string | null },
) {
  try {
    const reason = company.signupIntent ? (INTENT_LABELS[company.signupIntent] ?? company.signupIntent) : "Not specified";
    await sendEmail({
      to: FOUNDER_NOTIFY_EMAIL,
      subject: `New Formate signup: ${company.businessName.replace(/[\r\n]+/g, " ")}`,
      html: `
<p><strong>${esc(company.businessName)}</strong> just finished onboarding.</p>
<ul>
  <li><strong>Trade:</strong> ${esc(company.primaryTrade)}</li>
  <li><strong>Country:</strong> ${esc(company.country)}</li>
  <li><strong>Reason for signing up:</strong> ${esc(reason)}</li>
  <li><strong>Contact email:</strong> ${esc(company.mainContactEmail) || "—"}</li>
</ul>
`.trim(),
    });
  } catch (err) {
    log.error({ err }, "Failed to send founder signup alert");
  }
}

// Lightweight PATCH for single-field updates like the logo uploader, so we
// don't force the client to send the entire company profile every time.
// logoUrl must match the normalized capability-URL shape returned by
// /api/storage/uploads/request-url — otherwise reject so we never persist
// broken or attacker-controlled URLs on the company profile.
const LOGO_URL_RE = /^\/objects\/uploads\/[A-Za-z0-9_-]{8,}$/;
const patchSchema = z.object({
  logoUrl: z
    .union([z.string().regex(LOGO_URL_RE, "Invalid logo path"), z.null()])
    .optional(),
});

router.patch("/", async (req, res) => {
  const userId = (req as any).userId as string;
  const parsed = patchSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Validation failed", issues: parsed.error.issues });
  }
  const [updated] = await db
    .update(companiesTable)
    .set(parsed.data)
    .where(eq(companiesTable.userId, userId))
    .returning();
  if (!updated) return res.status(404).json({ error: "No company profile found" });
  return res.json(updated);
});

const TRIAL_DAYS = 30;

router.get("/", async (req, res) => {
  const userId = (req as any).userId as string;
  const [company] = await db.select().from(companiesTable).where(eq(companiesTable.userId, userId));
  if (!company) {
    return res.status(404).json({ error: "No company profile found" });
  }
  const msElapsed = Date.now() - company.createdAt.getTime();
  const daysElapsed = Math.floor(msElapsed / (1000 * 60 * 60 * 24));
  const trialDaysLeft = Math.max(0, TRIAL_DAYS - daysElapsed);
  return res.json({ ...company, trialDaysLeft });
});

router.post("/", async (req, res) => {
  const userId = (req as any).userId as string;
  const parsed = upsertSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Validation failed", issues: parsed.error.issues });
  }

  const data = parsed.data;
  const [existing] = await db.select({ id: companiesTable.id }).from(companiesTable).where(eq(companiesTable.userId, userId));

  if (existing) {
    const [updated] = await db
      .update(companiesTable)
      .set(data)
      .where(eq(companiesTable.userId, userId))
      .returning();
    return res.json(updated);
  }

  const [created] = await db
    .insert(companiesTable)
    .values({ ...data, userId: userId })
    .returning();
  void notifyFounderOfSignup(req.log, created);
  return res.status(201).json(created);
});

export default router;
