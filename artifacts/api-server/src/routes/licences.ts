import { Router, type Request } from "express";
import { eq, and, desc } from "drizzle-orm";
import { db, licencesTable, activityTable } from "@workspace/db";
import { z } from "zod";

function getUserId(req: Request): string {
  return (req as Request & { userId?: string }).userId ?? "";
}

const router = Router();

const dateField = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD")
  .optional()
  .or(z.literal(""));

const licenceInputSchema = z.object({
  workerName: z.string().trim().min(1),
  recordType: z.enum(["licence", "training"]).default("licence"),
  name: z.string().trim().min(1),
  referenceNumber: z.string().optional(),
  issueDate: dateField,
  expiryDate: dateField,
  reminderEmail: z.string().email().optional().or(z.literal("")),
  remindersEnabled: z.boolean().optional(),
  notes: z.string().optional(),
});

const licenceUpdateSchema = licenceInputSchema.partial();

router.get("/", async (req, res) => {
  const userId = getUserId(req);
  try {
    const licences = await db
      .select()
      .from(licencesTable)
      .where(eq(licencesTable.userId, userId))
      .orderBy(desc(licencesTable.createdAt));
    res.json(licences);
  } catch (err) {
    req.log.error({ err }, "Failed to list licences");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/", async (req, res) => {
  const userId = getUserId(req);
  const parsed = licenceInputSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.issues });
    return;
  }
  const d = parsed.data;
  try {
    const [licence] = await db
      .insert(licencesTable)
      .values({
        userId,
        workerName: d.workerName.trim(),
        recordType: d.recordType,
        name: d.name.trim(),
        referenceNumber: d.referenceNumber?.trim() || null,
        issueDate: d.issueDate?.trim() || null,
        expiryDate: d.expiryDate?.trim() || null,
        reminderEmail: d.reminderEmail?.trim() || null,
        remindersEnabled: d.remindersEnabled ?? true,
        notes: d.notes?.trim() || null,
      })
      .returning();
    await db.insert(activityTable).values({
      userId,
      type: "licence_created",
      description: `${licence.recordType === "training" ? "Training" : "Licence"} added: ${licence.name} (${licence.workerName})`,
      entityId: licence.id,
      entityName: licence.name,
    });
    res.status(201).json(licence);
  } catch (err) {
    req.log.error({ err }, "Failed to create licence");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:id", async (req, res) => {
  const userId = getUserId(req);
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  try {
    const [licence] = await db
      .select()
      .from(licencesTable)
      .where(and(eq(licencesTable.id, id), eq(licencesTable.userId, userId)));
    if (!licence) { res.status(404).json({ error: "Not found" }); return; }
    res.json(licence);
  } catch (err) {
    req.log.error({ err }, "Failed to get licence");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/:id", async (req, res) => {
  const userId = getUserId(req);
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const parsed = licenceUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.issues });
    return;
  }
  const d = parsed.data;
  const patch: Partial<typeof licencesTable.$inferInsert> = {};
  if (d.workerName !== undefined) patch.workerName = d.workerName.trim();
  if (d.recordType !== undefined) patch.recordType = d.recordType;
  if (d.name !== undefined) patch.name = d.name.trim();
  if (d.referenceNumber !== undefined) patch.referenceNumber = d.referenceNumber.trim() || null;
  if (d.issueDate !== undefined) patch.issueDate = d.issueDate.trim() || null;
  // Renewing/changing the expiry re-arms reminders for the new date.
  if (d.expiryDate !== undefined) {
    patch.expiryDate = d.expiryDate.trim() || null;
    patch.lastReminderWindow = null;
  }
  if (d.reminderEmail !== undefined) patch.reminderEmail = d.reminderEmail.trim() || null;
  if (d.remindersEnabled !== undefined) patch.remindersEnabled = d.remindersEnabled;
  if (d.notes !== undefined) patch.notes = d.notes.trim() || null;
  try {
    const [licence] = await db
      .update(licencesTable)
      .set(patch)
      .where(and(eq(licencesTable.id, id), eq(licencesTable.userId, userId)))
      .returning();
    if (!licence) { res.status(404).json({ error: "Not found" }); return; }
    res.json(licence);
  } catch (err) {
    req.log.error({ err }, "Failed to update licence");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/:id", async (req, res) => {
  const userId = getUserId(req);
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  try {
    const [deleted] = await db
      .delete(licencesTable)
      .where(and(eq(licencesTable.id, id), eq(licencesTable.userId, userId)))
      .returning();
    if (!deleted) { res.status(404).json({ error: "Not found" }); return; }
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete licence");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
