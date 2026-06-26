import { useRef, useState, useEffect } from "react";
import { Camera, Upload, Trash2, X } from "lucide-react";
import { authedFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export type SsspPhoto = {
  id: string;
  objectPath: string;
  caption?: string;
  createdAt: string;
};

/**
 * localStorage safety net for mobile tab kills.
 *
 * The OS kill scenario: user opens camera → snaps photo → control returns to
 * the browser → we upload to object storage → we save the SSSP server-side.
 * The tab can die at ANY point in that flow (the camera app puts the browser
 * in the background, and on memory-constrained phones the browser tab is one
 * of the first things to get killed). If we lose the tab AFTER the bucket PUT
 * but BEFORE the SSSP save, the photo file exists in storage but the SSSP has
 * no reference to it — it's an orphan.
 *
 * Fix: the moment a bucket PUT succeeds, write the new photo to localStorage
 * keyed by SSSP id. Clear it after the server save succeeds. On page load,
 * the parent recovers any pending photos and triggers a save.
 */
const PENDING_KEY = (ssspId: string) => `formate:pending-photos:${ssspId}`;

export function readPendingPhotos(ssspId: string): SsspPhoto[] {
  try {
    const raw = localStorage.getItem(PENDING_KEY(ssspId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as SsspPhoto[]) : [];
  } catch {
    return [];
  }
}

export function clearPendingPhotos(ssspId: string): void {
  try { localStorage.removeItem(PENDING_KEY(ssspId)); } catch { /* ignore */ }
}

function appendPendingPhoto(ssspId: string, photo: SsspPhoto): void {
  try {
    const current = readPendingPhotos(ssspId);
    localStorage.setItem(PENDING_KEY(ssspId), JSON.stringify([...current, photo]));
  } catch { /* quota or private-mode — non-fatal */ }
}

/**
 * Resize an image client-side before upload. Mobile cameras produce 5–10MB
 * JPEGs which are painful on rural 4G — we don't need that resolution for an
 * SSSP. Cap longest edge at 1600px, JPEG quality 0.85 → typically <500KB.
 *
 * iOS gallery quirk: iPhone photos are stored as HEIC. `createImageBitmap`
 * doesn't decode HEIC in most browsers, but `HTMLImageElement` does on iOS
 * Safari (which uses the native iOS decoder). So we try the fast path first
 * and fall back to <img> if the bitmap path fails.
 */
async function decodeToCanvas(file: File, maxEdge: number): Promise<HTMLCanvasElement | null> {
  // Fast path — works for JPEG, PNG, WebP everywhere
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
    const w = Math.max(1, Math.round(bitmap.width * scale));
    const h = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) { bitmap.close?.(); return null; }
    ctx.drawImage(bitmap, 0, 0, w, h);
    bitmap.close?.();
    return canvas;
  } catch {
    // Fall through to <img> fallback — typically iOS HEIC from the gallery.
  }

  // Slow path — uses HTMLImageElement which on iOS Safari can decode HEIC.
  return await new Promise<HTMLCanvasElement | null>((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      try {
        const scale = Math.min(1, maxEdge / Math.max(img.naturalWidth, img.naturalHeight));
        const w = Math.max(1, Math.round(img.naturalWidth * scale));
        const h = Math.max(1, Math.round(img.naturalHeight * scale));
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) { resolve(null); return; }
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas);
      } finally {
        URL.revokeObjectURL(url);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };
    img.src = url;
  });
}

async function resizeImage(file: File, maxEdge = 1600): Promise<Blob> {
  if (!file.type.startsWith("image/") && !/\.(heic|heif)$/i.test(file.name)) {
    throw new Error("That doesn't look like a photo — try a JPG, PNG or HEIC image.");
  }
  const canvas = await decodeToCanvas(file, maxEdge);
  if (!canvas) {
    // Most common cause: HEIC photo on Android (no native decoder), or a
    // corrupt file. Give the user a concrete next step.
    throw new Error(
      "Couldn't read this photo on your device. On iPhone, open the photo, tap Share, choose 'Save as JPEG' first. On Android, take a new photo with the camera button above.",
    );
  }
  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Couldn't compress photo — try a different one."))),
      "image/jpeg",
      0.85,
    );
  });
}

/** Build the serving URL for a stored object path. */
export function photoSrc(objectPath: string): string {
  return `/api/storage${objectPath}`;
}

type Props = {
  photos: SsspPhoto[];
  onChange: (photos: SsspPhoto[]) => void;
  /**
   * The SSSP id. Required for the localStorage safety net — without it we
   * can't recover orphaned uploads after a mobile tab kill.
   */
  ssspId: string;
  /**
   * Called after add/remove with the new photo list. The editor awaits this
   * before clearing its "saving" state, so the user can see persistence
   * complete. CRITICAL on mobile: the OS often kills the browser tab while
   * the camera app is foregrounded — without server-side persistence in this
   * hook, the photo URL is lost when the tab reloads (the file in storage is
   * orphaned). Provide a function that updates the server, not just React state.
   */
  onPersist?: (photos: SsspPhoto[]) => Promise<void>;
};

/**
 * Editor — upload + display + delete photos. Used inside the SSSP editor.
 * Mobile-friendly: the camera input uses `capture="environment"` so a tap
 * opens the rear camera directly (no gallery picker step).
 */
export function SsspPhotosEditor({ photos, onChange, onPersist, ssspId }: Props) {
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [viewer, setViewer] = useState<SsspPhoto | null>(null);
  const { toast } = useToast();

  // Warn the user before unloading the tab while an upload or save is in
  // flight. Helps on desktop; mobile browsers mostly ignore beforeunload, so
  // the localStorage safety net below is the real defence on mobile.
  useEffect(() => {
    if (!uploading && !saving) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [uploading, saving]);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    const newPhotos: SsspPhoto[] = [];
    try {
      for (const file of Array.from(files)) {
        const resized = await resizeImage(file);
        const contentType = "image/jpeg";

        const urlRes = await authedFetch("/api/storage/uploads/request-url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: file.name,
            size: resized.size,
            contentType,
          }),
        });
        if (!urlRes.ok) throw new Error("Couldn't get upload URL");
        const { uploadURL, objectPath } = await urlRes.json();

        const putRes = await fetch(uploadURL, {
          method: "PUT",
          headers: { "Content-Type": contentType },
          body: resized,
        });
        if (!putRes.ok) throw new Error("Upload failed");

        const photo: SsspPhoto = {
          id: crypto.randomUUID(),
          objectPath,
          createdAt: new Date().toISOString(),
        };
        // SAFETY NET: write to localStorage the moment the bucket PUT succeeds,
        // BEFORE we touch React state or the server. If the tab dies right now,
        // the next page load will recover this photo from localStorage and
        // attach it to the SSSP. The file is already safe in object storage.
        appendPendingPhoto(ssspId, photo);
        newPhotos.push(photo);
      }
      const next = [...photos, ...newPhotos];
      onChange(next);
      // Persist to the server NOW so the photo survives the browser tab being
      // killed by the OS (common on mobile when the camera app is foregrounded).
      if (onPersist) {
        setSaving(true);
        try {
          await onPersist(next);
          // Server save succeeded — pending photos are now durable on the SSSP,
          // so clear the localStorage safety net.
          clearPendingPhotos(ssspId);
          toast({ title: `Saved ${newPhotos.length} photo${newPhotos.length === 1 ? "" : "s"} to this SSSP` });
        } catch (err) {
          // Server save failed but the photo is in storage AND in localStorage.
          // Next page load (or next successful save) will recover it.
          toast({
            title: "Photo saved locally",
            description: "Couldn't reach the server — the photo will attach automatically next time you open the SSSP.",
            variant: "destructive",
          });
        } finally {
          setSaving(false);
        }
      } else {
        toast({ title: `Added ${newPhotos.length} photo${newPhotos.length === 1 ? "" : "s"} — remember to Save` });
      }
    } catch (err) {
      toast({
        title: "Upload failed",
        description: err instanceof Error ? err.message : "Try again",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      if (cameraRef.current) cameraRef.current.value = "";
      if (galleryRef.current) galleryRef.current.value = "";
    }
  };

  const removePhoto = async (id: string) => {
    if (!confirm("Remove this photo?")) return;
    const next = photos.filter((p) => p.id !== id);
    onChange(next);
    if (onPersist) {
      setSaving(true);
      try { await onPersist(next); } catch { /* toast handled by parent if needed */ }
      finally { setSaving(false); }
    }
  };

  const updateCaption = (id: string, caption: string) => {
    onChange(photos.map((p) => (p.id === id ? { ...p, caption } : p)));
  };

  return (
    <div className="space-y-3">
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      <input
        ref={galleryRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          onClick={() => cameraRef.current?.click()}
          disabled={uploading}
          className="bg-primary hover:bg-primary/90 text-white"
        >
          <Camera className="w-4 h-4 mr-1.5" />
          {uploading ? "Uploading…" : "Take photo"}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => galleryRef.current?.click()}
          disabled={uploading}
        >
          <Upload className="w-4 h-4 mr-1.5" />
          Upload from device
        </Button>
      </div>

      {photos.length === 0 ? (
        <p className="text-xs text-muted-foreground italic">
          No photos yet. Snap site conditions, hazards, the PCBU 1 sign-in board, completed work, or anything else worth keeping a record of.
        </p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {photos.map((p) => (
            <div key={p.id} className="border border-border rounded-lg overflow-hidden bg-card">
              <button
                type="button"
                onClick={() => setViewer(p)}
                className="block w-full aspect-square bg-muted overflow-hidden"
              >
                <img
                  src={photoSrc(p.objectPath)}
                  alt={p.caption ?? "Site photo"}
                  className="w-full h-full object-cover hover:opacity-90 transition"
                  loading="lazy"
                />
              </button>
              <div className="p-2 space-y-1.5">
                <input
                  type="text"
                  value={p.caption ?? ""}
                  onChange={(e) => updateCaption(p.id, e.target.value)}
                  placeholder="Add caption…"
                  className="w-full text-xs border border-input rounded px-2 py-1 bg-background focus:outline-none focus:ring-1 focus:ring-primary/40"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => removePhoto(p.id)}
                  className="w-full h-7 text-xs text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="w-3 h-3 mr-1" /> Remove
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {viewer && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setViewer(null)}
        >
          <button
            type="button"
            className="absolute top-4 right-4 text-white p-2 rounded-full bg-white/10 hover:bg-white/20"
            onClick={() => setViewer(null)}
          >
            <X className="w-5 h-5" />
          </button>
          <div className="max-w-5xl max-h-full">
            <img
              src={photoSrc(viewer.objectPath)}
              alt={viewer.caption ?? "Site photo"}
              className="max-w-full max-h-[85vh] object-contain"
              onClick={(e) => e.stopPropagation()}
            />
            {viewer.caption && (
              <p className="text-white text-sm text-center mt-3">{viewer.caption}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Display-only — used in print view, public view, and PDFs. No interactivity
 * needed; just a clean grid of captioned photos.
 */
export function SsspPhotosDisplay({ photos }: { photos: SsspPhoto[] }) {
  if (!photos || photos.length === 0) return null;
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
      {photos.map((p) => (
        <div
          key={p.id}
          style={{ border: "1px solid #E5E7EB", borderRadius: 4, overflow: "hidden", breakInside: "avoid" }}
        >
          <img
            src={photoSrc(p.objectPath)}
            alt={p.caption ?? "Site photo"}
            style={{ width: "100%", height: 140, objectFit: "cover", display: "block" }}
          />
          {p.caption && (
            <div style={{ padding: "4px 6px", fontSize: 8.5, color: "#374151", lineHeight: 1.3 }}>
              {p.caption}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
