import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { useGetJsa, useUpdateJsa, useDeleteJsa, useLockJsa, getListJsaQueryKey, getGetJsaQueryKey, useListSites } from "@workspace/api-client-react";
import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ArrowLeft, Trash2, FileDown, ClipboardCheck, Plus, X, AlertTriangle, Users, Phone, PenLine, CheckSquare, HardHat, Share2, Copy, CheckCheck, Lock } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

// ─── Types ───────────────────────────────────────────────────────────────────

type JsaStep = {
  step: string;
  hazards: string;
  controls: string;
  risk: string;
  residualRisk: string;
};

type JsaWorker = {
  name: string;
  role: string;
  signedDate: string;
};

type JsaData = {
  date?: string;
  location?: string;
  supervisor?: string;
  supervisorPhone?: string;
  permitRequired?: string;
  permitNumber?: string;
  workDescription?: string;
  ppeRequired?: string[];
  steps?: JsaStep[];
  emergencyPlan?: string;
  nearestHospital?: string;
  hospitalPhone?: string;
  musterPoint?: string;
  workers?: JsaWorker[];
  reviewedBy?: string;
};

// ─── Constants ───────────────────────────────────────────────────────────────

const RISK_LEVELS = ["Low", "Medium", "High", "Critical"];
const PERMIT_OPTIONS = ["No", "Hot Work Permit", "Confined Space Entry Permit", "Excavation Permit", "Electrical Isolation Permit", "Working at Heights Permit", "Other"];
const DEFAULT_PPE = ["Hard Hat", "Hi-Vis Vest", "Safety Boots", "Safety Glasses", "Gloves", "Hearing Protection", "Harness & Lanyard", "Dust Mask P2", "Face Shield", "Cut-Resistant Gloves", "Chemical-Resistant Gloves"];

const riskColor = (r: string) => {
  if (r === "Critical") return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
  if (r === "High") return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300";
  if (r === "Medium") return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300";
  return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
};

const SECTIONS = [
  { id: "job", label: "Job Details", icon: ClipboardCheck },
  { id: "steps", label: "Steps & Hazards", icon: AlertTriangle },
  { id: "ppe", label: "PPE", icon: HardHat },
  { id: "emergency", label: "Emergency", icon: Phone },
  { id: "workers", label: "Sign-off", icon: PenLine },
];

// ─── Component ───────────────────────────────────────────────────────────────

export default function JsaDetail() {
  const [, params] = useRoute("/jsa/:id");
  const [, navigate] = useLocation();
  const id = Number(params?.id);

  const { data: jsa, isLoading } = useGetJsa(id, { query: { enabled: !!id } });
  const { data: sites } = useListSites();
  const updateJsa = useUpdateJsa();
  const deleteJsa = useDeleteJsa();
  const lockJsa = useLockJsa();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [jobName, setJobName] = useState("");
  const [status, setStatus] = useState<"draft" | "active" | "archived">("draft");
  const [data, setData] = useState<JsaData>({});
  const [initialized, setInitialized] = useState(false);
  const [saving, setSaving] = useState(false);
  const [locking, setLocking] = useState(false);
  const [lockDialogOpen, setLockDialogOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("job");
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [sharingLink, setSharingLink] = useState(false);
  const [copied, setCopied] = useState(false);

  const isLocked = !!(jsa?.lockedAt);

  useEffect(() => {
    if (jsa && !initialized) {
      setJobName(jsa.jobName);
      setStatus(jsa.status as "draft" | "active" | "archived");
      setData((jsa.data as JsaData) ?? {});
      setInitialized(true);
    }
  }, [jsa, initialized]);

  const patch = (updates: Partial<JsaData>) => setData(d => ({ ...d, ...updates }));

  const hasSnapshot = !!(jsa?.snapshotPdfKey);

  const downloadPdf = async () => {
    setDownloadingPdf(true);
    try {
      // Locked docs serve the stored snapshot; unlocked docs generate fresh
      const endpoint = isLocked && hasSnapshot
        ? `/api/jsa/${id}/snapshot`
        : `/api/jsa/${id}/pdf`;
      const options: RequestInit = isLocked && hasSnapshot
        ? { credentials: "include" }
        : { method: "POST", credentials: "include" };
      const res = await fetch(endpoint, options);
      if (!res.ok) throw new Error("Failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = isLocked ? `jsa-${id}-locked.pdf` : `jsa-${id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast({ title: "PDF failed", description: "Could not generate PDF", variant: "destructive" });
    } finally {
      setDownloadingPdf(false);
    }
  };

  const save = () => {
    setSaving(true);
    updateJsa.mutate(
      { id, data: { jobName, status, data } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetJsaQueryKey(id) });
          queryClient.invalidateQueries({ queryKey: getListJsaQueryKey() });
          toast({ title: "Saved" });
          setSaving(false);
        },
        onError: () => { toast({ title: "Error", description: "Failed to save", variant: "destructive" }); setSaving(false); },
      }
    );
  };

  const handleDelete = () => {
    if (!confirm("Delete this JSA?")) return;
    deleteJsa.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListJsaQueryKey() });
        navigate("/jsa");
        toast({ title: "Deleted" });
      },
    });
  };

  const handleLock = () => {
    setLocking(true);
    lockJsa.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetJsaQueryKey(id) });
        queryClient.invalidateQueries({ queryKey: getListJsaQueryKey() });
        setLockDialogOpen(false);
        toast({ title: "JSA locked", description: "This document is now the permanent audit record." });
        setLocking(false);
      },
      onError: () => {
        toast({ title: "Error", description: "Could not lock JSA.", variant: "destructive" });
        setLocking(false);
      },
    });
  };

  // Steps
  const addStep = () => patch({
    steps: [...(data.steps ?? []), { step: `Step ${(data.steps ?? []).length + 1}`, hazards: "", controls: "", risk: "Low", residualRisk: "Low" }]
  });
  const updateStep = (i: number, u: Partial<JsaStep>) =>
    patch({ steps: (data.steps ?? []).map((s, idx) => idx === i ? { ...s, ...u } : s) });
  const removeStep = (i: number) => patch({ steps: (data.steps ?? []).filter((_, idx) => idx !== i) });

  const getShareLink = async () => {
    setSharingLink(true);
    try {
      const res = await fetch(`/api/jsa/${id}/share`, { method: "POST", credentials: "include" });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((body as { error?: string }).error ?? "Failed");
      setShareUrl((body as { url: string }).url);
      setShareDialogOpen(true);
    } catch {
      toast({ title: "Couldn't generate link", description: "Try again.", variant: "destructive" });
    } finally {
      setSharingLink(false);
    }
  };

  const copyShareLink = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: "Copy failed", description: "Select the link manually.", variant: "destructive" });
    }
  };

  // Workers
  const addWorker = () => patch({ workers: [...(data.workers ?? []), { name: "", role: "", signedDate: "" }] });
  const updateWorker = (i: number, u: Partial<JsaWorker>) =>
    patch({ workers: (data.workers ?? []).map((w, idx) => idx === i ? { ...w, ...u } : w) });
  const removeWorker = (i: number) => patch({ workers: (data.workers ?? []).filter((_, idx) => idx !== i) });

  const togglePpe = (item: string) => {
    const list = data.ppeRequired ?? [];
    patch({ ppeRequired: list.includes(item) ? list.filter(x => x !== item) : [...list, item] });
  };

  if (isLoading) return (
    <MainLayout>
      <Skeleton className="h-10 w-64 mb-4" />
      <div className="space-y-4 mt-8">{[1,2,3].map(i => <Skeleton key={i} className="h-24 w-full" />)}</div>
    </MainLayout>
  );

  if (!jsa) return (
    <MainLayout>
      <div className="p-12 text-center">
        <p className="text-muted-foreground">JSA not found.</p>
        <Link href="/jsa"><Button variant="outline" className="mt-4">Back</Button></Link>
      </div>
    </MainLayout>
  );

  const siteName = sites?.find(s => s.id === jsa.siteId)?.name;
  const signedCount = (data.workers ?? []).filter(w => w.signedDate).length;
  const totalWorkers = (data.workers ?? []).length;
  const stepCount = (data.steps ?? []).length;
  const highRiskSteps = (data.steps ?? []).filter(s => s.risk === "High" || s.risk === "Critical").length;

  return (
    <MainLayout>
      <div className="mb-6">
        <Link href="/jsa" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4">
          <ArrowLeft className="w-4 h-4" /> JSA
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1">
              <ClipboardCheck className="w-5 h-5 text-primary shrink-0" />
              <Input
                value={jobName}
                onChange={e => setJobName(e.target.value)}
                disabled={isLocked}
                className="text-2xl font-black border-0 border-b border-dashed border-border px-0 rounded-none h-auto text-foreground bg-transparent focus-visible:ring-0 focus-visible:border-primary"
              />
            </div>
            <div className="flex items-center gap-3 mt-1 ml-8 flex-wrap">
              <Badge variant="outline" className="text-xs font-bold border-muted-foreground/40 text-muted-foreground">AU / NZ</Badge>
              {siteName && <span className="text-sm text-muted-foreground font-medium">{siteName}</span>}
              {stepCount > 0 && (
                <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                  {stepCount} step{stepCount !== 1 ? "s" : ""}
                  {highRiskSteps > 0 && <span className="ml-1 text-orange-500 font-semibold">· {highRiskSteps} high risk</span>}
                </span>
              )}
              {totalWorkers > 0 && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <CheckSquare className="w-3 h-3" /> {signedCount}/{totalWorkers} signed
                </span>
              )}
              {isLocked ? (
                <span className="flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-50 border border-green-300 rounded px-2 py-0.5">
                  <Lock className="w-3 h-3" /> Locked
                </span>
              ) : (
                <Select value={status} onValueChange={v => setStatus(v as typeof status)}>
                  <SelectTrigger className="h-6 text-xs w-28 border-0 bg-transparent p-0 focus:ring-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button variant="destructive" size="sm" onClick={handleDelete}><Trash2 className="w-3.5 h-3.5" /></Button>
            <Button variant="outline" size="sm" onClick={downloadPdf} disabled={downloadingPdf} className="gap-1">
              <FileDown className="w-3.5 h-3.5" />
              {downloadingPdf ? "Downloading…" : isLocked ? (hasSnapshot ? "Locked PDF" : "PDF (pending…)") : "PDF"}
            </Button>
            <Button variant="outline" size="sm" onClick={getShareLink} disabled={sharingLink} className="gap-1">
              <Share2 className="w-3.5 h-3.5" /> {sharingLink ? "…" : "Share"}
            </Button>
            {!isLocked && <Button size="sm" onClick={save} disabled={saving}>{saving ? "Saving..." : "Save"}</Button>}
            {!isLocked && (
              <Button size="sm" variant="outline" className="gap-1 border-green-400 text-green-700 hover:bg-green-50" onClick={() => setLockDialogOpen(true)}>
                <Lock className="w-3.5 h-3.5" /> Lock
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 md:gap-6">
        {/* Section nav — vertical sidebar on desktop, horizontal scroll on mobile */}
        <nav className="w-full md:w-44 md:shrink-0">
          <div className="flex md:block gap-1 md:gap-0 md:space-y-1 overflow-x-auto md:overflow-visible md:sticky md:top-4 pb-2 md:pb-0 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-thin">
            {SECTIONS.map(s => (
              <button key={s.id} onClick={() => setActiveSection(s.id)}
                className={`shrink-0 md:w-full whitespace-nowrap flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors text-left ${activeSection === s.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent hover:text-foreground"}`}>
                <s.icon className="w-3.5 h-3.5 shrink-0" />
                {s.label}
              </button>
            ))}
          </div>
        </nav>

        <div className="flex-1 min-w-0 space-y-4">

          {/* Job Details */}
          {activeSection === "job" && (
            <Card className="border-border rounded-sm">
              <CardHeader className="pb-3"><CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Job Details</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold uppercase tracking-wide">Date</Label>
                    <Input type="date" value={data.date ?? ""} onChange={e => patch({ date: e.target.value })} disabled={isLocked} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold uppercase tracking-wide">Work Location</Label>
                    <Input value={data.location ?? ""} onChange={e => patch({ location: e.target.value })} placeholder="e.g. Plant 3 — Conveyor B" disabled={isLocked} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold uppercase tracking-wide">Supervisor</Label>
                    <Input value={data.supervisor ?? ""} onChange={e => patch({ supervisor: e.target.value })} disabled={isLocked} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold uppercase tracking-wide">Supervisor Phone</Label>
                    <Input value={data.supervisorPhone ?? ""} onChange={e => patch({ supervisorPhone: e.target.value })} disabled={isLocked} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold uppercase tracking-wide">Permit Required</Label>
                    <Select value={data.permitRequired ?? "No"} onValueChange={v => patch({ permitRequired: v })} disabled={isLocked}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{PERMIT_OPTIONS.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  {data.permitRequired && data.permitRequired !== "No" && (
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold uppercase tracking-wide">Permit Number</Label>
                      <Input value={data.permitNumber ?? ""} onChange={e => patch({ permitNumber: e.target.value })} placeholder="e.g. HW-2024-042" disabled={isLocked} />
                    </div>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase tracking-wide">Work Description</Label>
                  <textarea
                    className="w-full min-h-20 rounded-md border border-input bg-background px-3 py-2 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60 disabled:cursor-not-allowed"
                    placeholder="Briefly describe the task and scope of work..."
                    value={data.workDescription ?? ""}
                    onChange={e => patch({ workDescription: e.target.value })}
                    disabled={isLocked}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Steps & Hazards */}
          {activeSection === "steps" && (
            <div className="space-y-4">
              {status === "draft" && (
                <div className="flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3">
                  <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-amber-900">Review hazards for today's site</p>
                    <p className="text-xs text-amber-800 mt-0.5">These steps are your trade baseline — not yesterday's job. Add any new hazards you see on this site (other trades nearby, overhead work, changed conditions) and remove steps that don't apply before you sign off.</p>
                  </div>
                </div>
              )}
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">Break the job into steps. For each step, identify hazards, risk level, and control measures.</p>
                {!isLocked && <Button size="sm" variant="outline" onClick={addStep} className="gap-1 shrink-0"><Plus className="w-3.5 h-3.5" /> Add Step</Button>}
              </div>

              {(data.steps ?? []).length === 0 ? (
                <div className="text-center py-10 border-2 border-dashed border-border rounded-lg">
                  <AlertTriangle className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No steps yet. Break the job into sequential tasks.</p>
                  {!isLocked && <Button onClick={addStep} variant="outline" className="mt-3 gap-1"><Plus className="w-3.5 h-3.5" /> Add First Step</Button>}
                </div>
              ) : (
                <div className="space-y-3">
                  {(data.steps ?? []).map((step, i) => (
                    <Card key={i} className="border-border rounded-sm">
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-primary bg-primary/10 rounded px-2 py-0.5 shrink-0">STEP {i + 1}</span>
                          <Input className="h-8 text-sm font-semibold flex-1" value={step.step}
                            onChange={e => updateStep(i, { step: e.target.value })}
                            placeholder="Describe this work step" disabled={isLocked} />
                          {step.residualRisk && <Badge className={`text-xs shrink-0 border-0 ${riskColor(step.residualRisk)}`}>{step.residualRisk}</Badge>}
                          {!isLocked && <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                            onClick={() => removeStep(i)}><X className="w-3.5 h-3.5" /></Button>}
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs font-semibold">Hazards / Risks</Label>
                          <textarea className="w-full min-h-16 rounded-md border border-input bg-background px-3 py-2 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60 disabled:cursor-not-allowed"
                            placeholder="What could go wrong? What hazards exist?"
                            value={step.hazards} onChange={e => updateStep(i, { hazards: e.target.value })} disabled={isLocked} />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs font-semibold">Initial Risk</Label>
                            <Select value={step.risk} onValueChange={v => updateStep(i, { risk: v })} disabled={isLocked}>
                              <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                              <SelectContent>{RISK_LEVELS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs font-semibold">Residual Risk</Label>
                            <Select value={step.residualRisk} onValueChange={v => updateStep(i, { residualRisk: v })} disabled={isLocked}>
                              <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                              <SelectContent>{RISK_LEVELS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs font-semibold">Control Measures</Label>
                          <textarea className="w-full min-h-16 rounded-md border border-input bg-background px-3 py-2 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60 disabled:cursor-not-allowed"
                            placeholder="How will the hazard be controlled? PPE, barriers, training, procedures..."
                            value={step.controls} onChange={e => updateStep(i, { controls: e.target.value })} disabled={isLocked} />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* PPE */}
          {activeSection === "ppe" && (
            <Card className="border-border rounded-sm">
              <CardHeader className="pb-3"><CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">PPE Required for This Job</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {status === "draft" && (
                  <div className="flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3">
                    <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                    <p className="text-xs text-amber-800">Tick only what's actually required for this job. Untick anything that doesn't apply — your PPE selection is part of the legal record.</p>
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {DEFAULT_PPE.map(item => (
                    <label key={item} className={`flex items-center gap-2.5 ${isLocked ? "cursor-default" : "cursor-pointer"}`}>
                      <input type="checkbox" className="w-4 h-4 accent-primary"
                        checked={(data.ppeRequired ?? []).includes(item)}
                        onChange={() => togglePpe(item)} disabled={isLocked} />
                      <span className="text-sm">{item}</span>
                    </label>
                  ))}
                </div>
                {!isLocked && <CustomItemAdder label="Add custom PPE" onAdd={v => {
                  if (!v.trim()) return;
                  patch({ ppeRequired: [...(data.ppeRequired ?? []), v.trim()] });
                }} />}
              </CardContent>
            </Card>
          )}

          {/* Emergency */}
          {activeSection === "emergency" && (
            <Card className="border-border rounded-sm">
              <CardHeader className="pb-3"><CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Emergency Procedures</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold uppercase tracking-wide">Nearest Hospital / Medical</Label>
                    <Input value={data.nearestHospital ?? ""} onChange={e => patch({ nearestHospital: e.target.value })} disabled={isLocked} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold uppercase tracking-wide">Hospital / Emergency Phone</Label>
                    <Input value={data.hospitalPhone ?? ""} onChange={e => patch({ hospitalPhone: e.target.value })} placeholder="000" disabled={isLocked} />
                  </div>
                  <div className="space-y-1.5 col-span-2">
                    <Label className="text-xs font-bold uppercase tracking-wide">Muster / Assembly Point</Label>
                    <Input value={data.musterPoint ?? ""} onChange={e => patch({ musterPoint: e.target.value })} disabled={isLocked} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase tracking-wide">Emergency Actions</Label>
                  <textarea className="w-full min-h-24 rounded-md border border-input bg-background px-3 py-2 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60 disabled:cursor-not-allowed"
                    placeholder="What to do in an emergency — who to call, where to go, evacuation steps..."
                    value={data.emergencyPlan ?? ""} onChange={e => patch({ emergencyPlan: e.target.value })} disabled={isLocked} />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Worker Sign-off */}
          {activeSection === "workers" && (
            <Card className="border-border rounded-sm">
              <CardHeader className="pb-3 flex-row items-start justify-between">
                <div>
                  <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Worker Sign-off</CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">All crew members must sign to confirm they have read, understood, and agree to work in accordance with this JSA.</p>
                </div>
                {!isLocked && <Button size="sm" variant="outline" onClick={addWorker} className="gap-1 shrink-0"><Plus className="w-3.5 h-3.5" /> Add Worker</Button>}
              </CardHeader>
              <CardContent className="space-y-3">
                {(data.workers ?? []).map((w, i) => (
                  <div key={i} className={`p-3 border rounded-sm ${w.signedDate ? "border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-900/10" : "border-border"}`}>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                      <div className="space-y-1">
                        <Label className="text-xs font-semibold">Name</Label>
                        <Input className="h-8 text-sm" value={w.name} onChange={e => updateWorker(i, { name: e.target.value })} placeholder="Full name" disabled={isLocked} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs font-semibold">Role / Trade</Label>
                        <Input className="h-8 text-sm" value={w.role} onChange={e => updateWorker(i, { role: e.target.value })} placeholder="e.g. Operator" disabled={isLocked} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs font-semibold">Date Signed</Label>
                        <div className="flex gap-1">
                          <Input type="date" className="h-8 text-sm flex-1" value={w.signedDate} onChange={e => updateWorker(i, { signedDate: e.target.value })} disabled={isLocked} />
                          {!isLocked && <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive" onClick={() => removeWorker(i)}>
                            <X className="w-3.5 h-3.5" />
                          </Button>}
                        </div>
                      </div>
                    </div>
                    {!isLocked && !w.signedDate && w.name && (
                      <Button size="sm" variant="outline" className="mt-2 h-7 text-xs gap-1"
                        onClick={() => updateWorker(i, { signedDate: format(new Date(), "yyyy-MM-dd") })}>
                        <CheckSquare className="w-3 h-3" /> Sign Today
                      </Button>
                    )}
                  </div>
                ))}
                {(data.workers ?? []).length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="w-8 h-8 mx-auto mb-2" />
                    <p className="text-sm">No workers added yet.</p>
                  </div>
                )}
                {totalWorkers > 0 && (
                  <div className="text-right text-xs text-muted-foreground pt-2 border-t border-border">
                    {signedCount} of {totalWorkers} workers have signed
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {!isLocked && (
            <div className="flex justify-end pt-2">
              <Button onClick={save} disabled={saving} size="sm">{saving ? "Saving..." : "Save Changes"}</Button>
            </div>
          )}
        </div>
      </div>
      {/* ── Lock Confirmation Dialog ── */}
      <Dialog open={lockDialogOpen} onOpenChange={setLockDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Lock className="w-4 h-4 text-green-600" /> Lock this JSA?</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">
              Locking makes this JSA <strong>permanently read-only</strong> — no further edits will be possible. This creates a tamper-proof audit record for compliance purposes.
            </p>
            <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded p-2">
              ⚠ This cannot be undone. Only lock once the job is complete and all workers have signed.
            </p>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setLockDialogOpen(false)} disabled={locking}>Cancel</Button>
            <Button className="gap-1 bg-green-600 hover:bg-green-700 text-white" onClick={handleLock} disabled={locking}>
              <Lock className="w-3.5 h-3.5" /> {locking ? "Locking…" : "Lock Document"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* ── Share / Sign-off Link Dialog ── */}
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Share Sign-off Link</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">
              Send this link to your supervisor or principal contractor. They can review the JSA and sign off without needing a Formate account.
            </p>
            <div className="flex items-center gap-2">
              <Input readOnly value={shareUrl} className="text-xs font-mono bg-muted" onClick={e => (e.target as HTMLInputElement).select()} />
              <Button variant="outline" size="sm" onClick={copyShareLink} className="shrink-0 gap-1.5">
                {copied ? <><CheckCheck className="w-4 h-4 text-green-600" /> Copied</> : <><Copy className="w-4 h-4" /> Copy</>}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">The link works permanently — same URL each time you share.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShareDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}

function CustomItemAdder({ label, onAdd }: { label: string; onAdd: (v: string) => void }) {
  const [value, setValue] = useState("");
  return (
    <div className="flex gap-2 mt-2">
      <Input className="h-8 text-sm flex-1" placeholder={label} value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={e => { if (e.key === "Enter") { onAdd(value); setValue(""); } }} />
      <Button variant="outline" size="sm" onClick={() => { onAdd(value); setValue(""); }}>
        <Plus className="w-3.5 h-3.5" />
      </Button>
    </div>
  );
}
