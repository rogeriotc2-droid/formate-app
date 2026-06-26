import { db, companiesTable } from "@workspace/db";
import { isNull, eq, and, isNotNull } from "drizzle-orm";
import { sendEmail } from "./email";
import { logger } from "./logger";

const TRIAL_DAYS = 30;

function daysSince(date: Date): number {
  return Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
}

function daysLeft(trialStartedAt: Date): number {
  return Math.max(0, TRIAL_DAYS - daysSince(trialStartedAt));
}

function trialSubject(days: number): string {
  if (days === 0) return "Your Formate trial ends today 🔔";
  if (days <= 3) return `${days} day${days === 1 ? "" : "s"} left on your Formate trial`;
  if (days <= 7) return `7 days left on your Formate trial`;
  return "How's Formate going?";
}

function trialBody(company: { mainContactName: string; businessName: string }, daysRemaining: number): string {
  const name = company.mainContactName.split(" ")[0] || "there";
  const billingUrl = "https://formate.co.nz/billing";

  if (daysRemaining >= 7) {
    // Day 3 — welcome check-in
    return `
<p>Hey ${name},</p>
<p>You're 3 days into your Formate trial — how's it going?</p>
<p>Quick reminder of what's in the app:</p>
<ul>
  <li>📋 Fill a safety form in under 60 seconds (sticky fields remember your site, inspector, date)</li>
  <li>📄 Get a clean signed PDF instantly</li>
  <li>🏗️ Site Safe Plan (SSSP) builder with send-for-sign</li>
</ul>
<p>If you haven't filled your first form yet, give it a go — it takes less time than paper.</p>
<p>You've got ${daysRemaining} days left on your free trial. After that, the Founding Member plan is just <strong>$9 NZD/month</strong> — locked in forever.</p>
<p><a href="${billingUrl}" style="background:#e87722;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:bold;">See my plan →</a></p>
<p>Any questions? Just reply to this email.</p>
<p>Cheers,<br>The Formate team</p>
`.trim();
  }

  if (daysRemaining > 1) {
    // 3 days left
    return `
<p>Hey ${name},</p>
<p>Just a heads-up — your Formate trial ends in <strong>${daysRemaining} days</strong>.</p>
<p>To keep using Formate after your trial, jump onto the Founding Member plan: <strong>$9 NZD/month, locked in forever.</strong></p>
<p>No price increases. No contracts. Cancel anytime.</p>
<p><a href="${billingUrl}" style="background:#e87722;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:bold;">Activate my plan →</a></p>
<p>Cheers,<br>The Formate team</p>
`.trim();
  }

  if (daysRemaining === 1) {
    // Tomorrow is last day
    return `
<p>Hey ${name},</p>
<p>Your Formate trial ends <strong>tomorrow</strong>.</p>
<p>If you want to keep your forms, history, and safe plans — activate the Founding Member plan today. <strong>$9 NZD/month, forever.</strong></p>
<p><a href="${billingUrl}" style="background:#e87722;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:bold;">Keep my Formate →</a></p>
<p>Cheers,<br>The Formate team</p>
`.trim();
  }

  // Last day (0)
  return `
<p>Hey ${name},</p>
<p>Your Formate trial ends today.</p>
<p>We'd love to keep you on board. The Founding Member plan is <strong>$9 NZD/month, locked in forever</strong> — that's less than a coffee a week.</p>
<p>Want to continue?</p>
<p><a href="${billingUrl}" style="background:#e87722;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:bold;">Yes, continue with Formate →</a></p>
<p>If you have any feedback or questions, just reply here — we read every email.</p>
<p>Cheers,<br>The Formate team</p>
`.trim();
}

async function runTrialEmails() {
  const companies = await db
    .select()
    .from(companiesTable)
    .where(isNotNull(companiesTable.trialStartedAt));

  let sent = 0;

  for (const company of companies) {
    if (!company.trialStartedAt || !company.mainContactEmail) continue;
    if (company.plan !== "free") continue; // already subscribed

    const elapsed = daysSince(company.trialStartedAt);
    const remaining = daysLeft(company.trialStartedAt);

    const updates: Partial<typeof companiesTable.$inferInsert> = {};
    let subject: string | null = null;
    let html: string | null = null;

    if (elapsed >= 3 && !company.trialEmail3Sent) {
      subject = trialSubject(remaining);
      html = trialBody(company, remaining);
      updates.trialEmail3Sent = true;
    } else if (remaining <= 7 && remaining > 3 && !company.trialEmail7LeftSent) {
      subject = trialSubject(remaining);
      html = trialBody(company, remaining);
      updates.trialEmail7LeftSent = true;
    } else if (remaining <= 3 && remaining > 0 && !company.trialEmail3LeftSent) {
      subject = trialSubject(remaining);
      html = trialBody(company, remaining);
      updates.trialEmail3LeftSent = true;
    } else if (remaining === 0 && !company.trialEmailLastSent) {
      subject = trialSubject(0);
      html = trialBody(company, 0);
      updates.trialEmailLastSent = true;
    }

    if (subject && html && Object.keys(updates).length > 0) {
      try {
        await sendEmail({
          to: company.mainContactEmail,
          subject,
          html,
        });
        await db
          .update(companiesTable)
          .set(updates)
          .where(eq(companiesTable.id, company.id));
        sent++;
        logger.info({ companyId: company.id, subject }, "Trial email sent");
      } catch (err) {
        logger.error({ err, companyId: company.id }, "Failed to send trial email");
      }
    }
  }

  if (sent > 0) {
    logger.info({ sent }, "Trial email cron complete");
  }
}

export function startTrialEmailCron() {
  // Run once on startup, then every 6 hours
  runTrialEmails().catch((err) => logger.error({ err }, "Trial email cron error"));
  setInterval(
    () => runTrialEmails().catch((err) => logger.error({ err }, "Trial email cron error")),
    6 * 60 * 60 * 1000,
  );
  logger.info("Trial email cron started (every 6 hours)");
}
