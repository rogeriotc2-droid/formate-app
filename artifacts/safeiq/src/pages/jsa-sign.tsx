import { useEffect, useState } from "react";
import { useRoute } from "wouter";
import { Shield, CheckCircle2, AlertTriangle, Loader2, ClipboardCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SignaturePad } from "@/components/signature-pad";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

type JsaStep = { step: string; hazards: string; risk: string; residualRisk: string; controls: string };
type JsaPublic = {
  id: number;
  jobName: string;
  status: string;
  data: {
    date?: string;
    location?: string;
    supervisor?: string;
    supervisorPhone?: string;
    workDescription?: string;
    steps?: JsaStep[];
    ppeRequired?: string[];
    workers?: { name: string; role: string; signedDate: string }[];
    principalSignedBy?: string;
    principalSignedDate?: string;
  };
};

const riskCls = (r?: string) =>
  r === "Critical" || r === "High" ? "bg-red-100 text-red-800" :
  r === "Medium" ? "bg-amber-100 text-amber-800" :
  "bg-green-100 text-green-800";

export default function JsaSignPage() {
  const [, params] = useRoute("/jsa-sign/:token");
  const token = params?.token ?? "";
  const { toast } = useToast();

  const [jsa, setJsa] = useState<JsaPublic | null>(null);
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
        const res = await fetch(`/api/public/jsa/sign/${token}`);
        const body = await res.json().catch(() => ({}));
        if (!alive) return;
        if (!res.ok) {
          setError((body as { error?: string }).error ?? `Couldn't load (HTTP ${res.status})`);
        } else {
          const data = body as JsaPublic;
          setJsa(data);
          if (data.data.principalSignedBy && data.data.principalSignedDate) setDone(true);
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
      const res = await fetch(`/api/public/jsa/sign/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signedBy: signedBy.trim(), signatureImage }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}`);
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
          <span className="ml-2 text-xs text-white/60">Job Safety Analysis · Sign-off</span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 sm:px-6 py-6 sm:py-10">
        {loading && (
          <div className="flex items-center justify-center py-20 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading JSA…
          </div>
        )}

        {!loading && error && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-6 text-center">
            <AlertTriangle className="w-10 h-10 text-amber-600 mx-auto mb-3" />
            <p className="font-semibold text-amber-900 mb-1">Link no longer valid</p>
            <p className="text-sm text-amber-800">{error}</p>
            <p className="text-xs text-amber-700 mt-4">Ask the contractor to resend the JSA sign-off link.</p>
          </div>
        )}

        {!loading && !error && jsa && done && (
          <div className="rounded-lg border border-green-200 bg-green-50 p-8 text-center">
            <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-3" />
            <p className="text-lg font-bold text-green-900 mb-1">
              Signed — thanks{signedBy ? `, ${signedBy.split(" ")[0]}` : ""}
            </p>
            <p className="text-sm text-green-800">
              Your sign-off has been recorded for "<strong>{jsa.jobName}</strong>".
            </p>
            {jsa.data.principalSignedDate && (
              <p className="text-xs text-green-700 mt-2">
                Signed {format(new Date(jsa.data.principalSignedDate), "d MMM yyyy")}
                {jsa.data.principalSignedBy ? ` by ${jsa.data.principalSignedBy}` : ""}
              </p>
            )}
          </div>
        )}

        {!loading && !error && jsa && !done && (
          <div className="space-y-5">
            {/* Job summary */}
            <section className="bg-white border border-border rounded-lg p-5 sm:p-6 shadow-sm">
              <div className="flex items-start gap-3 mb-4">
                <ClipboardCheck className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Job Safety Analysis</p>
                  <h1 className="text-xl sm:text-2xl font-black text-foreground leading-tight">{jsa.jobName}</h1>
                </div>
              </div>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                {jsa.data.location && (
                  <div>
                    <dt className="text-xs font-semibold text-muted-foreground uppercase">Work Location</dt>
                    <dd className="text-foreground">{jsa.data.location}</dd>
                  </div>
                )}
                {jsa.data.date && (
                  <div>
                    <dt className="text-xs font-semibold text-muted-foreground uppercase">Date</dt>
                    <dd className="text-foreground">{format(new Date(jsa.data.date), "d MMM yyyy")}</dd>
                  </div>
                )}
                {jsa.data.supervisor && (
                  <div>
                    <dt className="text-xs font-semibold text-muted-foreground uppercase">Supervisor</dt>
                    <dd className="text-foreground">
                      {jsa.data.supervisor}
                      {jsa.data.supervisorPhone ? ` · ${jsa.data.supervisorPhone}` : ""}
                    </dd>
                  </div>
                )}
                {jsa.data.workDescription && (
                  <div className="sm:col-span-2">
                    <dt className="text-xs font-semibold text-muted-foreground uppercase">Work Description</dt>
                    <dd className="text-foreground whitespace-pre-wrap">{jsa.data.workDescription}</dd>
                  </div>
                )}
              </dl>
            </section>

            {/* Steps & hazards summary */}
            {(jsa.data.steps ?? []).length > 0 && (
              <section className="bg-white border border-border rounded-lg p-5 sm:p-6 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
                  Steps &amp; Hazards — {jsa.data.steps!.length} identified
                </p>
                <div className="space-y-2">
                  {jsa.data.steps!.map((s, i) => (
                    <div key={i} className="border border-border rounded-md p-3 text-sm">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="font-semibold">
                          <span className="text-xs text-primary font-black mr-2">STEP {i + 1}</span>
                          {s.step}
                        </span>
                        {s.residualRisk && (
                          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full shrink-0 ${riskCls(s.residualRisk)}`}>
                            {s.residualRisk}
                          </span>
                        )}
                      </div>
                      {s.hazards && <p className="text-xs text-muted-foreground">{s.hazards}</p>}
                      {s.controls && <p className="text-xs text-foreground/80 mt-1">Controls: {s.controls}</p>}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Worker sign-offs already recorded */}
            {(jsa.data.workers ?? []).filter(w => w.signedDate).length > 0 && (
              <section className="bg-white border border-border rounded-lg p-5 sm:p-6 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
                  Worker Sign-offs Recorded
                </p>
                <div className="space-y-1.5">
                  {(jsa.data.workers ?? []).filter(w => w.signedDate).map((w, i) => (
                    <div key={i} className="flex items-center justify-between text-sm border-b border-border pb-1.5">
                      <span>{w.name} <span className="text-muted-foreground text-xs">· {w.role}</span></span>
                      <span className="text-xs text-green-700 font-semibold">{format(new Date(w.signedDate), "d MMM yyyy")}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Principal sign-off form */}
            <section className="bg-white border-2 border-primary/40 rounded-lg p-5 sm:p-6 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-widest text-primary mb-3">Principal / Supervisor Sign-off</p>
              <p className="text-sm text-muted-foreground mb-4">
                By signing below you confirm this Job Safety Analysis has been reviewed and the identified hazards, risks and controls are adequate for the work to proceed safely.
              </p>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Your full name</Label>
                  <Input value={signedBy} onChange={e => setSignedBy(e.target.value)} placeholder="Full name" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Draw your signature <span className="text-muted-foreground font-normal">(optional)</span></Label>
                  <SignaturePad value={signatureImage} onChange={img => setSignatureImage(img ?? undefined)} />
                  <p className="text-xs text-muted-foreground">Typing your name above is sufficient — drawing is optional.</p>
                </div>
                <Button onClick={submit} disabled={submitting} className="w-full gap-1.5 text-base py-5">
                  {submitting
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Signing…</>
                    : <><CheckCircle2 className="w-4 h-4" /> Sign &amp; Submit</>}
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
