import { Router, type Request } from "express";
import { inArray, eq, sql } from "drizzle-orm";
import {
  db,
  usersTable,
  companiesTable,
  ssspsTable,
  sitesTable,
  submissionsTable,
  templatesTable,
  swmsTable,
  jsaTable,
  activityTable,
  licencesTable,
} from "@workspace/db";
import { getJsaNzTemplate } from "../lib/jsa-templates-nz";
import { getSwmsTemplate } from "../lib/swms-templates";

// Founder/admin accounts permitted to run one-time recovery operations.
export const ADMIN_EMAILS = new Set<string>(["rogeriotc2@gmail.com"]);

// Orphaned legacy (pre-auth-migration) owner ids for RTC Concrete Grinding Ltd.
// These rows lost their owner when the company profiles were wiped during a
// publish. Recovery re-points them to the admin's new internal account id.
export const LEGACY_RTC_USER_IDS = [
  "user_3EDDOp7pwvdpGQSbBmm9mueQEDm",
  "user_3DwQ8bsZ44hNbdTcpGFb5YTXntp",
];

function getUserId(req: Request): string {
  return (req as Request & { userId?: string }).userId ?? "";
}

// Cheap guard: is there any orphaned RTC data still to recover? Lets the
// per-request /me trigger short-circuit after the one-time recovery is done.
export async function hasLegacyRtcData(): Promise<boolean> {
  const [row] = await db
    .select({ id: ssspsTable.id })
    .from(ssspsTable)
    .where(inArray(ssspsTable.userId, LEGACY_RTC_USER_IDS))
    .limit(1);
  return Boolean(row);
}

// Re-link every orphaned RTC record to the given internal account id.
// Idempotent: once the legacy ids own no rows, this is a no-op. Returns
// per-table counts of rows moved.
export async function recoverLegacyRtcData(
  userId: string,
): Promise<Record<string, number>> {
  return db.transaction(async (tx) => {
    const tables = {
      sssps: ssspsTable,
      sites: sitesTable,
      submissions: submissionsTable,
      templates: templatesTable,
      swms: swmsTable,
      jsa: jsaTable,
      activity: activityTable,
      licences: licencesTable,
    } as const;

    const counts: Record<string, number> = {};
    for (const [name, table] of Object.entries(tables)) {
      const updated = await tx
        .update(table)
        .set({ userId })
        .where(inArray(table.userId, LEGACY_RTC_USER_IDS))
        .returning({ id: table.id });
      counts[name] = updated.length;
    }
    return counts;
  });
}

// Verify the calling session belongs to a founder/admin account. Returns the
// admin user row on success, or null after sending a 401/403 response.
async function requireAdmin(
  req: Request,
  res: import("express").Response,
): Promise<{ id: string; email: string } | null> {
  const userId = getUserId(req);
  const [me] = await db
    .select({ id: usersTable.id, email: usersTable.email })
    .from(usersTable)
    .where(eq(usersTable.id, userId))
    .limit(1);
  if (!me) {
    res.status(401).json({ error: "Unauthorized" });
    return null;
  }
  if (!ADMIN_EMAILS.has(me.email.toLowerCase())) {
    res.status(403).json({ error: "Forbidden" });
    return null;
  }
  return me;
}

const router = Router();

// Admin-only customer health overview. Read-only: aggregates per-customer
// usage signals so the founder can spot at-risk accounts (signed up but
// inactive) before they churn. No customer data is modified.
router.get("/customers", async (req, res) => {
  const me = await requireAdmin(req, res);
  if (!me) return;

  try {
    // Per-table counts grouped by owner. Done as small grouped aggregates so
    // the whole overview is a handful of cheap queries regardless of table size.
    const countBy = async (
      table:
        | typeof ssspsTable
        | typeof submissionsTable
        | typeof sitesTable
        | typeof licencesTable,
    ): Promise<Map<string, number>> => {
      const rows = await db
        .select({
          userId: table.userId,
          count: sql<number>`cast(count(*) as int)`,
        })
        .from(table)
        .groupBy(table.userId);
      const map = new Map<string, number>();
      for (const r of rows) if (r.userId) map.set(r.userId, r.count);
      return map;
    };

    const [users, companies, ssspCounts, submissionCounts, siteCounts, licenceCounts, lastActivityRows, lastSsspRows, lastSubmissionRows] =
      await Promise.all([
        db
          .select({
            id: usersTable.id,
            email: usersTable.email,
            name: usersTable.name,
            createdAt: usersTable.createdAt,
          })
          .from(usersTable),
        db
          .select({
            userId: companiesTable.userId,
            businessName: companiesTable.businessName,
            country: companiesTable.country,
            plan: companiesTable.plan,
            trialStartedAt: companiesTable.trialStartedAt,
          })
          .from(companiesTable),
        countBy(ssspsTable),
        countBy(submissionsTable),
        countBy(sitesTable),
        countBy(licencesTable),
        db
          .select({
            userId: activityTable.userId,
            lastAt: sql<string | null>`max(${activityTable.createdAt})`,
          })
          .from(activityTable)
          .groupBy(activityTable.userId),
        db
          .select({
            userId: ssspsTable.userId,
            lastAt: sql<string | null>`max(${ssspsTable.updatedAt})`,
          })
          .from(ssspsTable)
          .groupBy(ssspsTable.userId),
        db
          .select({
            userId: submissionsTable.userId,
            lastAt: sql<string | null>`max(${submissionsTable.createdAt})`,
          })
          .from(submissionsTable)
          .groupBy(submissionsTable.userId),
      ]);

    const companyByUser = new Map(companies.map((c) => [c.userId, c]));
    // Best "last active" signal: the most recent timestamp across logged
    // activity, SSSP edits, and form submissions. The activity table doesn't
    // capture every meaningful action, so folding in SSSP/submission times
    // avoids classifying an active customer as "red" too early.
    const lastSignalByUser = new Map<string, number>();
    const foldSignal = (
      rows: Array<{ userId: string | null; lastAt: string | null }>,
    ) => {
      for (const r of rows) {
        if (!r.userId || !r.lastAt) continue;
        const ms = new Date(r.lastAt).getTime();
        const prev = lastSignalByUser.get(r.userId) ?? 0;
        if (ms > prev) lastSignalByUser.set(r.userId, ms);
      }
    };
    foldSignal(lastActivityRows);
    foldSignal(lastSsspRows);
    foldSignal(lastSubmissionRows);

    const now = Date.now();
    const DAY = 24 * 60 * 60 * 1000;

    const customers = users.map((u) => {
      const company = companyByUser.get(u.id);
      const ssspCount = ssspCounts.get(u.id) ?? 0;
      const submissionCount = submissionCounts.get(u.id) ?? 0;
      const siteCount = siteCounts.get(u.id) ?? 0;
      const licenceCount = licenceCounts.get(u.id) ?? 0;

      // "Last active" = most recent signal we have (activity / SSSP edit /
      // submission), with the signup time as a floor so a brand-new account
      // isn't shown as stale.
      const signupMs = u.createdAt ? new Date(u.createdAt).getTime() : now;
      const signalMs = lastSignalByUser.get(u.id) ?? 0;
      const lastActiveMs = Math.max(signupMs, signalMs);

      const daysSinceSignup = Math.floor((now - signupMs) / DAY);
      const daysSinceActive = Math.floor((now - lastActiveMs) / DAY);

      // Activation = reached first real value: created a safety plan or sent a
      // form. This is the "aha" moment that predicts retention.
      const activated = ssspCount > 0 || submissionCount > 0;
      const onboarded = Boolean(company);

      // Health: red = at risk, amber = watch, green = healthy.
      let health: "green" | "amber" | "red";
      if (!activated) {
        // Signed up but no real use yet. Fresh (≤2 days) = still onboarding
        // (amber); older with nothing done = at risk (red).
        health = daysSinceSignup <= 2 ? "amber" : "red";
      } else if (daysSinceActive <= 7) {
        health = "green";
      } else if (daysSinceActive <= 14) {
        health = "amber";
      } else {
        health = "red";
      }

      return {
        userId: u.id,
        email: u.email,
        name: u.name,
        businessName: company?.businessName ?? null,
        country: company?.country ?? null,
        plan: company?.plan ?? null,
        onboarded,
        activated,
        ssspCount,
        submissionCount,
        siteCount,
        licenceCount,
        signupAt: u.createdAt,
        lastActiveAt: new Date(lastActiveMs).toISOString(),
        daysSinceSignup,
        daysSinceActive,
        health,
      };
    });

    // Most-at-risk first (red, then amber, then green), then most recently
    // active within each band so the founder's eye lands on what matters.
    const rank = { red: 0, amber: 1, green: 2 } as const;
    customers.sort((a, b) => {
      if (rank[a.health] !== rank[b.health]) return rank[a.health] - rank[b.health];
      return b.lastActiveAt.localeCompare(a.lastActiveAt);
    });

    const summary = {
      total: customers.length,
      green: customers.filter((c) => c.health === "green").length,
      amber: customers.filter((c) => c.health === "amber").length,
      red: customers.filter((c) => c.health === "red").length,
      activated: customers.filter((c) => c.activated).length,
    };

    res.json({ summary, customers });
  } catch (err) {
    req.log.error({ err }, "Failed to load admin customer overview");
    res.status(500).json({ error: "Internal server error" });
  }
});

// One-time recovery: re-link orphaned RTC records to the calling admin account.
// Gated to a fixed admin-email allowlist and a fixed set of legacy owner ids,
// so it cannot be abused to claim another tenant's data. Idempotent.
router.post("/recover-legacy", async (req, res) => {
  const userId = getUserId(req);
  try {
    const [me] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .limit(1);

    if (!me || !ADMIN_EMAILS.has(me.email.toLowerCase())) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    const recovered = await recoverLegacyRtcData(userId);
    req.log.info(
      { recovered, adminEmail: me.email },
      "Legacy RTC data recovered to admin account",
    );
    res.json({ ok: true, recovered });
  } catch (err) {
    req.log.error({ err }, "Failed to recover legacy data");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/admin/presets — return all trade preset summaries for audit
// No DB required — pure in-memory function calls. Admin-gated.

const TRADE_KEYS: { key: string; label: string; aliasOf?: string }[] = [
  { key: "electrical", label: "Electrical" },
  { key: "plumbing", label: "Plumbing" },
  { key: "gas_fitting", label: "Gas Fitting", aliasOf: "plumbing" },
  { key: "drainage", label: "Drainage", aliasOf: "plumbing" },
  { key: "carpentry", label: "Carpentry" },
  { key: "roofing", label: "Roofing" },
  { key: "painting", label: "Painting" },
  { key: "concrete_grinding", label: "Concrete Grinding" },
  { key: "concrete_laying", label: "Concrete Laying", aliasOf: "concrete_grinding" },
  { key: "line_marking", label: "Line Marking" },
  { key: "asphalt", label: "Asphalt", aliasOf: "line_marking" },
  { key: "civil", label: "Civil Works" },
  { key: "demolition", label: "Demolition" },
  { key: "scaffolding", label: "Scaffolding" },
  { key: "bricklaying", label: "Bricklaying" },
  { key: "glazing", label: "Glazing" },
  { key: "plastering", label: "Plastering" },
  { key: "tiling", label: "Tiling" },
  { key: "insulation", label: "Insulation" },
  { key: "hvac", label: "HVAC" },
  { key: "fire_protection", label: "Fire Protection" },
  { key: "security", label: "Security" },
  { key: "landscaping", label: "Landscaping" },
  { key: "cleaning", label: "Cleaning" },
  { key: "welding", label: "Welding / Fabrication" },
  { key: "pest_control", label: "Pest Control" },
  { key: "general", label: "General (fallback)" },
];

router.get("/presets", async (req, res) => {
  const userId = getUserId(req);
  try {
    const [me] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
    if (!me || !ADMIN_EMAILS.has(me.email.toLowerCase())) {
      res.status(403).json({ error: "Forbidden" }); return;
    }
    const result = TRADE_KEYS.map(({ key, label, aliasOf }) => {
      const jsa = getJsaNzTemplate(key);
      const swms = getSwmsTemplate(key);
      return {
        key,
        label,
        aliasOf: aliasOf ?? null,
        jsa: {
          workDescription: jsa.workDescription,
          stepCount: jsa.steps.length,
          firstStep: jsa.steps[0]?.step ?? "—",
          firstHazard: jsa.steps[0]?.hazards ?? "—",
          ppeCount: jsa.ppeRequired.length,
        },
        swms: {
          hrceType: swms.hrceType,
          stepCount: swms.steps.length,
          firstStep: swms.steps[0]?.step ?? "—",
          firstHazard: swms.steps[0]?.hazard ?? "—",
          ppeCount: swms.ppeRequired.length,
        },
      };
    });
    res.json({ trades: result });
  } catch (err) {
    req.log.error({ err }, "Failed to load preset audit");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
