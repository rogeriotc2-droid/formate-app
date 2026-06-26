import { useEffect, useState } from "react";
import { useRoute } from "wouter";
import { Shield, CheckCircle2, AlertTriangle, Loader2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SignaturePad } from "@/components/signature-pad";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

type _PcbuWithLogo = { logoUrl?: string };
type Pcbu = _PcbuWithLogo & {
  company?: string;
  contact?: string;
  phone?: string;
  email?: string;
};

type Hazard = {
  hazard?: string;
  initialRisk?: string;
  controls?: string;
  residualRisk?: string;
};

type SsspPublic = {
  id: number;
  projectName: string;
  status: string;
  viewToken?: string;
  data: {
    siteAddress?: string;
    activities?: string;
    pcbu1?: Pcbu;
    pcbu2?: Pcbu;
    hazards?: Hazard[];
    pcbu1SignedBy?: string;
    pcbu1SignedDate?: string;
    pcbu1SignatureImage?: string;
    pcbu2SignedBy?: string;
    pcbu2SignedDate?: string;
  };
};

export default function SignSsspPage() {
  const [, params] = useRoute("/sign/:token");
  const token = params?.token ?? "";
  const { toast } = useToast();
  const [sssp, setSssp] = useState<SsspPublic | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [signedBy, setSignedBy] = useState("");
  const [signatureImage, setSignatureImage] = useState<string | undefined>(undefined);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!token) return;
    let alive = true;
    (async () => {
      try {
        const res = await fetch(`/api/public/sssps/sign/${token}`);
        const body = await res.json().catch(() => ({}));
        if (!alive) return;
        if (!res.ok) {
          setError((body as { error?: string }).error ?? `Couldn't load (HTTP ${res.status})`);
        } else {
          const data = body as SsspPublic;
          setSssp(data);
          setSignedBy(data.data.pcbu1SignedBy ?? data.data.pcbu1?.contact ?? "");
          // Already signed via this link? Skip straight to the thank-you state.
          if (data.data.pcbu1SignedBy && data.data.pcbu1SignedDate) {
            setDone(true);
          }
        }
      } catch {
        if (alive) setError("Couldn't reach the server. Check your connection and try again.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [token]);

  async function submit() {
    if (!signedBy.trim()) {
      toast({ title: "Name required", description: "Type your full name to sign.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/public/sssps/sign/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signedBy: signedBy.trim(), signatureImage }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}`);
      }
      setDone(true);
    } catch (err) {
      toast({ title: "Couldn't sign", description: err instanceof Error ? err.message : "Try again.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#FAFAF7]">
      <header className="bg-[#0F172A] text-white">
        <div className="mx-auto max-w-3xl px-5 sm:px-6 py-4 flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-primary" />
          <span className="text-lg font-black tracking-tight">
            <span>FOR</span><span className="text-primary">MATE</span>
          </span>
          <span className="ml-2 text-xs text-white/60">Site-Specific Safety Plan · Sign-off</span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 sm:px-6 py-6 sm:py-10">
        {loading && (
          <div className="flex items-center justify-center py-20 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading SSSP…
          </div>
        )}

        {!loading && error && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-6 text-center">
            <AlertTriangle className="w-10 h-10 text-amber-600 mx-auto mb-3" />
            <p className="font-semibold text-amber-900 mb-1">Link no longer valid</p>
            <p className="text-sm text-amber-800">{error}</p>
            <p className="text-xs text-amber-700 mt-4">Ask the contractor to resend the SSSP sign-off email.</p>
          </div>
        )}

        {!loading && !error && sssp && done && (
          <div className="rounded-lg border border-green-200 bg-green-50 p-8 text-center">
            <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-3" />
            <p className="text-lg font-bold text-green-900 mb-1">Signed — thanks, {signedBy.split(" ")[0]}</p>
            <p className="text-sm text-green-800">
              Your sign-off has been recorded for "<strong>{sssp.projectName}</strong>".<br />
              {sssp.data.pcbu2?.company ?? "The contractor"} has been notified.
            </p>
            {sssp.viewToken && (
              <div className="mt-5">
                <a
                  href={`/sssp/${sssp.viewToken}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-md bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground hover:opacity-90"
                >
                  <FileText className="w-4 h-4" /> View / print the full safety plan (PDF)
                </a>
                <p className="text-xs text-green-700 mt-2">Opens the complete signed plan — print it or save it as a PDF for your records.</p>
              </div>
            )}
          </div>
        )}

        {!loading && !error && sssp && !done && (
          <div className="space-y-5">
            {/* Plan summary */}
            <section className="bg-white border border-border rounded-lg p-5 sm:p-6 shadow-sm">
              <div className="flex items-start gap-3 mb-4">
                {sssp.data.pcbu2?.logoUrl ? (
                  <img
                    src={`/api/storage${sssp.data.pcbu2.logoUrl}`}
                    alt={sssp.data.pcbu2.company ?? "Company logo"}
                    className="w-14 h-14 sm:w-16 sm:h-16 object-contain rounded-md border border-border bg-white shrink-0"
                  />
                ) : (
                  <Shield className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                )}
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Site-Specific Safety Plan</p>
                  <h1 className="text-xl sm:text-2xl font-black text-foreground leading-tight">{sssp.projectName}</h1>
                  {sssp.data.pcbu2?.company && (
                    <p className="text-sm text-muted-foreground mt-0.5">From {sssp.data.pcbu2.company}</p>
                  )}
                </div>
              </div>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                {sssp.data.siteAddress && (
                  <div>
                    <dt className="text-xs font-semibold text-muted-foreground uppercase">Site address</dt>
                    <dd className="text-foreground">{sssp.data.siteAddress}</dd>
                  </div>
                )}
                {sssp.data.pcbu2?.company && (
                  <div>
                    <dt className="text-xs font-semibold text-muted-foreground uppercase">From (Contractor)</dt>
                    <dd className="text-foreground">
                      <span className="font-semibold">{sssp.data.pcbu2.company}</span>
                      {sssp.data.pcbu2.contact ? ` · ${sssp.data.pcbu2.contact}` : ""}
                      {sssp.data.pcbu2.phone ? ` · ${sssp.data.pcbu2.phone}` : ""}
                    </dd>
                  </div>
                )}
                {sssp.data.pcbu1?.company && (
                  <div className="sm:col-span-2">
                    <dt className="text-xs font-semibold text-muted-foreground uppercase">For (Principal / Client)</dt>
                    <dd className="text-foreground">
                      <span className="font-semibold">{sssp.data.pcbu1.company}</span>
                      {sssp.data.pcbu1.contact ? ` · ${sssp.data.pcbu1.contact}` : ""}
                    </dd>
                  </div>
                )}
                {sssp.data.activities && (
                  <div className="sm:col-span-2">
                    <dt className="text-xs font-semibold text-muted-foreground uppercase">Activities</dt>
                    <dd className="text-foreground whitespace-pre-wrap">{sssp.data.activities}</dd>
                  </div>
                )}
              </dl>
            </section>

            {/* Full plan link — the on-page view below is a summary */}
            {sssp.viewToken && (
              <a
                href={`/sssp/${sssp.viewToken}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 bg-white border-2 border-primary/40 rounded-lg p-4 sm:p-5 shadow-sm hover:border-primary transition-colors"
              >
                <FileText className="w-5 h-5 text-primary shrink-0" />
                <span className="text-sm">
                  <span className="font-bold text-foreground">Read the full safety plan</span>
                  <span className="block text-xs text-muted-foreground">Every hazard, control, task step, emergency plan and more — opens in a new tab, ready to print or save as PDF.</span>
                </span>
              </a>
            )}

            {/* Hazards summary */}
            {sssp.data.hazards && sssp.data.hazards.length > 0 && (
              <section className="bg-white border border-border rounded-lg p-5 sm:p-6 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
                  Hazard register — {sssp.data.hazards.length} identified
                </p>
                <div className="space-y-2">
                  {sssp.data.hazards.map((h, i) => (
                    <div key={i} className="border border-border rounded-md p-3 text-sm">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="font-semibold">{h.hazard ?? "—"}</span>
                        {h.initialRisk && (
                          <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${
                            h.initialRisk === "Critical" || h.initialRisk === "High" ? "bg-red-100 text-red-800" :
                            h.initialRisk === "Moderate" ? "bg-amber-100 text-amber-800" :
                            "bg-green-100 text-green-800"
                          }`}>{h.initialRisk}</span>
                        )}
                      </div>
                      {h.controls && <p className="text-xs text-muted-foreground leading-relaxed">{h.controls}</p>}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Contractor sign-off */}
            {sssp.data.pcbu2SignedBy && sssp.data.pcbu2SignedDate && (
              <section className="bg-white border border-border rounded-lg p-5 sm:p-6 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Contractor sign-off</p>
                <p className="text-sm">
                  <span className="font-semibold">{sssp.data.pcbu2SignedBy}</span> signed for {sssp.data.pcbu2?.company ?? "the contractor"} on {format(new Date(sssp.data.pcbu2SignedDate), "d MMM yyyy")}.
                </p>
              </section>
            )}

            {/* Sign-off form */}
            <section className="bg-white border-2 border-primary/40 rounded-lg p-5 sm:p-6 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-widest text-primary mb-3">Your sign-off — PCBU 1</p>
              <p className="text-sm text-muted-foreground mb-4">
                By signing below you acknowledge that this Site-Specific Safety Plan is the appropriate approach to health and safety on this site for the duration of the contract.
              </p>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Your full name</Label>
                  <Input value={signedBy} onChange={e => setSignedBy(e.target.value)} placeholder="Full name" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Draw your signature <span className="text-muted-foreground font-normal">(optional)</span></Label>
                  <SignaturePad value={signatureImage} onChange={(img) => setSignatureImage(img ?? undefined)} />
                  <p className="text-xs text-muted-foreground">Typing your name above is sufficient — drawing is optional.</p>
                </div>
                <Button onClick={submit} disabled={submitting} className="w-full gap-1.5 text-base py-5">
                  {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Signing…</> : <><CheckCircle2 className="w-4 h-4" /> Sign &amp; Submit</>}
                </Button>
              </div>
            </section>

            <p className="text-center text-xs text-muted-foreground pt-2">
              Powered by <span className="font-bold"><span>FOR</span><span className="text-primary">MATE</span></span> — safety paperwork that's faster than a pen.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
