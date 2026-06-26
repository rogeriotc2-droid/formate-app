import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ChevronDown, ChevronRight, AlertTriangle, CheckCircle2, Search } from "lucide-react";

type PresetEntry = {
  key: string;
  label: string;
  aliasOf: string | null;
  jsa: {
    workDescription: string;
    stepCount: number;
    firstStep: string;
    firstHazard: string;
    ppeCount: number;
  };
  swms: {
    hrceType: string;
    stepCount: number;
    firstStep: string;
    firstHazard: string;
    ppeCount: number;
  };
};

function trunc(s: string, n = 90) {
  return s.length > n ? s.slice(0, n) + "…" : s;
}

function isLineMarking(t: PresetEntry) {
  return t.jsa.workDescription.toLowerCase().includes("line") || t.swms.hrceType.toLowerCase().includes("line");
}

export default function AdminPresetsPage() {
  const [trades, setTrades] = useState<PresetEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/presets", { credentials: "include" });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}`);
        setTrades((body as { trades: PresetEntry[] }).trades);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const toggle = (key: string) =>
    setExpanded(s => { const n = new Set(s); n.has(key) ? n.delete(key) : n.add(key); return n; });

  const filtered = trades.filter(t =>
    !search || t.label.toLowerCase().includes(search.toLowerCase()) || t.key.includes(search.toLowerCase())
  );

  return (
    <MainLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-black text-foreground mb-1">Preset Audit — All Trades</h1>
        <p className="text-sm text-muted-foreground">
          Verify that each trade loads the correct preset content for new JSA and SWMS documents.
          This is what a brand-new client account will see on their very first document.
        </p>
      </div>

      {/* Explanation box */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-5 text-sm text-amber-900">
        <p className="font-semibold mb-1">Why your own account shows line marking</p>
        <p className="text-xs leading-relaxed text-amber-800">
          Your account has sticky data from previous line marking docs. That's correct — your sticky data is <em>yours</em>. New client accounts get the preset below on their very first doc, then their own work's content sticks for every doc after. Each account is completely separate.
        </p>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Filter trades…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {loading && (
        <div className="space-y-2">
          {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-center">
          <AlertTriangle className="w-8 h-8 text-destructive mx-auto mb-2" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {!loading && !error && (
        <div className="space-y-2">
          {filtered.map(t => {
            const open = expanded.has(t.key);
            const lmWarning = t.aliasOf ? false : isLineMarking(t) && t.key !== "line_marking" && t.key !== "asphalt";
            return (
              <div key={t.key} className={`border rounded-lg overflow-hidden ${lmWarning ? "border-amber-300 bg-amber-50" : "border-border bg-white"}`}>
                {/* Row header */}
                <button
                  onClick={() => toggle(t.key)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted/40 transition-colors"
                >
                  {open ? <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />}
                  <span className="font-semibold text-sm flex-1">{t.label}</span>
                  <code className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded font-mono">{t.key}</code>
                  {t.aliasOf && (
                    <Badge variant="outline" className="text-[10px] text-muted-foreground">alias of {t.aliasOf}</Badge>
                  )}
                  {lmWarning && (
                    <Badge className="text-[10px] bg-amber-100 text-amber-800 border-amber-300">⚠ check content</Badge>
                  )}
                  {!lmWarning && !t.aliasOf && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" />
                  )}
                </button>

                {/* Collapsed summary */}
                {!open && (
                  <div className="px-4 pb-3 flex gap-6 text-xs text-muted-foreground border-t border-border/50">
                    <div className="flex-1 min-w-0">
                      <span className="font-semibold text-[10px] uppercase tracking-wide">JSA — </span>
                      <span>{t.jsa.stepCount} steps · </span>
                      <span className="text-foreground/70">{trunc(t.jsa.firstStep, 70)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="font-semibold text-[10px] uppercase tracking-wide">SWMS — </span>
                      <span>{t.swms.stepCount} steps · </span>
                      <span className="text-foreground/70">{trunc(t.swms.firstStep, 70)}</span>
                    </div>
                  </div>
                )}

                {/* Expanded detail */}
                {open && (
                  <div className="border-t border-border grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border">
                    {/* JSA column */}
                    <div className="p-4 space-y-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-black uppercase tracking-widest text-primary">JSA Preset</span>
                        <Badge variant="outline" className="text-[10px]">{t.jsa.stepCount} steps</Badge>
                        <Badge variant="outline" className="text-[10px]">{t.jsa.ppeCount} PPE items</Badge>
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold uppercase text-muted-foreground mb-1">Work description</p>
                        <p className="text-xs leading-relaxed text-foreground/80">{t.jsa.workDescription}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold uppercase text-muted-foreground mb-1">First step</p>
                        <p className="text-xs font-medium text-foreground">{t.jsa.firstStep}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold uppercase text-muted-foreground mb-1">First hazard</p>
                        <p className="text-xs text-foreground/70">{trunc(t.jsa.firstHazard, 120)}</p>
                      </div>
                    </div>

                    {/* SWMS column */}
                    <div className="p-4 space-y-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-black uppercase tracking-widest text-primary">SWMS Preset</span>
                        <Badge variant="outline" className="text-[10px]">{t.swms.stepCount} steps</Badge>
                        <Badge variant="outline" className="text-[10px]">{t.swms.ppeCount} PPE items</Badge>
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold uppercase text-muted-foreground mb-1">HRCE type</p>
                        <p className="text-xs leading-relaxed text-foreground/80">{t.swms.hrceType}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold uppercase text-muted-foreground mb-1">First step</p>
                        <p className="text-xs font-medium text-foreground">{t.swms.firstStep}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold uppercase text-muted-foreground mb-1">First hazard</p>
                        <p className="text-xs text-foreground/70">{trunc(t.swms.firstHazard, 120)}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          {filtered.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">No trades match "{search}"</p>
          )}
        </div>
      )}

      <p className="text-xs text-muted-foreground mt-6 text-center">
        {trades.length} trade presets loaded · admin view only
      </p>
    </MainLayout>
  );
}
