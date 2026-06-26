import { Router, type Request } from "express";
import { eq, and, sql, isNotNull } from "drizzle-orm";
import { db, submissionsTable, templatesTable, sitesTable, activityTable, companiesTable } from "@workspace/db";

function getUserId(req: Request): string {
  return (req as Request & { userId?: string }).userId ?? "";
}

const router = Router();

router.get("/summary", async (req, res) => {
  const userId = getUserId(req);
  try {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const [
      totalSubmissionsResult,
      weeklyResult,
      totalTemplatesResult,
      totalSitesResult,
      statusResult,
      totalSignupsResult,
      activeTrialsResult,
      signupsThisWeekResult,
    ] = await Promise.all([
      db.select({ count: sql<number>`count(*)::int` }).from(submissionsTable).where(eq(submissionsTable.userId, userId)),
      db.select({ count: sql<number>`count(*)::int` }).from(submissionsTable).where(
        and(eq(submissionsTable.userId, userId), sql`created_at >= ${oneWeekAgo.toISOString()}`)
      ),
      db.select({ count: sql<number>`count(*)::int` }).from(templatesTable).where(eq(templatesTable.userId, userId)),
      db.select({ count: sql<number>`count(*)::int` }).from(sitesTable).where(eq(sitesTable.userId, userId)),
      db.select({
        status: submissionsTable.status,
        count: sql<number>`count(*)::int`,
      }).from(submissionsTable).where(eq(submissionsTable.userId, userId)).groupBy(submissionsTable.status),
      // Platform-wide signup counts
      db.select({ count: sql<number>`count(*)::int` }).from(companiesTable),
      db.select({ count: sql<number>`count(*)::int` }).from(companiesTable).where(
        and(isNotNull(companiesTable.trialStartedAt), eq(companiesTable.plan, "free"))
      ),
      db.select({ count: sql<number>`count(*)::int` }).from(companiesTable).where(
        sql`created_at >= ${oneWeekAgo.toISOString()}`
      ),
    ]);

    const statusMap: Record<string, number> = {};
    for (const row of statusResult) {
      statusMap[row.status] = row.count;
    }

    res.json({
      totalSubmissions: totalSubmissionsResult[0]?.count ?? 0,
      submissionsThisWeek: weeklyResult[0]?.count ?? 0,
      totalTemplates: totalTemplatesResult[0]?.count ?? 0,
      totalSites: totalSitesResult[0]?.count ?? 0,
      draftCount: statusMap["draft"] ?? 0,
      submittedCount: statusMap["submitted"] ?? 0,
      reviewedCount: statusMap["reviewed"] ?? 0,
      totalSignups: totalSignupsResult[0]?.count ?? 0,
      activeTrials: activeTrialsResult[0]?.count ?? 0,
      signupsThisWeek: signupsThisWeekResult[0]?.count ?? 0,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get dashboard summary");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/recent", async (req, res) => {
  const userId = getUserId(req);
  try {
    const submissions = await db
      .select()
      .from(submissionsTable)
      .where(eq(submissionsTable.userId, userId))
      .orderBy(sql`${submissionsTable.createdAt} desc`)
      .limit(10);
    res.json(submissions);
  } catch (err) {
    req.log.error({ err }, "Failed to get recent submissions");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/activity", async (req, res) => {
  const userId = getUserId(req);
  try {
    const events = await db
      .select()
      .from(activityTable)
      .where(eq(activityTable.userId, userId))
      .orderBy(sql`${activityTable.createdAt} desc`)
      .limit(20);
    res.json(events);
  } catch (err) {
    req.log.error({ err }, "Failed to get activity feed");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
