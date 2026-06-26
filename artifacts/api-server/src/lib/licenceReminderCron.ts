import { db, licencesTable, companiesTable } from "@workspace/db";
import { isNotNull, isNull, eq, and } from "drizzle-orm";
import { sendEmail } from "./email";
import { logger } from "./logger";

const WINDOWS = ["30", "7", "1", "expired"] as const;
type Window = (typeof WINDOWS)[number];

function windowFor(expiry: string): Window | null {
  const days = daysUntil(expiry);
  if (days <= 0) return "expired"; // on the expiry day and after
  if (days <= 1) return "1"; // 1 day out (tomorrow)
  if (days <= 7) return "7";
  if (days <= 30) return "30";
  return null;
}

function rank(w: Window | null): number {
  return w === null ? -1 : WINDOWS.indexOf(w);
}

function daysUntil(expiry: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const exp = new Date(`${expiry}T00:00:00`);
  return Math.floor((exp.getTime() - today.getTime()) / 86400000);
}

function subjectFor(w: Window, name: string, worker: string, days: number): string {
  if (w === "expired") return days === 0 ? `Expires today: ${name} — ${worker}` : `Expired: ${name} — ${worker}`;
  if (w === "1") return `Expires tomorrow: ${name} — ${worker}`;
  if (w === "7") return `7 days left: ${name} — ${worker}`;
  return `Expiring soon: ${name} — ${worker}`;
}

function bodyFor(
  w: Window,
  licence: { workerName: string; name: string; recordType: string; referenceNumber: string | null; expiryDate: string | null },
): string {
  const days = licence.expiryDate ? daysUntil(licence.expiryDate) : 0;
  const kind = licence.recordType === "training" ? "training record" : "licence";
  const ref = licence.referenceNumber ? `<p style="color:#666;margin:4px 0;">Reference: ${licence.referenceNumber}</p>` : "";
  const headline =
    w === "expired"
      ? days === 0
        ? `<strong>${licence.name}</strong> for <strong>${licence.workerName}</strong> <strong style="color:#dc2626;">expires today</strong> (${licence.expiryDate}).`
        : `<strong>${licence.name}</strong> for <strong>${licence.workerName}</strong> has <strong style="color:#dc2626;">expired</strong>${licence.expiryDate ? ` (${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"} ago)` : ""}.`
      : `<strong>${licence.name}</strong> for <strong>${licence.workerName}</strong> expires in <strong>${days} day${days === 1 ? "" : "s"}</strong> (${licence.expiryDate}).`;

  return `
<p>Hi,</p>
<p>This is an automatic reminder from Formate about an expiring ${kind}.</p>
<p>${headline}</p>
${ref}
<p>Make sure it gets renewed before anyone relies on it on site.</p>
<p><a href="https://formate.co.nz/licences" style="background:#e87722;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:bold;">View in Formate →</a></p>
<p>Cheers,<br>The Formate team</p>
`.trim();
}

async function runLicenceReminders() {
  const licences = await db
    .select()
    .from(licencesTable)
    .where(and(eq(licencesTable.remindersEnabled, true), isNotNull(licencesTable.expiryDate)));

  if (licences.length === 0) return;

  const companies = await db.select().from(companiesTable);
  const emailByUser = new Map<string, string>();
  for (const c of companies) {
    if (c.userId && c.mainContactEmail) emailByUser.set(c.userId, c.mainContactEmail);
  }

  let sent = 0;

  for (const l of licences) {
    if (!l.expiryDate) continue;
    const current = windowFor(l.expiryDate);

    // Pushed back beyond 30 days (e.g. renewed) — re-arm future reminders.
    if (current === null) {
      if (l.lastReminderWindow !== null) {
        await db.update(licencesTable).set({ lastReminderWindow: null }).where(eq(licencesTable.id, l.id));
      }
      continue;
    }

    // Already notified at this (or a more urgent) window.
    const prev = l.lastReminderWindow as Window | null;
    if (rank(current) <= rank(prev)) continue;

    const to =
      (l.reminderEmail && l.reminderEmail.trim()) || (l.userId ? emailByUser.get(l.userId) : undefined);
    if (!to) continue; // No recipient yet — leave window unset so it sends once an email exists.

    // Claim this window with a compare-and-swap so a concurrent run can't also
    // send it. Only the run whose stored window still matches `prev` wins.
    const claimed = await db
      .update(licencesTable)
      .set({ lastReminderWindow: current })
      .where(
        and(
          eq(licencesTable.id, l.id),
          prev === null ? isNull(licencesTable.lastReminderWindow) : eq(licencesTable.lastReminderWindow, prev),
        ),
      )
      .returning();
    if (claimed.length === 0) continue; // Lost the race; another run is handling it.

    const days = daysUntil(l.expiryDate);
    try {
      await sendEmail({
        to,
        subject: subjectFor(current, l.name, l.workerName, days),
        html: bodyFor(current, l),
      });
      sent++;
      logger.info({ licenceId: l.id, window: current }, "Licence reminder sent");
    } catch (err) {
      // Roll the window back so the next run retries instead of silently skipping.
      await db.update(licencesTable).set({ lastReminderWindow: prev }).where(eq(licencesTable.id, l.id));
      logger.error({ err, licenceId: l.id }, "Failed to send licence reminder");
    }
  }

  if (sent > 0) {
    logger.info({ sent }, "Licence reminder cron complete");
  }
}

export function startLicenceReminderCron() {
  // Run once on startup, then every 12 hours.
  runLicenceReminders().catch((err) => logger.error({ err }, "Licence reminder cron error"));
  setInterval(
    () => runLicenceReminders().catch((err) => logger.error({ err }, "Licence reminder cron error")),
    12 * 60 * 60 * 1000,
  );
  logger.info("Licence reminder cron started (every 12 hours)");
}
