import { useState } from "react";
import { useListSssps, useCreateSssp, useListSites, getListSsspsQueryKey } from "@workspace/api-client-react";
import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Plus, Shield, ChevronRight, CheckCircle2, Clock, Archive, Zap, Printer, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";
import { QuickJobDialog } from "@/components/quick-job-dialog";
import { authedFetch } from "@/lib/api";

const statusConfig: Record<string, { label: string; icon: typeof Clock; color: string }> = {
  draft: { label: "Draft", icon: Clock, color: "text-muted-foreground bg-muted" },
  active: { label: "Active", icon: CheckCircle2, color: "text-green-800 bg-green-100 dark:text-green-300 dark:bg-green-900/30" },
  archived: { label: "Archived", icon: Archive, color: "text-muted-foreground bg-muted/50" },
};

const TEMPLATES = [
  {
    id: "line-marking",
    label: "Line Marking & Concrete Grinding",
    description: "Pre-loads 8 hazards, 6 task steps, PPE list, and 5 hazardous substances for your work.",
  },
  {
    id: "blank",
    label: "Blank SSSP",
    description: "Start empty. PCBU 2 details are pre-filled from your defaults.",
  },
];

export default function SsspList() {
  const { data: sssps, isLoading } = useListSssps();
  const { data: sites } = useListSites();
  const createSssp = useCreateSssp();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  // New SSSP dialog
  const [open, setOpen] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [siteId, setSiteId] = useState<string>("");
  const [template, setTemplate] = useState("line-marking");

  // Quick Job dialog (shared component)
  const [quickOpen, setQuickOpen] = useState(false);
  const [pdfLoading, setPdfLoading] = useState<number | null>(null);

  const siteMap = Object.fromEntries((sites ?? []).map(s => [s.id, s.name]));

  const resetNewDialog = () => { setProjectName(""); setSiteId(""); setTemplate("line-marking"); };

  const handleCreate = () => {
    if (!projectName.trim()) return;
    const initialData = template === "line-marking" ? { _template: "line-marking" } : {};
    createSssp.mutate(
      { data: { projectName: projectName.trim(), siteId: siteId ? Number(siteId) : undefined, status: "draft", data: initialData } },
      {
        onSuccess: (sssp) => {
          queryClient.invalidateQueries({ queryKey: getListSsspsQueryKey() });
          toast({ title: "SSSP created", description: template === "line-marking" ? "Line marking defaults loaded." : "Fill in your plan details." });
          setOpen(false); resetNewDialog();
          navigate(`/sssps/${sssp.id}`);
        },
        onError: () => toast({ title: "Error", description: "Failed to create SSSP", variant: "destructive" }),
      }
    );
  };

  return (
    <MainLayout>
      <div className="flex items-center justify-between gap-3 flex-wrap mb-6 border-b pb-4 border-border">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">Safety Plans</h1>
            <Badge variant="outline" className="text-xs font-bold uppercase tracking-wide border-primary/40 text-primary">NZ</Badge>
          </div>
          <p className="text-muted-foreground text-sm font-medium">Site-Specific Safety Plans — WorkSafe NZ framework.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setQuickOpen(true)} className="gap-2 border-primary/40 text-primary hover:bg-primary/5">
            <Zap className="w-4 h-4" /> Quick SSSP
          </Button>
          <Button onClick={() => setOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" /> Full Editor
          </Button>
        </div>
      </div>

      {/* Quick SSSP explainer */}
      <div className="mb-4 p-3 rounded-md bg-primary/5 border border-primary/20 flex items-center gap-3 text-sm">
        <Zap className="w-4 h-4 text-primary shrink-0" />
        <span className="text-muted-foreground">
          <span className="font-semibold text-foreground">Quick SSSP:</span> enter site address + PCBU 1 → last job's details auto-fill → PDF opens immediately. Only change what's different each day.
        </span>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full" />)}</div>
      ) : sssps?.length === 0 ? (
        <div className="p-12 text-center border-2 border-dashed border-border rounded-lg bg-card">
          <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-bold">No safety plans yet</h3>
          <p className="text-muted-foreground text-sm mt-1 mb-6">
            Use <strong>Quick SSSP</strong> to generate a PDF in seconds, or <strong>Full Editor</strong> to build a customisable plan.
          </p>
          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={() => setQuickOpen(true)} className="gap-2 border-primary/40 text-primary">
              <Zap className="w-4 h-4" /> Quick SSSP
            </Button>
            <Button onClick={() => setOpen(true)} className="gap-2"><Plus className="w-4 h-4" /> Full Editor</Button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {sssps?.map(sssp => {
            const cfg = statusConfig[sssp.status] ?? statusConfig.draft;
            const StatusIcon = cfg.icon;
            const d = (sssp.data as Record<string, unknown>) ?? {};
            return (
              <div key={sssp.id} className="flex items-stretch gap-0">
                <Link href={`/sssps/${sssp.id}`} className="flex-1">
                  <Card className="hover:border-primary transition-colors cursor-pointer border-border rounded-sm rounded-r-none border-r-0">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Shield className="w-4 h-4 text-primary shrink-0" />
                            <span className="font-bold text-sm truncate">{sssp.projectName}</span>
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${cfg.color}`}>
                              <StatusIcon className="w-3 h-3" /> {cfg.label}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground font-medium">
                            {sssp.siteId && <span>{siteMap[sssp.siteId] ?? `Site #${sssp.siteId}`}</span>}
                            {!!(d.pcbu1 as Record<string, unknown>)?.company && (
                              <span>PCBU 1: {String((d.pcbu1 as Record<string, unknown>).company)}</span>
                            )}
                            {(d.siteAddress as string) && (
                              <span className="truncate max-w-64">{String(d.siteAddress)}</span>
                            )}
                            <span>Updated {format(new Date(sssp.updatedAt), "d MMM yyyy")}</span>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
                {/* PDF download button */}
                <button
                  disabled={pdfLoading === sssp.id}
                  title="Download PDF"
                  className="flex items-center justify-center w-12 border border-border border-l-0 rounded-sm rounded-l-none hover:bg-primary hover:text-white hover:border-primary transition-colors text-muted-foreground bg-card shrink-0 disabled:opacity-50 disabled:cursor-wait"
                  onClick={async (e) => {
                    e.preventDefault();
                    setPdfLoading(sssp.id);
                    try {
                      const res = await authedFetch(`/api/sssps/${sssp.id}/pdf`, { method: "POST" });
                      if (!res.ok) throw new Error("failed");
                      const blob = await res.blob();
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = `sssp-${sssp.id}.pdf`;
                      a.click();
                      URL.revokeObjectURL(url);
                    } catch {
                      toast({ title: "PDF failed", description: "Could not generate PDF — try again.", variant: "destructive" });
                    } finally {
                      setPdfLoading(null);
                    }
                  }}
                >
                  {pdfLoading === sssp.id
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <Printer className="w-4 h-4" />}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* ── New SSSP (full editor) dialog ── */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-black">New Safety Plan — Full Editor</DialogTitle>
            <DialogDescription>Full SSSP editor with all 9 sections.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="font-semibold text-xs uppercase tracking-wide">Project / Job Name</Label>
              <Input
                placeholder="e.g. Farmlands — South Belt Rd, Christchurch"
                value={projectName}
                onChange={e => setProjectName(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleCreate()}
              />
            </div>
            <div className="space-y-2">
              <Label className="font-semibold text-xs uppercase tracking-wide">Template</Label>
              <div className="space-y-2">
                {TEMPLATES.map(t => (
                  <button key={t.id} onClick={() => setTemplate(t.id)}
                    className={`w-full text-left p-3 rounded-md border transition-colors ${template === t.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}>
                    <div className="flex items-center gap-2 mb-0.5">
                      {t.id === "line-marking" && <Zap className="w-3.5 h-3.5 text-primary shrink-0" />}
                      <span className="text-sm font-semibold">{t.label}</span>
                      {t.id === "line-marking" && <Badge className="text-xs bg-primary/10 text-primary border-primary/30">Recommended</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground ml-5">{t.description}</p>
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="font-semibold text-xs uppercase tracking-wide">Site (optional)</Label>
              <Select value={siteId} onValueChange={setSiteId}>
                <SelectTrigger><SelectValue placeholder="Link to a registered site..." /></SelectTrigger>
                <SelectContent>
                  {(sites ?? []).map(s => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setOpen(false); resetNewDialog(); }}>Cancel</Button>
            <Button onClick={handleCreate} disabled={!projectName.trim() || createSssp.isPending}>
              {createSssp.isPending ? "Creating..." : "Create & Edit"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Quick SSSP dialog (shared component) ── */}
      <QuickJobDialog
        open={quickOpen}
        onOpenChange={setQuickOpen}
        recentSssps={sssps as any}
      />
    </MainLayout>
  );
}
