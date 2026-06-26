import { Router } from "express";
import { db } from "@workspace/db";
import { integrationInterestTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";

const router = Router();

const INTEGRATIONS = [
  { provider: "xero", name: "Xero", category: "Accounting", tagline: "Pull your Xero contacts in so PCBU 1 auto-fills from your real client list.", available: true },
  { provider: "simpro", name: "simPRO", category: "Job Management", tagline: "Pull job and site details from simPRO straight into your SSSP.", available: false },
  { provider: "fergus", name: "Fergus", category: "Job Management", tagline: "Sync jobs from Fergus — site address, client name pre-filled.", available: false },
  { provider: "geo", name: "GEO", category: "Job Management", tagline: "Connect your GEO jobs to auto-fill site and crew details.", available: false },
  { provider: "myob", name: "MYOB", category: "Accounting", tagline: "Record safety document creation against MYOB contacts.", available: false },
  { provider: "google_drive", name: "Google Drive", category: "Storage", tagline: "Save every generated PDF straight to a Drive folder.", available: false },
  { provider: "dropbox", name: "Dropbox", category: "Storage", tagline: "Push completed safety plans to your Dropbox account.", available: false },
  { provider: "email", name: "Email delivery", category: "Notifications", tagline: "Send the PDF directly to your client from SafeIQ — one click.", available: false },
];

router.get("/", async (req, res) => {
  const userId = (req as any).userId as string;
  const interested = await db
    .select({ provider: integrationInterestTable.provider })
    .from(integrationInterestTable)
    .where(eq(integrationInterestTable.userId, userId));

  const interestedSet = new Set(interested.map((r) => r.provider));

  const result = INTEGRATIONS.map((i) => ({
    ...i,
    notified: interestedSet.has(i.provider),
  }));
  return res.json(result);
});

router.post("/:provider/notify", async (req, res) => {
  const userId = (req as any).userId as string;
  const { provider } = req.params;
  const valid = INTEGRATIONS.find((i) => i.provider === provider);
  if (!valid) {
    return res.status(404).json({ error: "Unknown integration" });
  }

  await db
    .insert(integrationInterestTable)
    .values({ userId: userId, provider })
    .onConflictDoNothing();

  return res.json({ provider, notified: true });
});

router.delete("/:provider/notify", async (req, res) => {
  const userId = (req as any).userId as string;
  const { provider } = req.params;

  await db
    .delete(integrationInterestTable)
    .where(
      and(
        eq(integrationInterestTable.userId, userId),
        eq(integrationInterestTable.provider, provider),
      ),
    );

  return res.json({ provider, notified: false });
});

export default router;
