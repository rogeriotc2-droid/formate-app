import { useState } from "react";
import { useListJsa, useCreateJsa, useListSites, getListJsaQueryKey } from "@workspace/api-client-react";
import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Plus, ClipboardCheck, ChevronRight, CheckCircle2, Clock, Archive } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";

const statusConfig: Record<string, { label: string; icon: typeof Clock; color: string }> = {
  draft: { label: "Draft", icon: Clock, color: "text-muted-foreground bg-muted" },
  active: { label: "Active", icon: CheckCircle2, color: "text-green-800 bg-green-100 dark:text-green-300 dark:bg-green-900/30" },
  archived: { label: "Archived", icon: Archive, color: "text-muted-foreground bg-muted/50" },
};

export default function JsaList() {
  const { data: jsaList, isLoading } = useListJsa();
  const { data: sites } = useListSites();
  const createJsa = useCreateJsa();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const [open, setOpen] = useState(false);
  const [jobName, setJobName] = useState("");
  const [siteId, setSiteId] = useState<string>("");

  const siteMap = Object.fromEntries((sites ?? []).map(s => [s.id, s.name]));

  const handleCreate = () => {
    if (!jobName.trim()) return;
    createJsa.mutate(
      { data: { jobName: jobName.trim(), siteId: siteId ? Number(siteId) : undefined, status: "draft", data: {} } },
      {
        onSuccess: (jsa) => {
          queryClient.invalidateQueries({ queryKey: getListJsaQueryKey() });
          toast({ title: "JSA created" });
          setOpen(false);
          setJobName(""); setSiteId("");
          navigate(`/jsa/${jsa.id}`);
        },
        onError: () => toast({ title: "Error", description: "Failed to create JSA", variant: "destructive" }),
      }
    );
  };

  return (
    <MainLayout>
      <div className="flex items-center justify-between gap-3 flex-wrap mb-6 border-b pb-4 border-border">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">JSA</h1>
            <Badge variant="outline" className="text-xs font-bold uppercase tracking-wide border-muted-foreground/40 text-muted-foreground">AU / NZ</Badge>
          </div>
          <p className="text-muted-foreground text-sm font-medium">Job Safety Analysis — pre-task hazard identification for any field work.</p>
        </div>
        <Button onClick={() => setOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" /> New JSA
        </Button>
      </div>

      <div className="mb-5 p-3 bg-muted/40 border border-border rounded-sm text-xs text-muted-foreground">
        <strong className="text-foreground">When to use a JSA:</strong> Use for any non-routine or moderate-risk task where a SWMS is not legally required. Common in mining, civil, utilities, oil & gas, and maintenance. Must be completed before work starts.
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-20 w-full" />)}</div>
      ) : jsaList?.length === 0 ? (
        <div className="p-12 text-center border-2 border-dashed border-border rounded-lg bg-card">
          <ClipboardCheck className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-bold">No JSAs yet</h3>
          <p className="text-muted-foreground text-sm mt-1 mb-4">Create a Job Safety Analysis before starting any field task.</p>
          <Button onClick={() => setOpen(true)} className="gap-2"><Plus className="w-4 h-4" /> New JSA</Button>
        </div>
      ) : (
        <div className="space-y-2">
          {jsaList?.map(jsa => {
            const cfg = statusConfig[jsa.status] ?? statusConfig.draft;
            const StatusIcon = cfg.icon;
            const d = (jsa.data as Record<string, unknown>) ?? {};
            const steps = Array.isArray(d.steps) ? d.steps.length : 0;
            const workers = Array.isArray(d.workers) ? (d.workers as {signedDate?: string}[]).filter(w => w.signedDate).length : 0;
            const totalWorkers = Array.isArray(d.workers) ? (d.workers as unknown[]).length : 0;
            return (
              <Link key={jsa.id} href={`/jsa/${jsa.id}`}>
                <Card className="hover:border-primary transition-colors cursor-pointer border-border rounded-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-sm truncate">{jsa.jobName}</span>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${cfg.color}`}>
                            <StatusIcon className="w-3 h-3" /> {cfg.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground font-medium">
                          {jsa.siteId && <span>{siteMap[jsa.siteId] ?? `Site #${jsa.siteId}`}</span>}
                          {steps > 0 && <span>{steps} step{steps !== 1 ? "s" : ""}</span>}
                          {totalWorkers > 0 && <span>{workers}/{totalWorkers} signed</span>}
                          <span>Updated {format(new Date(jsa.updatedAt), "d MMM yyyy")}</span>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-black">New JSA</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="font-semibold text-xs uppercase tracking-wide">Job / Task Name</Label>
              <Input
                placeholder="e.g. Replace conveyor belt — Section C"
                value={jobName}
                onChange={e => setJobName(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleCreate()}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="font-semibold text-xs uppercase tracking-wide">Site (optional)</Label>
              <Select value={siteId} onValueChange={setSiteId}>
                <SelectTrigger><SelectValue placeholder="Link to a site..." /></SelectTrigger>
                <SelectContent>
                  {(sites ?? []).map(s => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={!jobName.trim() || createJsa.isPending}>
              {createJsa.isPending ? "Creating..." : "Create & Edit"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
