import { Router, type Request } from "express";
import { eq, and } from "drizzle-orm";
import { db, templatesTable, stickyValuesTable, activityTable } from "@workspace/db";
import { z } from "zod";

function getUserId(req: Request): string {
  return (req as Request & { userId?: string }).userId ?? "";
}

const router = Router();

const fieldDefinitionSchema = z.object({
  key: z.string().min(1),
  label: z.string().min(1),
  type: z.enum(["text", "textarea", "date", "number", "select", "checkbox", "signature"]),
  sticky: z.boolean(),
  required: z.boolean().optional(),
  options: z.array(z.string()).optional().nullable(),
  placeholder: z.string().optional().nullable(),
});

const templateInputSchema = z.object({
  name: z.string().min(1),
  category: z.string().min(1),
  description: z.string().optional(),
  extraRecipientEmail: z.string().email().optional().or(z.literal("")),
  fields: z.array(fieldDefinitionSchema),
});

const templateUpdateSchema = templateInputSchema.partial();

router.get("/", async (req, res) => {
  const userId = getUserId(req);
  try {
    const templates = await db
      .select()
      .from(templatesTable)
      .where(eq(templatesTable.userId, userId))
      .orderBy(templatesTable.createdAt);
    res.json(templates);
  } catch (err) {
    req.log.error({ err }, "Failed to list templates");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/", async (req, res) => {
  const userId = getUserId(req);
  const parsed = templateInputSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.issues });
    return;
  }
  try {
    const [template] = await db.insert(templatesTable).values({ ...parsed.data, userId }).returning();
    await db.insert(activityTable).values({
      userId,
      type: "template_created",
      description: `New template created: ${template.name}`,
      entityId: template.id,
      entityName: template.name,
    });
    res.status(201).json(template);
  } catch (err) {
    req.log.error({ err }, "Failed to create template");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:id", async (req, res) => {
  const userId = getUserId(req);
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  try {
    const [template] = await db
      .select()
      .from(templatesTable)
      .where(and(eq(templatesTable.id, id), eq(templatesTable.userId, userId)));
    if (!template) { res.status(404).json({ error: "Not found" }); return; }
    res.json(template);
  } catch (err) {
    req.log.error({ err }, "Failed to get template");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/:id", async (req, res) => {
  const userId = getUserId(req);
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const parsed = templateUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.issues });
    return;
  }
  try {
    const [template] = await db
      .update(templatesTable)
      .set(parsed.data)
      .where(and(eq(templatesTable.id, id), eq(templatesTable.userId, userId)))
      .returning();
    if (!template) { res.status(404).json({ error: "Not found" }); return; }
    res.json(template);
  } catch (err) {
    req.log.error({ err }, "Failed to update template");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/:id", async (req, res) => {
  const userId = getUserId(req);
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  try {
    const [deleted] = await db
      .delete(templatesTable)
      .where(and(eq(templatesTable.id, id), eq(templatesTable.userId, userId)))
      .returning();
    if (!deleted) { res.status(404).json({ error: "Not found" }); return; }
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete template");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:id/prefill", async (req, res) => {
  const userId = getUserId(req);
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  try {
    const [template] = await db
      .select()
      .from(templatesTable)
      .where(and(eq(templatesTable.id, id), eq(templatesTable.userId, userId)));
    if (!template) { res.status(404).json({ error: "Not found" }); return; }
    const [sticky] = await db
      .select()
      .from(stickyValuesTable)
      .where(eq(stickyValuesTable.templateId, id));
    res.json({ templateId: id, values: (sticky?.values as Record<string, unknown>) ?? {} });
  } catch (err) {
    req.log.error({ err }, "Failed to get prefill data");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
