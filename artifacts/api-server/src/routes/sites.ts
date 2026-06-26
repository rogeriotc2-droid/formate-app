import { Router, type Request } from "express";
import { eq, and } from "drizzle-orm";
import { db, sitesTable, activityTable } from "@workspace/db";
import { z } from "zod";

function getUserId(req: Request): string {
  return (req as Request & { userId?: string }).userId ?? "";
}

const router = Router();

const siteInputSchema = z.object({
  name: z.string().min(1),
  address: z.string().min(1),
  pcbu: z.string().min(1),
  principalEmail: z.string().email().optional().or(z.literal("")),
  contactName: z.string().optional(),
  contactPhone: z.string().optional(),
  notes: z.string().optional(),
});

const siteUpdateSchema = siteInputSchema.partial();

router.get("/", async (req, res) => {
  const userId = getUserId(req);
  try {
    const sites = await db
      .select()
      .from(sitesTable)
      .where(eq(sitesTable.userId, userId))
      .orderBy(sitesTable.createdAt);
    res.json(sites);
  } catch (err) {
    req.log.error({ err }, "Failed to list sites");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/", async (req, res) => {
  const userId = getUserId(req);
  const parsed = siteInputSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.issues });
    return;
  }
  try {
    const [site] = await db.insert(sitesTable).values({ ...parsed.data, userId }).returning();
    await db.insert(activityTable).values({
      userId,
      type: "site_created",
      description: `New site added: ${site.name}`,
      entityId: site.id,
      entityName: site.name,
    });
    res.status(201).json(site);
  } catch (err) {
    req.log.error({ err }, "Failed to create site");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:id", async (req, res) => {
  const userId = getUserId(req);
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  try {
    const [site] = await db
      .select()
      .from(sitesTable)
      .where(and(eq(sitesTable.id, id), eq(sitesTable.userId, userId)));
    if (!site) { res.status(404).json({ error: "Not found" }); return; }
    res.json(site);
  } catch (err) {
    req.log.error({ err }, "Failed to get site");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/:id", async (req, res) => {
  const userId = getUserId(req);
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const parsed = siteUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.issues });
    return;
  }
  try {
    const [site] = await db
      .update(sitesTable)
      .set(parsed.data)
      .where(and(eq(sitesTable.id, id), eq(sitesTable.userId, userId)))
      .returning();
    if (!site) { res.status(404).json({ error: "Not found" }); return; }
    res.json(site);
  } catch (err) {
    req.log.error({ err }, "Failed to update site");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/:id", async (req, res) => {
  const userId = getUserId(req);
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  try {
    const [deleted] = await db
      .delete(sitesTable)
      .where(and(eq(sitesTable.id, id), eq(sitesTable.userId, userId)))
      .returning();
    if (!deleted) { res.status(404).json({ error: "Not found" }); return; }
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete site");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
