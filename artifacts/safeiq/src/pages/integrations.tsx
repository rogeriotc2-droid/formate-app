import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Bell, BellOff, Zap, CheckCircle2, RefreshCw, Unplug, AlertCircle } from "lucide-react";
import { authedFetch } from "@/lib/api";
import { useXeroEnabled } from "@/lib/feature-flags";

interface Integration {
  provider: string;
  name: string;
  category: string;
  tagline: string;
  available: boolean;
  notified: boolean;
}

interface XeroStatus {
  connected: boolean;
  tenantName?: string;
  lastSyncedAt?: string | null;
  contactCount?: number;
}

const CATEGORY_ICONS: Record<string, string> = {
  "Accounting": "💰",
  "Job Management": "🔧",
  "Storage": "📁",
  "Notifications": "📨",
};

function useIntegrations() {
  const [data, setData] = useState<Integration[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    authedFetch("/api/integrations")
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => { setError("Failed to load integrations"); setLoading(false); });
  }, []);

  async function toggleNotify(provider: string, currentlyNotified: boolean) {
    const method = currentlyNotified ? "DELETE" : "POST";
    const res = await authedFetch(`/api/integrations/${provider}/notify`, { method });
    if (res.ok) {
      setData((prev) => prev?.map((i) => i.provider === provider ? { ...i, notified: !currentlyNotified } : i) ?? null);
    }
  }

  return { data, loading, error, toggleNotify };
}

function useXeroStatus() {
  const [status, setStatus] = useState<XeroStatus | null>(null);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    setLoading(true);
    try {
      const r = await authedFetch("/api/xero/status");
      if (r.ok) setStatus(await r.json());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  return { status, loading, refresh };
}

function XeroCard({ integration }: { integration: Integration }) {
  const { status, loading, refresh } = useXeroStatus();
  const [busy, setBusy] = useState<null | "connect" | "sync" | "disconnect">(null);
  const [banner, setBanner] = useState<{ kind: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const xero = params.get("xero");
    if (xero === "success") {
      setBanner({ kind: "success", text: "Xero connected. Syncing your contacts…" });
      const url = new URL(window.location.href);
      url.searchParams.delete("xero");
      url.searchParams.delete("reason");
      window.history.replaceState({}, "", url.toString());
      (async () => {
        try {
          await authedFetch("/api/xero/sync", { method: "POST" });
        } finally {
          await refresh();
          setBanner({ kind: "success", text: "Xero connected. Contacts synced." });
        }
      })();
    } else if (xero === "error") {
      setBanner({ kind: "error", text: `Couldn't connect to Xero (${params.get("reason") ?? "unknown error"}). Try again.` });
      const url = new URL(window.location.href);
      url.searchParams.delete("xero");
      url.searchParams.delete("reason");
      window.history.replaceState({}, "", url.toString());
    }
  }, []);

  async function handleConnect() {
    setBusy("connect");
    try {
      const r = await authedFetch("/api/xero/connect");
      if (!r.ok) throw new Error("connect failed");
      const data = await r.json();
      window.location.href = data.url;
    } catch {
      setBanner({ kind: "error", text: "Couldn't start Xero connection. Try again." });
      setBusy(null);
    }
  }

  async function handleSync() {
    setBusy("sync");
    try {
      const r = await authedFetch("/api/xero/sync", { method: "POST" });
      if (!r.ok) throw new Error();
      const data = await r.json();
      setBanner({ kind: "success", text: `Synced ${data.synced} contact${data.synced === 1 ? "" : "s"} from Xero.` });
      await refresh();
    } catch {
      setBanner({ kind: "error", text: "Sync failed. Try again." });
    } finally {
      setBusy(null);
    }
  }

  async function handleDisconnect() {
    if (!window.confirm("Disconnect Xero? Your synced contacts will be removed from Formate.")) return;
    setBusy("disconnect");
    try {
      await authedFetch("/api/xero/disconnect", { method: "POST" });
      setBanner({ kind: "success", text: "Xero disconnected." });
      await refresh();
    } catch {
      setBanner({ kind: "error", text: "Disconnect failed." });
    } finally {
      setBusy(null);
    }
  }

  const connected = status?.connected;

  return (
    <div className={`bg-card border rounded-xl p-5 transition-all ${connected ? "border-primary/50 shadow-sm" : ""}`}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <h3 className="font-bold text-base">{integration.name}</h3>
          <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{integration.category}</span>
        </div>
        {connected ? (
          <span className="text-xs font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full shrink-0 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Connected
          </span>
        ) : (
          <span className="text-xs font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full shrink-0">Available</span>
        )}
      </div>
      <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{integration.tagline}</p>

      {banner && (
        <div className={`mb-3 text-xs rounded-md p-2 flex items-start gap-2 ${banner.kind === "success" ? "bg-green-50 text-green-800 border border-green-200" : "bg-destructive/10 text-destructive border border-destructive/20"}`}>
          {banner.kind === "error" && <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />}
          <span>{banner.text}</span>
        </div>
      )}

      {loading ? (
        <button disabled className="w-full text-sm font-semibold bg-muted text-muted-foreground py-2 rounded-md">Loading…</button>
      ) : connected ? (
        <div className="space-y-2">
          <div className="text-xs text-muted-foreground bg-muted/30 rounded-md p-2">
            <div className="font-semibold text-foreground">{status?.tenantName}</div>
            <div>{status?.contactCount ?? 0} contact{status?.contactCount === 1 ? "" : "s"} synced{status?.lastSyncedAt ? ` · ${new Date(status.lastSyncedAt).toLocaleDateString()}` : ""}</div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSync}
              disabled={busy !== null}
              className="flex-1 text-sm font-semibold bg-primary text-white py-2 rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${busy === "sync" ? "animate-spin" : ""}`} />
              {busy === "sync" ? "Syncing…" : "Sync now"}
            </button>
            <button
              onClick={handleDisconnect}
              disabled={busy !== null}
              className="text-sm font-semibold border border-input py-2 px-3 rounded-md hover:bg-muted/50 transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
              title="Disconnect"
            >
              <Unplug className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={handleConnect}
          disabled={busy !== null}
          className="w-full text-sm font-semibold bg-primary text-white py-2 rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {busy === "connect" ? "Redirecting…" : "Connect Xero"}
        </button>
      )}
    </div>
  );
}

export default function IntegrationsPage() {
  const { data, loading, error, toggleNotify } = useIntegrations();
  const [pending, setPending] = useState<string | null>(null);
  const xeroEnabled = useXeroEnabled();

  async function handleToggle(provider: string, notified: boolean) {
    setPending(provider);
    await toggleNotify(provider, notified);
    setPending(null);
  }

  const byCategory = data?.reduce((acc, i) => {
    if (!acc[i.category]) acc[i.category] = [];
    acc[i.category].push(i);
    return acc;
  }, {} as Record<string, Integration[]>);

  return (
    <MainLayout>
      <div className="bg-[#0F172A] rounded-xl p-8 mb-8 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none"
          style={{ background: "radial-gradient(circle at 20% 50%, #E87722, transparent 60%)" }} />
        <div className="relative">
          <div className="inline-flex items-center gap-2 bg-primary/20 text-primary text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full mb-4">
            <Zap className="w-3 h-3" /> Integrations
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight mb-2">Connect the tools you already use.</h1>
          <p className="text-white/60 max-w-xl">Like Xero's bank feeds — set up once, run forever. Connected tools pre-fill your safety plans so you stop re-typing the same info.</p>
        </div>
      </div>

      {loading && (
        <div className="text-muted-foreground text-sm">Loading integrations…</div>
      )}
      {error && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 text-sm text-destructive">{error}</div>
      )}

      {byCategory && Object.entries(byCategory).map(([category, items]) => (
        <div key={category} className="mb-8">
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
            <span>{CATEGORY_ICONS[category] ?? "🔌"}</span> {category}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((integration) => {
              if (integration.provider === "xero") {
                if (!xeroEnabled) return null;
                return <XeroCard key={integration.provider} integration={integration} />;
              }
              return (
                <div
                  key={integration.provider}
                  className={`bg-card border rounded-xl p-5 transition-all hover:-translate-y-0.5 ${integration.notified ? "border-primary/50 shadow-sm" : ""}`}
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <h3 className="font-bold text-base">{integration.name}</h3>
                      <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{integration.category}</span>
                    </div>
                    {integration.available ? (
                      <span className="text-xs font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full shrink-0">Available</span>
                    ) : (
                      <span className="text-xs font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full shrink-0">Coming soon</span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{integration.tagline}</p>
                  {integration.available ? (
                    <button className="w-full text-sm font-semibold bg-primary text-white py-2 rounded-md hover:bg-primary/90 transition-colors">
                      Connect
                    </button>
                  ) : (
                    <button
                      disabled={pending === integration.provider}
                      onClick={() => handleToggle(integration.provider, integration.notified)}
                      className={`w-full text-sm font-semibold py-2 rounded-md transition-colors flex items-center justify-center gap-2 ${integration.notified ? "bg-primary/10 text-primary hover:bg-primary/20" : "border border-input hover:bg-muted/50"}`}
                    >
                      {integration.notified ? (
                        <><CheckCircle2 className="w-3.5 h-3.5" /> Notified</>
                      ) : (
                        <><Bell className="w-3.5 h-3.5" /> Get notified</>
                      )}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      <div className="bg-card border rounded-xl p-6 mt-4">
        <h2 className="font-bold text-lg mb-1">Want a different integration?</h2>
        <p className="text-muted-foreground text-sm mb-4">Tell us what tool you'd connect to — accounting, scheduling, job management, CRM, anything. We prioritise what users ask for.</p>
        <a
          href="mailto:hello@formate.co.nz?subject=Integration%20request"
          className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
        >
          Email us your request →
        </a>
      </div>
    </MainLayout>
  );
}

const _unused = BellOff;
