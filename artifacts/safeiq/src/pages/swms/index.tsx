import { useState } from "react";
import { useListSwms, useCreateSwms, useListSites, getListSwmsQueryKey } from "@workspace/api-client-react";
import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Plus, Shield, ChevronRight, CheckCircle2, Clock, Archive } from "lucide-react";
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

const HRCE_ACTIVITIES = [
  "Working at Heights (>2m)",
  "Demolition Work",
  "Asbestos Removal / Disturbance",
  "Trenching / Excavation (>1.5m)",
  "Confined Space Entry",
  "Electrical Work (live or near live)",
  "Crane / Hoist / Rigging Operations",
  "Explosives Use",
  "Tunnelling / Underground Work",
  "Pressurised Gas Lines",
  "Chemical / Hazardous Substance Handling",
  "Scaffolding Erection",
  "Concrete Pumping",
  "Piling or Drilling",
  "Other High Risk Work",
];

const statusConfig: Record<string, { label: string; icon: typeof Clock; color: string }> = {
  draft: { label: "Draft", icon: Clock, color: "text-muted-foreground bg-muted" },
  active: { label: "Active", icon: CheckCircle2, color: "text-green-800 bg-green-100 dark:text-green-300 dark:bg-green-900/30" },
  archived: { label: "Archived", icon: Archive, color: "text-muted-foreground bg-muted/50" },
};

export default function SwmsList() {
  const { data: swmsList, isLoading } = useListSwms();
  const { data: sites } = useListSites();
  const createSwms = useCreateSwms();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const [open, setOpen] = useState(false);
  const [activityName, setActivityName] = useState("");
  const [hrceType, setHrceType] = useState("");
  const [siteId, setSiteId] = useState<string>("");

  const siteMap = Object.fromEntries((sites ?? []).map(s => [s.id, s.name]));

  const handleCreate = () => {
    const name = activityName.trim() || hrceType;
    if (!name) return;
    createSwms.mutate(
      { data: { activityName: name, siteId: siteId ? Number(siteId) : undefined, status: "draft", data: { hrceType: hrceType || name } } },
      {
        onSuccess: (swms) => {
          queryClient.invalidateQueries({ queryKey: getListSwmsQueryKey() });
          toast({ title: "SWMS created", description: "Fill in your method statement." });
          setOpen(false);
          setActivityName(""); setHrceType(""); setSiteId("");
          navigate(`/swms/${swms.id}`);
        },
        onError: () => toast({ title: "Error", description: "Failed to create SWMS", variant: "destructive" }),
      }
    );
  };

  return (
    <MainLayout>
      <div className="flex items-center justify-between gap-3 flex-wrap mb-6 border-b pb-4 border-border">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">SWMS</h1>
            <Badge variant="outline" className="text-xs font-bold uppercase tracking-wide border-primary/40 text-primary">AU</Badge>
          </div>
          <p className="text-muted-foreground text-sm font-medium">Safe Work Method Statements for high-risk construction work (WHS Act 2011).</p>
        </div>
        <Button onClick={() => setOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" /> New SWMS
        </Button>
      </div>

      <div className="mb-5 p-3 bg-muted/40 border border-border rounded-sm text-xs text-muted-foreground">
        <strong className="text-foreground">Australian requirement:</strong> A SWMS is legally required for all High Risk Construction Work (HRCE) under the WHS Act 2011 and model WHS Regulations. Workers must review and sign before commencing work.
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-20 w-full" />)}</div>
      ) : swmsList?.length === 0 ? (
        <div className="p-12 text-center border-2 border-dashed border-border rounded-lg bg-card">
          <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-bold">No SWMS yet</h3>
          <p className="text-muted-foreground text-sm mt-1 mb-4">Create a Safe Work Method Statement for high-risk construction activities.</p>
          <Button onClick={() => setOpen(true)} className="gap-2"><Plus className="w-4 h-4" /> New SWMS</Button>
        </div>
      ) : (
        <div className="space-y-2">
          {swmsList?.map(swms => {
            const cfg = statusConfig[swms.status] ?? statusConfig.draft;
            const StatusIcon = cfg.icon;
            const d = (swms.data as Record<string, unknown>) ?? {};
            return (
              <Link key={swms.id} href={`/swms/${swms.id}`}>
                <Card className="hover:border-primary transition-colors cursor-pointer border-border rounded-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-sm truncate">{swms.activityName}</span>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${cfg.color}`}>
                            <StatusIcon className="w-3 h-3" /> {cfg.label}
                          </span>
                          {d.hrceType && d.hrceType !== swms.activityName && (
                            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full truncate max-w-48">{String(d.hrceType)}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground font-medium">
                          {swms.siteId && <span>{siteMap[swms.siteId] ?? `Site #${swms.siteId}`}</span>}
                          <span>Updated {format(new Date(swms.updatedAt), "d MMM yyyy")}</span>
                          {Array.isArray(d.workers) && d.workers.length > 0 && (
                            <span>{d.workers.length} worker{d.workers.length !== 1 ? "s" : ""} signed</span>
                          )}
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
            <DialogTitle className="font-black">New SWMS</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="font-semibold text-xs uppercase tracking-wide">High Risk Work Type</Label>
              <Select value={hrceType} onValueChange={v => { setHrceType(v); if (!activityName) setActivityName(v); }}>
                <SelectTrigger><SelectValue placeholder="Select HRCE category..." /></SelectTrigger>
                <SelectContent>
                  {HRCE_ACTIVITIES.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="font-semibold text-xs uppercase tracking-wide">Activity / Task Name</Label>
              <Input
                placeholder="e.g. Scaffold erection — Level 4 east facade"
                value={activityName}
                onChange={e => setActivityName(e.target.value)}
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
            <Button onClick={handleCreate} disabled={(!activityName.trim() && !hrceType) || createSwms.isPending}>
              {createSwms.isPending ? "Creating..." : "Create & Edit"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
