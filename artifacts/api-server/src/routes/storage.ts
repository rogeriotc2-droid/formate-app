import { Router, type IRouter, type Request, type Response } from "express";
import { Readable } from "stream";
import { z } from "zod";
import { ObjectStorageService, ObjectNotFoundError } from "../lib/objectStorage";
import { requireAuth } from "../middlewares/requireAuth";

const router: IRouter = Router();
const objectStorageService = new ObjectStorageService();

// Whitelist image MIME types only — uploaded bytes are served from the app
// origin so anything HTML/SVG/script-flavoured could be used as a stored XSS
// vector. SVG is excluded because it can execute script when rendered inline.
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

const RequestUploadUrlBody = z.object({
  name: z.string().min(1),
  size: z.number().int().nonnegative().max(15 * 1024 * 1024),
  contentType: z.enum(ALLOWED_IMAGE_TYPES),
});

// Object IDs are UUIDs generated server-side by getObjectEntityUploadURL().
// Lock the public GET surface to that exact shape so the wildcard route
// cannot be used to fish for any other privately-stored object.
const UPLOAD_PATH_RE = /^uploads\/[A-Za-z0-9_-]{8,}$/;

/**
 * POST /storage/uploads/request-url
 * Auth-gated — only signed-in tradies can request upload URLs.
 * Returns a presigned PUT URL; client uploads file bytes directly to GCS.
 */
router.post("/storage/uploads/request-url", requireAuth, async (req: Request, res: Response) => {
  const parsed = RequestUploadUrlBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Missing or invalid required fields" });
    return;
  }

  try {
    const uploadURL = await objectStorageService.getObjectEntityUploadURL();
    const objectPath = objectStorageService.normalizeObjectEntityPath(uploadURL);
    res.json({ uploadURL, objectPath, metadata: parsed.data });
  } catch (error) {
    req.log.error({ err: error }, "Error generating upload URL");
    res.status(500).json({ error: "Failed to generate upload URL" });
  }
});

/**
 * GET /storage/objects/*
 * Public read of uploaded objects. Photos rendered in emails, print views,
 * and public SSSP share links all need to be reachable without a session.
 * The object path itself is an unguessable UUID, so this acts as a
 * capability URL (treat it like a presigned link).
 */
router.get("/storage/objects/*path", async (req: Request, res: Response) => {
  try {
    const raw = req.params.path;
    const wildcardPath = Array.isArray(raw) ? raw.join("/") : raw;

    // Refuse anything that doesn't match the upload UUID shape — keeps the
    // public surface narrow even if other things end up in PRIVATE_OBJECT_DIR.
    if (!UPLOAD_PATH_RE.test(wildcardPath)) {
      res.status(404).json({ error: "Object not found" });
      return;
    }

    const objectPath = `/objects/${wildcardPath}`;
    const objectFile = await objectStorageService.getObjectEntityFile(objectPath);

    // Defence-in-depth: even though upload requests are whitelisted to images,
    // re-check the actual stored Content-Type before serving from our origin.
    const [metadata] = await objectFile.getMetadata();
    const storedType = String(metadata.contentType ?? "");
    if (!(ALLOWED_IMAGE_TYPES as readonly string[]).includes(storedType)) {
      res.status(415).json({ error: "Unsupported media type" });
      return;
    }

    const response = await objectStorageService.downloadObject(objectFile, 3600);

    res.status(response.status);
    response.headers.forEach((value, key) => res.setHeader(key, value));
    // Force-pin the content type to the validated value and tell browsers not
    // to sniff — belt-and-braces against stored-XSS via mis-typed objects.
    res.setHeader("Content-Type", storedType);
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Content-Disposition", "inline");

    if (response.body) {
      const nodeStream = Readable.fromWeb(response.body as ReadableStream<Uint8Array>);
      nodeStream.pipe(res);
    } else {
      res.end();
    }
  } catch (error) {
    if (error instanceof ObjectNotFoundError) {
      res.status(404).json({ error: "Object not found" });
      return;
    }
    req.log.error({ err: error }, "Error serving object");
    res.status(500).json({ error: "Failed to serve object" });
  }
});

export default router;
