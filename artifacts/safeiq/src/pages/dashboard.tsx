import { useEffect, useState } from "react";
import { useGetDashboardSummary, useGetActivityFeed, useListSssps } from "@workspace/api-client-react";
import { authedFetch } from "@/lib/api";
import { useCompanyStatus } from "@/lib/company-status";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ClipboardCheck, FileText, MapPin, Zap, Shield, ChevronRight, RotateCcw, Printer, CheckCircle2, Circle, Building2, ArrowRight, Plug } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { QuickJobDialog } from "@/components/quick-job-dialog";
import { RepeatJobDialog } from "@/components/repeat-job-dialog";
import { InstallBanner } from "@/components/install-banner";
import { useXeroEnabled } from "@/lib/feature-flags";
import { format } from "date-fns";

export default function Dashboard() {
  const { data: summary, isLoading: loadingSummary } = useGetDashboardSummary();
  const { data: activities, isLoading: loadingActivities } = useGetActivityFeed();
  const { data: sssps } = useListSssps();
  const [quickOpen, setQuickOpen] = useState(false);
  const [repeatOpen, setRepeatOpen] = useState(false);

  const lastSssp = sssps?.[0];
  const hasHistory = !!lastSssp;
  const xeroEnabled = useXeroEnabled();
  const { trialDaysLeft, state: companyState } = useCompanyStatus();

  // ── Xero connection status (only fetched when feature flag is on) ─────────
  const [xeroConnected, setXeroConnected] = useState<boolean | null>(null);
  useEffect(() => {
    if (!xeroEnabled) { setXeroConnected(false); return; }
    let alive = true;
    (async () => {
      try {
        const r = await authedFetch("/api/xero/status");
        if (!r.ok) { if (alive) setXeroConnected(false); return; }
        const s = await r.json() as { connected?: boolean };
        if (alive) setXeroConnected(!!s.connected);
      } catch {
        if (alive) setXeroConnected(false);
      }
    })();
    return () => { alive = false; };
  }, [xeroEnabled]);

  // ── Setup checklist logic ──────────────────────────────────────────────────
  // "Company set up" must reflect the actual saved company profile, NOT whether
  // the first SSSP happens to have a pcbu2.company value. Using the SSSP field
  // made the checklist nag "set up your company" forever even after onboarding
  // was completed (company profile exists -> companyState === "yes").
  const companyDone = companyState === "yes" || companyState === "expired";
  const siteDone = (summary?.totalSites ?? 0) > 0;
  const ssspDone = (sssps?.length ?? 0) > 0;
  const xeroDone = xeroConnected === true;
  // When Xero is hidden, the checklist is just the first 3 steps.
  const checklistTotal = xeroEnabled ? 4 : 3;
  const checklistDone = [companyDone, siteDone, ssspDone, ...(xeroEnabled ? [xeroDone] : [])].filter(Boolean).length;
  const allDone = checklistDone === checklistTotal;
  const setupReady = sssps !== undefined && summary !== undefined && (!xeroEnabled || xeroConnected !== null);

  return (
    <MainLayout>
      <InstallBanner />
      {companyState === "yes" && trialDaysLeft <= 7 && (
        <div className={`mb-4 rounded-xl px-4 py-3 flex items-center justify-between gap-3 text-sm ${trialDaysLeft <= 3 ? "bg-red-50 border border-red-200 text-red-800" : "bg-amber-50 border border-amber-200 text-amber-800"}`}>
          <span>
            {trialDaysLeft === 0
              ? "⏰ Your free trial ends today."
              : `⏰ ${trialDaysLeft} day${trialDaysLeft === 1 ? "" : "s"} left in your free trial.`}
          </span>
          <Link href="/billing" className="shrink-0 font-bold underline underline-offset-2 whitespace-nowrap">
            Upgrade →
          </Link>
        </div>
      )}
      {/* ── Hero action card ── */}
      <div className="bg-[#0F172A] rounded-xl p-5 mb-6 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(circle at 5% 50%, rgba(232,119,34,0.18), transparent 50%)" }} />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-4 h-4 text-primary" />
              <span className="text-xs font-bold uppercase tracking-wider text-primary">Quick SSSP</span>
            </div>
            <h2 className="text-lg sm:text-xl font-black text-white mb-0.5">Safety plan in 60 seconds.</h2>
            <p className="text-sm text-white/50">Site address + PCBU 1 — everything else auto-fills.</p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
            {/* Repeat last job — most prominent if history exists */}
            {hasHistory && (
              <Button
                onClick={() => setRepeatOpen(true)}
                variant="outline"
                className="gap-2 border-white/20 text-white hover:bg-white/10 hover:text-white font-bold order-first sm:order-none"
              >
                <RotateCcw className="w-4 h-4" /> Repeat last job
              </Button>
            )}
            <Button
              onClick={() => setQuickOpen(true)}
              className="gap-2 bg-primary hover:bg-primary/90 font-bold"
            >
              <Zap className="w-4 h-4" /> New SSSP
            </Button>
            <Link href="/sssps">
              <Button variant="ghost" className="text-white/60 hover:text-white hover:bg-white/10 w-full sm:w-auto">
                All plans <ChevronRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <QuickJobDialog open={quickOpen} onOpenChange={setQuickOpen} recentSssps={sssps as any} />
      <RepeatJobDialog open={repeatOpen} onOpenChange={setRepeatOpen} lastSssp={lastSssp as any} />

      {/* ── Setup checklist — hides once all done ── */}
      {setupReady && !allDone && (
        <div className="mb-6 border border-border rounded-xl overflow-hidden">
          <div className="px-5 py-3.5 bg-muted/40 border-b border-border flex items-center justify-between">
            <div>
              <p className="text-sm font-bold">Get set up in {checklistTotal} steps</p>
              <p className="text-xs text-muted-foreground">Complete these once — everything auto-fills from then on.</p>
            </div>
            <span className="text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-full">
              {checklistDone} / {checklistTotal}
            </span>
          </div>
          <div className="divide-y divide-border">

            {/* Step 1 — Company */}
            <div className={`flex items-center gap-4 px-5 py-4 ${companyDone ? "opacity-50" : ""}`}>
              <div className="shrink-0">
                {companyDone
                  ? <CheckCircle2 className="w-5 h-5 text-green-500" />
                  : <Circle className="w-5 h-5 text-muted-foreground" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-bold ${companyDone ? "line-through text-muted-foreground" : ""}`}>
                  Add your company details
                </p>
                <p className="text-xs text-muted-foreground">Your name, phone, and company — auto-fills every SSSP you create.</p>
              </div>
              {!companyDone && (
                <Link href="/onboarding">
                  <Button size="sm" variant="outline" className="gap-1 shrink-0">
                    <Building2 className="w-3.5 h-3.5" /> Set up <ArrowRight className="w-3 h-3" />
                  </Button>
                </Link>
              )}
            </div>

            {/* Step 2 — Site */}
            <div className={`flex items-center gap-4 px-5 py-4 ${siteDone ? "opacity-50" : ""}`}>
              <div className="shrink-0">
                {siteDone
                  ? <CheckCircle2 className="w-5 h-5 text-green-500" />
                  : <Circle className="w-5 h-5 text-muted-foreground" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-bold ${siteDone ? "line-through text-muted-foreground" : ""}`}>
                  Register a site
                </p>
                <p className="text-xs text-muted-foreground">Add your first job site — takes a minute and links to all your plans.</p>
              </div>
              {!siteDone && (
                <Link href="/sites/new">
                  <Button size="sm" variant="outline" className="gap-1 shrink-0">
                    <MapPin className="w-3.5 h-3.5" /> Add site <ArrowRight className="w-3 h-3" />
                  </Button>
                </Link>
              )}
            </div>

            {/* Step 3 — First SSSP */}
            <div className={`flex items-center gap-4 px-5 py-4 ${ssspDone ? "opacity-50" : ""}`}>
              <div className="shrink-0">
                {ssspDone
                  ? <CheckCircle2 className="w-5 h-5 text-green-500" />
                  : <Circle className="w-5 h-5 text-muted-foreground" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-bold ${ssspDone ? "line-through text-muted-foreground" : ""}`}>
                  Create your first safety plan
                </p>
                <p className="text-xs text-muted-foreground">Your first SSSP. Future ones auto-fill from this one in seconds.</p>
              </div>
              {!ssspDone && (
                <Button size="sm" className="gap-1 shrink-0" onClick={() => setQuickOpen(true)}>
                  <Zap className="w-3.5 h-3.5" /> New SSSP <ArrowRight className="w-3 h-3" />
                </Button>
              )}
            </div>

            {/* Step 4 — Xero (only shown to allowlisted beta testers) */}
            {xeroEnabled && (
            <div className={`flex items-center gap-4 px-5 py-4 ${xeroDone ? "opacity-50" : ""}`}>
              <div className="shrink-0">
                {xeroDone
                  ? <CheckCircle2 className="w-5 h-5 text-green-500" />
                  : <Circle className="w-5 h-5 text-muted-foreground" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-bold ${xeroDone ? "line-through text-muted-foreground" : ""}`}>
                  Connect Xero
                </p>
                <p className="text-xs text-muted-foreground">Pull your client list in — PCBU 1 fills from a real client with one tap.</p>
              </div>
              {!xeroDone && (
                <Link href="/integrations">
                  <Button size="sm" variant="outline" className="gap-1 shrink-0">
                    <Plug className="w-3.5 h-3.5" /> Connect <ArrowRight className="w-3 h-3" />
                  </Button>
                </Link>
              )}
            </div>
            )}

          </div>
        </div>
      )}

      {/* ── Stats ── */}
      <h1 className="text-2xl font-black tracking-tight text-foreground mb-4">Overview</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <Card className="rounded-sm border-border shadow-sm">
          <CardHeader className="pb-1 pt-4 px-4">
            <CardTitle className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-2">
              <ClipboardCheck className="w-4 h-4" /> Submissions
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {loadingSummary ? <Skeleton className="h-8 w-16" /> : <div className="text-3xl font-black">{summary?.totalSubmissions ?? 0}</div>}
            <p className="text-xs text-muted-foreground mt-0.5 font-medium">{summary?.submissionsThisWeek ?? 0} this week</p>
          </CardContent>
        </Card>

        <Card className="rounded-sm border-border shadow-sm">
          <CardHeader className="pb-1 pt-4 px-4">
            <CardTitle className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-2">
              <Shield className="w-4 h-4" /> Safety Plans
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {!sssps ? <Skeleton className="h-8 w-16" /> : <div className="text-3xl font-black">{sssps.length}</div>}
            <p className="text-xs text-muted-foreground mt-0.5 font-medium">SSSPs created</p>
          </CardContent>
        </Card>

        <Card className="rounded-sm border-border shadow-sm">
          <CardHeader className="pb-1 pt-4 px-4">
            <CardTitle className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-2">
              <FileText className="w-4 h-4" /> Templates
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {loadingSummary ? <Skeleton className="h-8 w-16" /> : <div className="text-3xl font-black">{summary?.totalTemplates ?? 0}</div>}
            <p className="text-xs text-muted-foreground mt-0.5 font-medium">Active forms</p>
          </CardContent>
        </Card>

        <Card className="rounded-sm border-border shadow-sm">
          <CardHeader className="pb-1 pt-4 px-4">
            <CardTitle className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-2">
              <MapPin className="w-4 h-4" /> Sites
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {loadingSummary ? <Skeleton className="h-8 w-16" /> : <div className="text-3xl font-black">{summary?.totalSites ?? 0}</div>}
            <p className="text-xs text-muted-foreground mt-0.5 font-medium">Registered</p>
          </CardContent>
        </Card>
      </div>

      {/* ── Platform signups (visible to all — useful social proof + admin view) ── */}
      {!loadingSummary && (summary?.totalSignups ?? 0) > 0 && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-8 px-1">
          <span className="inline-flex items-center gap-1.5 bg-primary/10 text-primary font-bold px-2.5 py-1 rounded-full">
            {summary!.totalSignups} tradie{summary!.totalSignups === 1 ? "" : "s"} signed up
          </span>
          <span>·</span>
          <span>{summary!.activeTrials} on free trial</span>
          {(summary!.signupsThisWeek ?? 0) > 0 && (
            <>
              <span>·</span>
              <span className="text-primary font-semibold">+{summary!.signupsThisWeek} this week</span>
            </>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* ── Recent Safety Plans ── */}
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b pb-2">
            <h2 className="text-base font-bold tracking-tight">Recent Safety Plans</h2>
            <Link href="/sssps" className="text-xs font-semibold text-primary hover:underline">View all →</Link>
          </div>
          {!sssps ? (
            <div className="space-y-2"><Skeleton className="h-16 w-full" /><Skeleton className="h-16 w-full" /></div>
          ) : sssps.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground border border-dashed rounded-sm bg-muted/20">
              <p className="text-sm mb-3">No safety plans yet.</p>
              <Button size="sm" onClick={() => setQuickOpen(true)} className="gap-2">
                <Zap className="w-3.5 h-3.5" /> Create your first SSSP
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {sssps.slice(0, 5).map((sssp) => {
                const d = (sssp.data as Record<string, unknown>) ?? {};
                const pcbu1 = (d.pcbu1 as Record<string, string> | undefined)?.company;
                const pcbu1Signed = !!d.pcbu1SignedDate;
                const pcbu1Sent = !!d.pcbu1SignSentAt;
                return (
                  <div key={sssp.id} className="flex items-stretch gap-0">
                    <Link href={`/sssps/${sssp.id}`} className="flex-1 min-w-0">
                      <div className="border rounded-sm rounded-r-none border-r-0 p-3 hover:border-primary transition-colors bg-card cursor-pointer h-full flex flex-col justify-center">
                        <p className="font-bold text-sm truncate">{sssp.projectName}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {pcbu1 && <span>{pcbu1} · </span>}
                          {(d.siteAddress as string) || "No address"}
                        </p>
                        <p className="text-xs text-muted-foreground/60 mt-0.5">
                          {format(new Date(sssp.updatedAt), "d MMM yyyy")}
                        </p>
                        {pcbu1Signed ? (
                          <span className="mt-1 inline-flex w-fit items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-700 dark:bg-green-900/30 dark:text-green-300">
                            <CheckCircle2 className="h-3 w-3" /> PCBU 1 signed
                          </span>
                        ) : pcbu1Sent ? (
                          <span className="mt-1 inline-flex w-fit items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                            Awaiting PCBU 1
                          </span>
                        ) : null}
                      </div>
                    </Link>
                    <button
                      onClick={() => window.open(`/sssps/${sssp.id}/print`, "_blank")}
                      title="Open PDF"
                      className="flex items-center justify-center w-10 border border-border border-l-0 rounded-sm rounded-l-none hover:bg-primary hover:text-white hover:border-primary transition-colors text-muted-foreground bg-card shrink-0"
                    >
                      <Printer className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Activity ── */}
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b pb-2">
            <h2 className="text-base font-bold tracking-tight">Activity</h2>
          </div>
          {loadingActivities ? (
            <div className="space-y-2"><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /></div>
          ) : !activities?.length ? (
            <div className="p-8 text-center text-muted-foreground border border-dashed rounded-sm bg-muted/20 text-sm">
              No recent activity.
            </div>
          ) : (
            <div className="space-y-4">
              {activities.map(act => (
                <div key={act.id} className="flex gap-3 items-start">
                  <div className="w-2 h-2 mt-1.5 rounded-full bg-primary shrink-0" />
                  <div>
                    <p className="text-sm font-medium">{act.description}</p>
                    <p className="text-xs text-muted-foreground">{new Date(act.createdAt).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
