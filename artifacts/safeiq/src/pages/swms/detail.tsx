import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { useGetSwms, useUpdateSwms, useDeleteSwms, useLockSwms, getListSwmsQueryKey, getGetSwmsQueryKey, useListSites } from "@workspace/api-client-react";
import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import {
  ArrowLeft, Trash2, FileDown, Shield, Plus, X,
  AlertTriangle, Users, Phone, HardHat, BookOpen, ClipboardList, PenLine, CheckSquare, Mail, Share2, Copy, CheckCheck, Lock
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

// ─── Types ──────────────────────────────────────────────────────────────────

type HazardControl = {
  step: string;
  hazard: string;
  personsAtRisk: string;
  initialLikelihood: string;
  initialConsequence: string;
  initialRisk: string;
  controlMeasures: {
    eliminate?: string;
    substitute?: string;
    isolate?: string;
    engineer?: string;
    admin?: string;
    ppe?: string;
  };
  residualRisk: string;
};

type Worker = {
  name: string;
  role: string;
  signedDate: string;
};

type SwmsData = {
  hrceType?: string;
  pcbu?: string;
  projectName?: string;
  workLocation?: string;
  supervisor?: string;
  supervisorPhone?: string;
  startDate?: string;
  principalContractor?: string;
  principalContractorEmail?: string;
  licencesRequired?: string[];
  plantsEquipment?: string[];
  ppeRequired?: string[];
  steps?: HazardControl[];
  nearestHospital?: string;
  hospitalAddress?: string;
  hospitalPhone?: string;
  musterPoint?: string;
  emergencyContacts?: { name: string; role: string; phone: string }[];
  reviewDate?: string;
  preparedBy?: string;
  workers?: Worker[];
};

// ─── Constants ───────────────────────────────────────────────────────────────

const RISK_LEVELS = ["Low", "Medium", "High", "Critical"];
const DEFAULT_PPE = ["Hard Hat", "Hi-Vis Vest", "Safety Boots", "Safety Glasses", "Gloves", "Hearing Protection", "Harness & Lanyard", "Face Shield", "Dust Mask P2", "Cut-Resistant Gloves"];
const DEFAULT_LICENCES = ["White Card (General Construction Induction)", "High Risk Work Licence - Scaffolding", "High Risk Work Licence - Rigging", "High Risk Work Licence - Crane Operation", "Electrical Licence", "Confined Space Entry Certificate", "Asbestos Removalist Licence", "First Aid Certificate"];
const DEFAULT_PLANT = ["Scaffolding", "EWP / Scissor Lift", "Forklift", "Crane", "Excavator", "Concrete Pump", "Angle Grinder", "Power Tools", "Generator"];

const riskColor = (r: string) => {
  if (r === "Critical") return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
  if (r === "High") return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300";
  if (r === "Medium") return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300";
  return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
};

const SECTIONS = [
  { id: "activity", label: "Activity", icon: ClipboardList },
  { id: "hazards", label: "Hazard Controls", icon: AlertTriangle },
  { id: "ppe", label: "PPE & Equipment", icon: HardHat },
  { id: "licences", label: "Licences", icon: BookOpen },
  { id: "emergency", label: "Emergency", icon: Phone },
  { id: "workers", label: "Worker Sign-off", icon: PenLine },
];

// ─── Component ───────────────────────────────────────────────────────────────

export default function SwmsDetail() {
  const [, params] = useRoute("/swms/:id");
  const [, navigate] = useLocation();
  const id = Number(params?.id);

  const { data: swms, isLoading } = useGetSwms(id, { query: { enabled: !!id } });
  const { data: sites } = useListSites();
  const updateSwms = useUpdateSwms();
  const deleteSwms = useDeleteSwms();
  const lockSwms = useLockSwms();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [activityName, setActivityName] = useState("");
  const [status, setStatus] = useState<"draft" | "active" | "archived">("draft");
  const [data, setData] = useState<SwmsData>({});
  const [initialized, setInitialized] = useState(false);
  const [saving, setSaving] = useState(false);
  const [locking, setLocking] = useState(false);
  const [lockDialogOpen, setLockDialogOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("activity");
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [sharingLink, setSharingLink] = useState(false);
  const [copied, setCopied] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSentFlash, setEmailSentFlash] = useState(false);

  const isLocked = !!(swms?.lockedAt);

  useEffect(() => {
    if (swms && !initialized) {
      setActivityName(swms.activityName);
      setStatus(swms.status as "draft" | "active" | "archived");
      setData((swms.data as SwmsData) ?? {});
      setInitialized(true);
    }
  }, [swms, initialized]);

  const patch = (updates: Partial<SwmsData>) => setData(d => ({ ...d, ...updates }));

  const hasSnapshot = !!(swms?.snapshotPdfKey);

  const downloadPdf = async () => {
    setDownloadingPdf(true);
    try {
      // Locked docs serve the stored snapshot; unlocked docs generate fresh
      const endpoint = isLocked && hasSnapshot
        ? `/api/swms/${id}/snapshot`
        : `/api/swms/${id}/pdf`;
      const options: RequestInit = isLocked && hasSnapshot
        ? { credentials: "include" }
        : { method: "POST", credentials: "include" };
      const res = await fetch(endpoint, options);
      if (!res.ok) throw new Error("Failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = isLocked ? `swms-${id}-locked.pdf` : `swms-${id}.pdf`;
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
    updateSwms.mutate(
      { id, data: { activityName, status, data } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetSwmsQueryKey(id) });
          queryClient.invalidateQueries({ queryKey: getListSwmsQueryKey() });
          toast({ title: "Saved" });
          setSaving(false);
        },
        onError: () => { toast({ title: "Error", description: "Failed to save", variant: "destructive" }); setSaving(false); },
      }
    );
  };

  const getShareLink = async () => {
    setSharingLink(true);
    try {
      const res = await fetch(`/api/swms/${id}/share`, { method: "POST", credentials: "include" });
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

  const handleDelete = () => {
    if (!confirm("Delete this SWMS?")) return;
    deleteSwms.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListSwmsQueryKey() });
        navigate("/swms");
        toast({ title: "Deleted" });
      },
    });
  };

  const handleLock = () => {
    setLocking(true);
    lockSwms.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetSwmsQueryKey(id) });
        queryClient.invalidateQueries({ queryKey: getListSwmsQueryKey() });
        setLockDialogOpen(false);
        toast({ title: "SWMS locked", description: "This document is now the permanent audit record." });
        setLocking(false);
      },
      onError: () => {
        toast({ title: "Error", description: "Could not lock SWMS.", variant: "destructive" });
        setLocking(false);
      },
    });
  };

  // Hazard steps
  const addStep = () => patch({
    steps: [...(data.steps ?? []), {
      step: `Step ${(data.steps ?? []).length + 1}`,
      hazard: "", personsAtRisk: "",
      initialLikelihood: "Low", initialConsequence: "Low", initialRisk: "Low",
      controlMeasures: {}, residualRisk: "Low",
    }]
  });
  const updateStep = (i: number, u: Partial<HazardControl>) =>
    patch({ steps: (data.steps ?? []).map((s, idx) => idx === i ? { ...s, ...u } : s) });
  const removeStep = (i: number) => patch({ steps: (data.steps ?? []).filter((_, idx) => idx !== i) });

  // Workers
  const addWorker = () => patch({ workers: [...(data.workers ?? []), { name: "", role: "", signedDate: "" }] });
  const updateWorker = (i: number, u: Partial<Worker>) =>
    patch({ workers: (data.workers ?? []).map((w, idx) => idx === i ? { ...w, ...u } : w) });
  const removeWorker = (i: number) => patch({ workers: (data.workers ?? []).filter((_, idx) => idx !== i) });

  // Emergency contacts
  const addEContact = () => patch({ emergencyContacts: [...(data.emergencyContacts ?? []), { name: "", role: "", phone: "" }] });
  const updateEContact = (i: number, u: Partial<{ name: string; role: string; phone: string }>) =>
    patch({ emergencyContacts: (data.emergencyContacts ?? []).map((c, idx) => idx === i ? { ...c, ...u } : c) });
  const removeEContact = (i: number) => patch({ emergencyContacts: (data.emergencyContacts ?? []).filter((_, idx) => idx !== i) });

  const toggleListItem = (key: "ppeRequired" | "licencesRequired" | "plantsEquipment", item: string) => {
    const list = (data[key] as string[]) ?? [];
    patch({ [key]: list.includes(item) ? list.filter((x: string) => x !== item) : [...list, item] });
  };

  const addCustomItem = (key: "ppeRequired" | "licencesRequired" | "plantsEquipment", value: string) => {
    if (!value.trim()) return;
    patch({ [key]: [...((data[key] as string[]) ?? []), value.trim()] });
  };

  if (isLoading) return (
    <MainLayout>
      <Skeleton className="h-10 w-64 mb-4" />
      <div className="space-y-4 mt-8">{[1,2,3].map(i => <Skeleton key={i} className="h-24 w-full" />)}</div>
    </MainLayout>
  );

  if (!swms) return (
    <MainLayout>
      <div className="p-12 text-center">
        <p className="text-muted-foreground">SWMS not found.</p>
        <Link href="/swms"><Button variant="outline" className="mt-4">Back</Button></Link>
      </div>
    </MainLayout>
  );

  const siteName = sites?.find(s => s.id === swms.siteId)?.name;
  const signedCount = (data.workers ?? []).filter(w => w.signedDate).length;
  const totalWorkers = (data.workers ?? []).length;

  return (
    <MainLayout>
      <div className="mb-6">
        <Link href="/swms" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4">
          <ArrowLeft className="w-4 h-4" /> SWMS
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1">
              <Shield className="w-5 h-5 text-primary shrink-0" />
              <Input
                value={activityName}
                onChange={e => setActivityName(e.target.value)}
                disabled={isLocked}
                className="text-2xl font-black border-0 border-b border-dashed border-border px-0 rounded-none h-auto text-foreground bg-transparent focus-visible:ring-0 focus-visible:border-primary"
              />
            </div>
            <div className="flex items-center gap-3 mt-1 ml-8 flex-wrap">
              <Badge variant="outline" className="text-xs font-bold border-primary/40 text-primary">AU — WHS Act 2011</Badge>
              {siteName && <span className="text-sm text-muted-foreground font-medium">{siteName}</span>}
              {data.hrceType && <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{data.hrceType}</span>}
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
            <Button
              variant={emailSentFlash ? "default" : "outline"}
              size="sm"
              className={`gap-1 transition-colors ${emailSentFlash ? "bg-green-600 hover:bg-green-600 text-white border-green-600" : ""}`}
              onClick={() => {
                setRecipientEmail(data.principalContractorEmail ?? "");
                setRecipientName(data.principalContractor ?? "");
                setEmailDialogOpen(true);
              }}
            >
              <Mail className="w-3.5 h-3.5" />
              {emailSentFlash ? "Sent ✓" : "Email Principal"}
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

          {/* Activity Details */}
          {activeSection === "activity" && (
            <Card className="border-border rounded-sm">
              <CardHeader className="pb-3"><CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Activity Details</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold uppercase tracking-wide">PCBU / Company</Label>
                    <Input value={data.pcbu ?? ""} onChange={e => patch({ pcbu: e.target.value })} placeholder="Your company name" disabled={isLocked} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold uppercase tracking-wide">Principal Contractor</Label>
                    <Input value={data.principalContractor ?? ""} onChange={e => patch({ principalContractor: e.target.value })} disabled={isLocked} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold uppercase tracking-wide">Principal Contractor Email</Label>
                    <Input type="email" value={data.principalContractorEmail ?? ""} onChange={e => patch({ principalContractorEmail: e.target.value })} placeholder="email@example.com" disabled={isLocked} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold uppercase tracking-wide">Project Name</Label>
                    <Input value={data.projectName ?? ""} onChange={e => patch({ projectName: e.target.value })} disabled={isLocked} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold uppercase tracking-wide">Work Location</Label>
                    <Input value={data.workLocation ?? ""} onChange={e => patch({ workLocation: e.target.value })} placeholder="e.g. Level 4, East Wing" disabled={isLocked} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold uppercase tracking-wide">Supervisor / Competent Person</Label>
                    <Input value={data.supervisor ?? ""} onChange={e => patch({ supervisor: e.target.value })} disabled={isLocked} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold uppercase tracking-wide">Supervisor Phone</Label>
                    <Input value={data.supervisorPhone ?? ""} onChange={e => patch({ supervisorPhone: e.target.value })} disabled={isLocked} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold uppercase tracking-wide">Start Date</Label>
                    <Input type="date" value={data.startDate ?? ""} onChange={e => patch({ startDate: e.target.value })} disabled={isLocked} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold uppercase tracking-wide">Review Date</Label>
                    <Input type="date" value={data.reviewDate ?? ""} onChange={e => patch({ reviewDate: e.target.value })} disabled={isLocked} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold uppercase tracking-wide">Prepared By</Label>
                    <Input value={data.preparedBy ?? ""} onChange={e => patch({ preparedBy: e.target.value })} disabled={isLocked} />
                  </div>
                </div>
                <div className="p-3 bg-muted/40 border border-border rounded-sm text-xs text-muted-foreground space-y-1">
                  <p><strong className="text-foreground">Legislative reference:</strong> Work Health and Safety Act 2011 (Cth); Work Health and Safety Regulation 2017, Division 6 — Safe Work Method Statements</p>
                  <p><strong className="text-foreground">Reg 299:</strong> A SWMS must be prepared for any HRCE work before that work commences.</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Hazard Controls — the core of SWMS */}
          {activeSection === "hazards" && (
            <div className="space-y-4">
              {status === "draft" && (
                <div className="flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3">
                  <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-amber-900">Review hazards for today's site</p>
                    <p className="text-xs text-amber-800 mt-0.5">These steps are your trade baseline — not yesterday's job. Add any new hazards specific to this site (other trades nearby, overhead work, live power, changed conditions) and remove steps that don't apply before workers sign off.</p>
                  </div>
                </div>
              )}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Identify each work step, associated hazards, and control measures using the Hierarchy of Controls.</p>
                </div>
                {!isLocked && <Button size="sm" variant="outline" onClick={addStep} className="gap-1 shrink-0"><Plus className="w-3.5 h-3.5" /> Add Step</Button>}
              </div>

              {(data.steps ?? []).length === 0 ? (
                <div className="text-center py-10 border-2 border-dashed border-border rounded-lg">
                  <AlertTriangle className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No work steps yet. Add each step of the task and its hazards.</p>
                  {!isLocked && <Button onClick={addStep} variant="outline" className="mt-3 gap-1"><Plus className="w-3.5 h-3.5" /> Add First Step</Button>}
                </div>
              ) : (
                (data.steps ?? []).map((step, i) => (
                  <Card key={i} className="border-border rounded-sm">
                    <CardContent className="p-4 space-y-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 flex-1">
                          <span className="text-xs font-black text-primary bg-primary/10 rounded px-2 py-0.5 shrink-0">STEP {i + 1}</span>
                          <Input className="h-8 text-sm font-semibold" value={step.step} onChange={e => updateStep(i, { step: e.target.value })} placeholder="Name this work step" disabled={isLocked} />
                        </div>
                        {step.residualRisk && <Badge className={`text-xs shrink-0 ${riskColor(step.residualRisk)}`}>{step.residualRisk}</Badge>}
                        {!isLocked && <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0" onClick={() => removeStep(i)}>
                          <X className="w-3.5 h-3.5" />
                        </Button>}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs font-semibold">Hazard / Risk</Label>
                          <Input className="h-8 text-sm" value={step.hazard} onChange={e => updateStep(i, { hazard: e.target.value })} placeholder="What could cause harm?" disabled={isLocked} />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs font-semibold">Persons at Risk</Label>
                          <Input className="h-8 text-sm" value={step.personsAtRisk} onChange={e => updateStep(i, { personsAtRisk: e.target.value })} placeholder="e.g. Workers, public, others" disabled={isLocked} />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {(["initialLikelihood", "initialConsequence", "initialRisk"] as const).map(key => (
                          <div key={key} className="space-y-1">
                            <Label className="text-xs font-semibold">{key === "initialLikelihood" ? "Likelihood" : key === "initialConsequence" ? "Consequence" : "Initial Risk"}</Label>
                            <Select value={step[key]} onValueChange={v => updateStep(i, { [key]: v })} disabled={isLocked}>
                              <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                              <SelectContent>{RISK_LEVELS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                            </Select>
                          </div>
                        ))}
                      </div>

                      <div className="border-l-2 border-primary/30 pl-3 space-y-3">
                        <p className="text-xs font-bold text-primary uppercase tracking-wide">Hierarchy of Controls</p>
                        {([
                          ["eliminate", "1. Eliminate"],
                          ["substitute", "2. Substitute"],
                          ["isolate", "3. Isolate"],
                          ["engineer", "4. Engineering"],
                          ["admin", "5. Administrative"],
                          ["ppe", "6. PPE"],
                        ] as const).map(([key, label]) => (
                          <div key={key} className="space-y-1">
                            <Label className="text-xs font-semibold text-muted-foreground">{label}</Label>
                            <Input
                              className="h-8 text-sm"
                              value={step.controlMeasures[key] ?? ""}
                              onChange={e => updateStep(i, { controlMeasures: { ...step.controlMeasures, [key]: e.target.value } })}
                              placeholder={key === "ppe" ? "e.g. Hard hat, harness, safety glasses" : "Describe control measure (or leave blank if N/A)"}
                              disabled={isLocked}
                            />
                          </div>
                        ))}
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs font-semibold">Residual Risk (after controls)</Label>
                        <Select value={step.residualRisk} onValueChange={v => updateStep(i, { residualRisk: v })} disabled={isLocked}>
                          <SelectTrigger className="h-8 text-sm w-40"><SelectValue /></SelectTrigger>
                          <SelectContent>{RISK_LEVELS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}

          {/* PPE & Equipment */}
          {activeSection === "ppe" && (
            <div className="space-y-4">
              {status === "draft" && (
                <div className="flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3">
                  <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                  <p className="text-xs text-amber-800">Tick only what's actually required for this job. Untick anything that doesn't apply — your PPE, licence, and plant selections are part of the legal SWMS record.</p>
                </div>
              )}
              <Card className="border-border rounded-sm">
                <CardHeader className="pb-3"><CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">PPE Required</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {DEFAULT_PPE.map(item => (
                      <label key={item} className={`flex items-center gap-2.5 ${isLocked ? "cursor-default" : "cursor-pointer"}`}>
                        <input type="checkbox" className="w-4 h-4 accent-primary"
                          checked={(data.ppeRequired ?? []).includes(item)}
                          onChange={() => toggleListItem("ppeRequired", item)} disabled={isLocked} />
                        <span className="text-sm">{item}</span>
                      </label>
                    ))}
                  </div>
                  {!isLocked && <CustomItemAdder label="Add custom PPE" onAdd={v => addCustomItem("ppeRequired", v)} />}
                </CardContent>
              </Card>

              <Card className="border-border rounded-sm">
                <CardHeader className="pb-3"><CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Plant & Equipment</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {DEFAULT_PLANT.map(item => (
                      <label key={item} className={`flex items-center gap-2.5 ${isLocked ? "cursor-default" : "cursor-pointer"}`}>
                        <input type="checkbox" className="w-4 h-4 accent-primary"
                          checked={(data.plantsEquipment ?? []).includes(item)}
                          onChange={() => toggleListItem("plantsEquipment", item)} disabled={isLocked} />
                        <span className="text-sm">{item}</span>
                      </label>
                    ))}
                  </div>
                  {!isLocked && <CustomItemAdder label="Add custom plant/equipment" onAdd={v => addCustomItem("plantsEquipment", v)} />}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Licences */}
          {activeSection === "licences" && (
            <Card className="border-border rounded-sm">
              <CardHeader className="pb-3"><CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Required Licences & Qualifications</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  {DEFAULT_LICENCES.map(item => (
                    <label key={item} className={`flex items-center gap-2.5 ${isLocked ? "cursor-default" : "cursor-pointer"}`}>
                      <input type="checkbox" className="w-4 h-4 accent-primary"
                        checked={(data.licencesRequired ?? []).includes(item)}
                        onChange={() => toggleListItem("licencesRequired", item)} disabled={isLocked} />
                      <span className="text-sm">{item}</span>
                    </label>
                  ))}
                </div>
                {!isLocked && <CustomItemAdder label="Add custom licence / qualification" onAdd={v => addCustomItem("licencesRequired", v)} />}
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
                    <Label className="text-xs font-bold uppercase tracking-wide">Nearest Hospital / ED</Label>
                    <Input value={data.nearestHospital ?? ""} onChange={e => patch({ nearestHospital: e.target.value })} placeholder="Hospital name" disabled={isLocked} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold uppercase tracking-wide">Hospital Phone</Label>
                    <Input value={data.hospitalPhone ?? ""} onChange={e => patch({ hospitalPhone: e.target.value })} placeholder="e.g. 000 (Emergency)" disabled={isLocked} />
                  </div>
                  <div className="space-y-1.5 col-span-2">
                    <Label className="text-xs font-bold uppercase tracking-wide">Hospital Address</Label>
                    <Input value={data.hospitalAddress ?? ""} onChange={e => patch({ hospitalAddress: e.target.value })} disabled={isLocked} />
                  </div>
                  <div className="space-y-1.5 col-span-2">
                    <Label className="text-xs font-bold uppercase tracking-wide">Muster / Assembly Point</Label>
                    <Input value={data.musterPoint ?? ""} onChange={e => patch({ musterPoint: e.target.value })} placeholder="e.g. Car park at main entrance" disabled={isLocked} />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <Label className="text-xs font-bold uppercase tracking-wide">Emergency Contacts</Label>
                    {!isLocked && <Button size="sm" variant="outline" onClick={addEContact} className="gap-1"><Plus className="w-3.5 h-3.5" /> Add</Button>}
                  </div>
                  <div className="space-y-2">
                    {(data.emergencyContacts ?? []).map((c, i) => (
                      <div key={i} className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-3 border border-border rounded-sm">
                        {(["name", "role", "phone"] as const).map(key => (
                          <div key={key} className="space-y-1">
                            <Label className="text-xs font-semibold capitalize">{key}</Label>
                            <Input className="h-8 text-sm" value={c[key]} onChange={e => updateEContact(i, { [key]: e.target.value })} disabled={isLocked} />
                          </div>
                        ))}
                        {!isLocked && <Button variant="ghost" size="icon" className="h-7 w-7 self-end text-muted-foreground hover:text-destructive" onClick={() => removeEContact(i)}>
                          <X className="w-3.5 h-3.5" />
                        </Button>}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="p-3 bg-muted/40 border border-border rounded-sm text-xs text-muted-foreground">
                  <strong className="text-foreground">Emergency number:</strong> Call 000 for Police, Fire, or Ambulance. WorkSafe hotline: 1800 003 338.
                </div>
              </CardContent>
            </Card>
          )}

          {/* Worker Sign-off */}
          {activeSection === "workers" && (
            <Card className="border-border rounded-sm">
              <CardHeader className="pb-3 flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Worker Sign-off</CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">Workers must acknowledge they have read, understood, and will comply with this SWMS before commencing work (WHS Reg 302).</p>
                </div>
                {!isLocked && <Button size="sm" variant="outline" onClick={addWorker} className="gap-1 shrink-0"><Plus className="w-3.5 h-3.5" /> Add Worker</Button>}
              </CardHeader>
              <CardContent className="space-y-3">
                {(data.workers ?? []).map((w, i) => (
                  <div key={i} className={`p-3 border rounded-sm ${w.signedDate ? "border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-900/10" : "border-border"}`}>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                      <div className="space-y-1">
                        <Label className="text-xs font-semibold">Worker Name</Label>
                        <Input className="h-8 text-sm" value={w.name} onChange={e => updateWorker(i, { name: e.target.value })} placeholder="Full name" disabled={isLocked} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs font-semibold">Role / Trade</Label>
                        <Input className="h-8 text-sm" value={w.role} onChange={e => updateWorker(i, { role: e.target.value })} placeholder="e.g. Scaffolder" disabled={isLocked} />
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
                {(data.workers ?? []).length > 0 && (
                  <div className="text-right text-xs text-muted-foreground pt-2 border-t border-border">
                    {signedCount} of {totalWorkers} workers have signed
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {!isLocked && (
            <div className="flex justify-end pt-2">
              <Button onClick={save} disabled={saving} size="sm">
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          )}
        </div>
      </div>
      {/* ── Email Principal Dialog ── */}
      <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Email Principal Contractor</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Recipient Name</Label>
              <Input value={recipientName} onChange={e => setRecipientName(e.target.value)} placeholder="Contact name" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Recipient Email</Label>
              <Input type="email" value={recipientEmail} onChange={e => setRecipientEmail(e.target.value)} placeholder="email@example.com" />
            </div>
            <p className="text-xs text-muted-foreground">They'll receive a branded email with a link to this SWMS.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEmailDialogOpen(false)}>Cancel</Button>
            <Button
              disabled={!recipientEmail || sendingEmail}
              onClick={async () => {
                setSendingEmail(true);
                try {
                  const res = await fetch(`/api/swms/${id}/send-email`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ recipientEmail, recipientName }),
                  });
                  if (!res.ok) throw new Error("Failed");
                  setEmailDialogOpen(false);
                  setEmailSentFlash(true);
                  setTimeout(() => setEmailSentFlash(false), 3000);
                } catch {
                  toast({ title: "Failed to send", description: "Please try again.", variant: "destructive" });
                } finally {
                  setSendingEmail(false);
                }
              }}
            >
              {sendingEmail ? "Sending…" : "Send"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* ── Lock Confirmation Dialog ── */}
      <Dialog open={lockDialogOpen} onOpenChange={setLockDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Lock className="w-4 h-4 text-green-600" /> Lock this SWMS?</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">
              Locking makes this SWMS <strong>permanently read-only</strong> — no further edits will be possible. This creates a tamper-proof audit record for WHS Act 2011 compliance.
            </p>
            <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded p-2">
              ⚠ This cannot be undone. Only lock once the principal contractor has signed off and work has commenced.
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
            <DialogTitle>Share Principal Sign-off Link</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">
              Send this link to the principal contractor. They can review the SWMS and sign off without needing a Formate account. Required before high-risk work commences (WHS Act 2011).
            </p>
            <div className="flex items-center gap-2">
              <Input readOnly value={shareUrl} className="text-xs font-mono bg-muted" onClick={e => (e.target as HTMLInputElement).select()} />
              <Button variant="outline" size="sm" onClick={copyShareLink} className="shrink-0 gap-1.5">
                {copied ? <><CheckCheck className="w-4 h-4 text-green-600" /> Copied</> : <><Copy className="w-4 h-4" /> Copy</>}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">The link works permanently — same URL each time you share. Share via email, WhatsApp, or text.</p>
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
