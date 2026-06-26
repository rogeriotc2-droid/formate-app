import { useEffect, useState } from "react";
import { useRoute } from "wouter";
import { Shield, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SignaturePad } from "@/components/signature-pad";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

type HazardControl = {
  step: string;
  hazard: string;
  initialRisk: string;
  residualRisk: string;
  controlMeasures: { eliminate?: string; substitute?: string; isolate?: string; engineer?: string; admin?: string; ppe?: string };
};

type SwmsPublic = {
  id: number;
  activityName: string;
  status: string;
  data: {
    workLocation?: string;
    pcbu?: string;
    projectName?: string;
    supervisor?: string;
    supervisorPhone?: string;
    startDate?: string;
    principalContractor?: string;
    steps?: HazardControl[];
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

export default function SwmsSignPage() {
  const [, params] = useRoute("/swms-sign/:token");
  const token = params?.token ?? "";
  const { toast } = useToast();

  const [swms, setSwms] = useState<SwmsPublic | null>(null);
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
        const res = await fetch(`/api/public/swms/sign/${token}`);
        const body = await res.json().catch(() => ({}));
        if (!alive) return;
        if (!res.ok) {
          setError((body as { error?: string }).error ?? `Couldn't load (HTTP ${res.status})`);
        } else {
          const data = body as SwmsPublic;
          setSwms(data);
          if (data.data.principalSignedBy && data.data.principalSignedDate) {
            setSignedBy(data.data.principalSignedBy);
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
      const res = await fetch(`/api/public/swms/sign/${token}`, {
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
          <span className="ml-2 text-xs text-white/60">Safe Work Method Statement · Principal Sign-off</span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 sm:px-6 py-6 sm:py-10">
        {loading && (
          <div className="flex items-center justify-center py-20 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading SWMS…
          </div>
        )}

        {!loading && error && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-6 text-center">
            <AlertTriangle className="w-10 h-10 text-amber-600 mx-auto mb-3" />
            <p className="font-semibold text-amber-900 mb-1">Link no longer valid</p>
            <p className="text-sm text-amber-800">{error}</p>
            <p className="text-xs text-amber-700 mt-4">Ask the contractor to resend the SWMS sign-off link.</p>
          </div>
        )}

        {!loading && !error && swms && done && (
          <div className="rounded-lg border border-green-200 bg-green-50 p-8 text-center">
            <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-3" />
            <p className="text-lg font-bold text-green-900 mb-1">
              Signed — thanks{signedBy ? `, ${signedBy.split(" ")[0]}` : ""}
            </p>
            <p className="text-sm text-green-800">
              Your sign-off has been recorded for "<strong>{swms.activityName}</strong>".
            </p>
            {swms.data.principalSignedDate && (
              <p className="text-xs text-green-700 mt-2">
                Signed {format(new Date(swms.data.principalSignedDate), "d MMM yyyy")}
                {swms.data.principalSignedBy ? ` by ${swms.data.principalSignedBy}` : ""}
              </p>
            )}
            <p className="text-xs text-green-700 mt-3">
              Under the WHS Act 2011, high-risk construction work must not commence until the SWMS has been reviewed and workers consulted. This sign-off records that review.
            </p>
          </div>
        )}

        {!loading && !error && swms && !done && (
          <div className="space-y-5">
            {/* SWMS summary */}
            <section className="bg-white border border-border rounded-lg p-5 sm:p-6 shadow-sm">
              <div className="flex items-start gap-3 mb-4">
                <Shield className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Safe Work Method Statement · AU WHS Act 2011</p>
                  <h1 className="text-xl sm:text-2xl font-black text-foreground leading-tight">{swms.activityName}</h1>
                  {swms.data.pcbu && (
                    <p className="text-sm text-muted-foreground mt-0.5">From {swms.data.pcbu}</p>
                  )}
                </div>
              </div>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                {swms.data.workLocation && (
                  <div>
                    <dt className="text-xs font-semibold text-muted-foreground uppercase">Work Location</dt>
                    <dd className="text-foreground">{swms.data.workLocation}</dd>
                  </div>
                )}
                {swms.data.projectName && (
                  <div>
                    <dt className="text-xs font-semibold text-muted-foreground uppercase">Project</dt>
                    <dd className="text-foreground">{swms.data.projectName}</dd>
                  </div>
                )}
                {swms.data.startDate && (
                  <div>
                    <dt className="text-xs font-semibold text-muted-foreground uppercase">Start Date</dt>
                    <dd className="text-foreground">{format(new Date(swms.data.startDate), "d MMM yyyy")}</dd>
                  </div>
                )}
                {swms.data.supervisor && (
                  <div>
                    <dt className="text-xs font-semibold text-muted-foreground uppercase">Supervisor</dt>
                    <dd className="text-foreground">
                      {swms.data.supervisor}
                      {swms.data.supervisorPhone ? ` · ${swms.data.supervisorPhone}` : ""}
                    </dd>
                  </div>
                )}
                {swms.data.principalContractor && (
                  <div className="sm:col-span-2">
                    <dt className="text-xs font-semibold text-muted-foreground uppercase">Principal Contractor</dt>
                    <dd className="text-foreground font-semibold">{swms.data.principalContractor}</dd>
                  </div>
                )}
              </dl>
            </section>

            {/* Hazard controls summary */}
            {(swms.data.steps ?? []).length > 0 && (
              <section className="bg-white border border-border rounded-lg p-5 sm:p-6 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
                  Hazard Controls — {swms.data.steps!.length} step{swms.data.steps!.length !== 1 ? "s" : ""}
                </p>
                <div className="space-y-2">
                  {swms.data.steps!.map((s, i) => {
                    const controls = [
                      s.controlMeasures.eliminate && `Eliminate: ${s.controlMeasures.eliminate}`,
                      s.controlMeasures.substitute && `Substitute: ${s.controlMeasures.substitute}`,
                      s.controlMeasures.isolate && `Isolate: ${s.controlMeasures.isolate}`,
                      s.controlMeasures.engineer && `Engineer: ${s.controlMeasures.engineer}`,
                      s.controlMeasures.admin && `Admin: ${s.controlMeasures.admin}`,
                      s.controlMeasures.ppe && `PPE: ${s.controlMeasures.ppe}`,
                    ].filter(Boolean);
                    return (
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
                        {s.hazard && <p className="text-xs text-muted-foreground mb-1">{s.hazard}</p>}
                        {controls.length > 0 && (
                          <ul className="text-xs text-foreground/80 space-y-0.5 ml-2">
                            {controls.map((c, j) => <li key={j}>• {c}</li>)}
                          </ul>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Worker sign-offs already recorded */}
            {(swms.data.workers ?? []).filter(w => w.signedDate).length > 0 && (
              <section className="bg-white border border-border rounded-lg p-5 sm:p-6 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
                  Worker Sign-offs Recorded
                </p>
                <div className="space-y-1.5">
                  {(swms.data.workers ?? []).filter(w => w.signedDate).map((w, i) => (
                    <div key={i} className="flex items-center justify-between text-sm border-b border-border pb-1.5">
                      <span>{w.name} <span className="text-muted-foreground text-xs">· {w.role}</span></span>
                      <span className="text-xs text-green-700 font-semibold">{format(new Date(w.signedDate), "d MMM yyyy")}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Legal notice */}
            <section className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-900">
              <p className="font-semibold mb-1">WHS Act 2011 — Principal Contractor obligation</p>
              <p className="text-xs leading-relaxed">
                Under the Work Health and Safety Act 2011, you must not direct or allow high-risk construction work to commence unless a SWMS is in place and has been reviewed. By signing below you confirm this SWMS is adequate for the work to proceed safely.
              </p>
            </section>

            {/* Sign-off form */}
            <section className="bg-white border-2 border-primary/40 rounded-lg p-5 sm:p-6 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-widest text-primary mb-3">Principal Contractor Sign-off</p>
              <p className="text-sm text-muted-foreground mb-4">
                By signing below you confirm this SWMS has been reviewed and the hazards, risks and controls are appropriate for the work described.
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
