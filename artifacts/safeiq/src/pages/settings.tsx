import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { authedFetch } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Upload, Trash2, Image as ImageIcon, Loader2, ExternalLink, Plug, User, KeyRound } from "lucide-react";
import { useXeroEnabled } from "@/lib/feature-flags";
import { useAuth } from "@/lib/auth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Company = {
  id: number;
  businessName: string;
  mainContactName: string;
  mainContactPhone: string;
  mainContactEmail: string | null;
  primaryTrade: string;
  logoUrl?: string | null;
};

const ALLOWED = ["image/png", "image/jpeg", "image/webp"];
const MAX_BYTES = 5 * 1024 * 1024;

export default function Settings() {
  const { toast } = useToast();
  const { user, refresh } = useAuth();
  const xeroEnabled = useXeroEnabled();
  const fileRef = useRef<HTMLInputElement>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  // Profile editing
  const [displayName, setDisplayName] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [nameInitialized, setNameInitialized] = useState(false);

  useEffect(() => {
    if (user && !nameInitialized) {
      setDisplayName(user.name ?? "");
      setNameInitialized(true);
    }
  }, [user, nameInitialized]);

  useEffect(() => {
    authedFetch("/api/company")
      .then(r => r.ok ? r.json() : null)
      .then(c => setCompany(c))
      .catch(() => setCompany(null))
      .finally(() => setLoading(false));
  }, []);

  async function saveName() {
    if (!displayName.trim()) return;
    setSavingName(true);
    try {
      const res = await authedFetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: displayName.trim() }),
      });
      if (!res.ok) throw new Error("Failed to save");
      await refresh();
      toast({ title: "Name updated" });
    } catch {
      toast({ title: "Couldn't save name", description: "Try again.", variant: "destructive" });
    } finally {
      setSavingName(false);
    }
  }

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!ALLOWED.includes(file.type)) {
      toast({ title: "Wrong file type", description: "Use a PNG, JPG or WebP image.", variant: "destructive" });
      return;
    }
    if (file.size > MAX_BYTES) {
      toast({ title: "File too big", description: "Max 5 MB. Try resizing or use a smaller image.", variant: "destructive" });
      return;
    }
    setUploading(true);
    try {
      const reqRes = await authedFetch("/api/storage/uploads/request-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: file.name, size: file.size, contentType: file.type }),
      });
      if (!reqRes.ok) throw new Error("Couldn't get upload URL");
      const { uploadURL, objectPath } = await reqRes.json() as { uploadURL: string; objectPath: string };

      const putRes = await fetch(uploadURL, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!putRes.ok) throw new Error("Upload failed");

      const saveRes = await authedFetch("/api/company", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logoUrl: objectPath }),
      });
      if (!saveRes.ok) throw new Error("Couldn't save logo");
      const updated = await saveRes.json() as Company;
      setCompany(updated);
      toast({ title: "Logo uploaded", description: "It'll appear on your SSSPs, print views and emails." });
    } catch (err) {
      toast({ title: "Couldn't upload", description: err instanceof Error ? err.message : "Try again.", variant: "destructive" });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function removeLogo() {
    setUploading(true);
    try {
      const res = await authedFetch("/api/company", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logoUrl: null }),
      });
      if (!res.ok) throw new Error("Couldn't remove logo");
      const updated = await res.json() as Company;
      setCompany(updated);
      toast({ title: "Logo removed" });
    } catch (err) {
      toast({ title: "Couldn't remove", description: err instanceof Error ? err.message : "Try again.", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  }

  const logoSrc = company?.logoUrl ? `/api/storage${company.logoUrl}` : null;
  const nameChanged = displayName.trim() !== (user?.name ?? "");

  return (
    <MainLayout>
      <div className="flex items-center justify-between mb-6 sm:mb-8 border-b pb-4 border-border">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">Settings</h1>
          <p className="text-muted-foreground mt-1 text-sm font-medium">Account, branding and integrations.</p>
        </div>
      </div>

      <div className="grid gap-6 max-w-2xl">
        {/* Account card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="w-4 h-4 text-primary" />
              Your account
            </CardTitle>
            <CardDescription>
              Your name appears on submitted forms. Email is your login — contact support to change it.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wide">Display name</Label>
                <Input
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  placeholder="Your name"
                  onKeyDown={e => { if (e.key === "Enter" && nameChanged) saveName(); }}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wide">Email</Label>
                <Input value={user?.email ?? ""} disabled className="bg-muted/40 cursor-not-allowed" />
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                onClick={saveName}
                disabled={!nameChanged || savingName || !displayName.trim()}
                className="gap-1.5"
              >
                {savingName ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                Save name
              </Button>
              <Link href="/forgot-password">
                <Button variant="outline" size="sm" className="gap-1.5">
                  <KeyRound className="w-3.5 h-3.5" />
                  Change password
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Company logo card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-primary" />
              Company logo
            </CardTitle>
            <CardDescription>
              Appears on your printed SSSPs, the share link your clients open, sign-off emails and the signing page. A square or wide PNG with a transparent background works best.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-md border-2 border-dashed border-border bg-muted/30 flex items-center justify-center overflow-hidden shrink-0">
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                ) : logoSrc ? (
                  <img src={logoSrc} alt="Company logo" className="max-w-full max-h-full object-contain" />
                ) : (
                  <ImageIcon className="w-7 h-7 text-muted-foreground/50" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold mb-0.5">
                  {loading ? "Loading…" : company?.businessName || "Your company"}
                </p>
                <p className="text-xs text-muted-foreground mb-3">
                  {logoSrc ? "Logo set — showing on all your documents." : "No logo yet. Upload one to brand your safety plans."}
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading || loading || !company}
                    className="gap-1.5"
                  >
                    {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                    {logoSrc ? "Replace logo" : "Upload logo"}
                  </Button>
                  {logoSrc && (
                    <Button type="button" size="sm" variant="outline" onClick={removeLogo} disabled={uploading} className="gap-1.5">
                      <Trash2 className="w-3.5 h-3.5" /> Remove
                    </Button>
                  )}
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={onPick}
                />
              </div>
            </div>
            {!company && !loading && (
              <p className="text-xs text-amber-600 dark:text-amber-400">
                Finish onboarding to upload a logo. <Link href="/onboarding" className="font-semibold underline">Set up your company</Link>.
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              PNG, JPG or WebP · max 5 MB. Existing SSSPs pick up the new logo the next time you open and save them.
            </p>
          </CardContent>
        </Card>

        {xeroEnabled && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Plug className="w-4 h-4 text-primary" />
                Integrations
              </CardTitle>
              <CardDescription>Connect Xero to auto-fill PCBU 1 and PCBU 2 from your client list.</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/integrations">
                <Button variant="outline" size="sm" className="gap-1.5">
                  Manage integrations <ExternalLink className="w-3 h-3" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}
