import { useEffect, useMemo, useRef, useState } from "react";
import { Search, Link2, Check, RefreshCw, Loader2 } from "lucide-react";
import { authedFetch } from "@/lib/api";
import { Input } from "@/components/ui/input";

// If the last Xero sync is older than this, fire a silent background re-sync
// when the picker mounts so newly-added Xero contacts show up without the
// tradie having to remember to hit Settings → Integrations → Sync.
const STALE_SYNC_MS = 5 * 60 * 1000;

export interface XeroContact {
  id: string;
  name: string;
  firstName?: string | null;
  lastName?: string | null;
  emailAddress?: string | null;
  phone?: string | null;
  addressLine?: string | null;
  city?: string | null;
  postalCode?: string | null;
  country?: string | null;
}

export interface XeroPickerFill {
  company: string;
  contact?: string;
  email?: string;
  phone?: string;
}

interface Props {
  onSelect: (fill: XeroPickerFill) => void;
}

export function XeroContactPicker({ onSelect }: Props) {
  const [contacts, setContacts] = useState<XeroContact[] | null>(null);
  const [connected, setConnected] = useState<boolean | null>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [pickedName, setPickedName] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [justSynced, setJustSynced] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  async function loadContacts() {
    const cRes = await authedFetch("/api/xero/contacts");
    if (!cRes.ok) return null;
    return (await cRes.json()) as XeroContact[];
  }

  async function runSync(): Promise<XeroContact[] | null> {
    setSyncing(true);
    setSyncError(null);
    try {
      const sRes = await authedFetch("/api/xero/sync", { method: "POST" });
      if (!sRes.ok) {
        let msg = `Sync failed (${sRes.status})`;
        try {
          const body = await sRes.json() as { error?: string };
          if (body.error) msg = body.error;
        } catch { /* ignore */ }
        setSyncError(msg);
        return null;
      }
      const list = await loadContacts();
      return list;
    } catch (err) {
      setSyncError(err instanceof Error ? err.message : "Network error");
      return null;
    } finally {
      setSyncing(false);
    }
  }

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const sRes = await authedFetch("/api/xero/status");
        if (!sRes.ok) { if (alive) setConnected(false); return; }
        const status = await sRes.json() as { connected?: boolean; lastSyncedAt?: string | null };
        if (!alive) return;
        setConnected(!!status.connected);
        if (!status.connected) return;

        const initial = await loadContacts();
        if (!alive) return;
        if (initial) setContacts(initial);

        // Silent background refresh when the cached snapshot is stale — keeps
        // newly-added Xero clients flowing in without the tradie thinking
        // about it. We don't block the UI on this; the existing list is shown
        // immediately and replaced when the sync completes.
        const last = status.lastSyncedAt ? new Date(status.lastSyncedAt).getTime() : 0;
        const stale = !last || Date.now() - last > STALE_SYNC_MS;
        if (stale) {
          const fresh = await runSync();
          if (alive && fresh) setContacts(fresh);
        }
      } catch {
        if (alive) setConnected(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  async function manualRefresh() {
    const fresh = await runSync();
    if (fresh) {
      setContacts(fresh);
      setJustSynced(true);
      setTimeout(() => setJustSynced(false), 2500);
    }
  }

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!boxRef.current) return;
      if (!boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const matches = useMemo(() => {
    if (!contacts) return [];
    const q = query.trim().toLowerCase();
    const base = q
      ? contacts.filter(c =>
          c.name.toLowerCase().includes(q) ||
          (c.emailAddress ?? "").toLowerCase().includes(q) ||
          (c.phone ?? "").toLowerCase().includes(q))
      : contacts;
    return base.slice(0, 8);
  }, [contacts, query]);

  if (connected === null) return null;

  if (!connected) {
    return (
      <div className="rounded-sm border border-dashed border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground flex items-center gap-2">
        <Link2 className="w-3.5 h-3.5" />
        <span>
          Connect Xero in <a href="/integrations" className="text-primary font-semibold hover:underline">Settings → Integrations</a> to auto-fill PCBU 1 from your client list.
        </span>
      </div>
    );
  }

  if (contacts && contacts.length === 0) {
    return (
      <div className="rounded-sm border border-dashed border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground flex items-center gap-2">
        <Link2 className="w-3.5 h-3.5" />
        <span>
          Xero connected, but no contacts found. <a href="/integrations" className="text-primary font-semibold hover:underline">Sync now</a>.
        </span>
      </div>
    );
  }

  return (
    <div ref={boxRef} className="relative">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
        <Input
          className="h-8 pl-8 text-sm"
          placeholder={`Search ${contacts?.length ?? 0} Xero contacts to auto-fill…`}
          value={query}
          onChange={e => { setQuery(e.target.value); setPickedName(null); setOpen(true); }}
          onFocus={() => setOpen(true)}
        />
      </div>
      {pickedName && !open && (
        <div className="mt-1 flex items-center gap-1.5 text-xs text-primary">
          <Check className="w-3 h-3" />
          <span>Filled from Xero: <span className="font-semibold">{pickedName}</span> · search again to switch</span>
        </div>
      )}
      {open && matches.length > 0 && (
        <div className="absolute z-20 mt-1 w-full rounded-sm border border-border bg-background shadow-lg max-h-72 overflow-auto">
          {matches.map(c => (
            <button
              key={c.id}
              type="button"
              className="w-full text-left px-3 py-2 text-sm hover:bg-muted border-b border-border last:border-b-0"
              onClick={() => {
                const contactName = [c.firstName, c.lastName].filter(Boolean).join(" ").trim();
                onSelect({
                  company: c.name,
                  contact: contactName || undefined,
                  email: c.emailAddress ?? undefined,
                  phone: c.phone ?? undefined,
                });
                setPickedName(c.name);
                setQuery("");
                setOpen(false);
              }}
            >
              <div className="font-semibold truncate">{c.name}</div>
              <div className="text-xs text-muted-foreground truncate">
                {[c.emailAddress, c.phone, c.city].filter(Boolean).join(" · ") || "No contact details"}
              </div>
            </button>
          ))}
          <div className="sticky bottom-0 bg-background border-t border-border px-3 py-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">
                {syncing ? "Refreshing from Xero…" : justSynced ? "Up to date ✓" : `${contacts?.length ?? 0} contacts`}
              </span>
              <button
                type="button"
                disabled={syncing}
                onClick={manualRefresh}
                className="text-primary font-semibold hover:underline disabled:opacity-50 flex items-center gap-1"
              >
                {syncing ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                Refresh from Xero
              </button>
            </div>
            {syncError && (
              <p className="mt-1 text-destructive">⚠ {syncError} — try reconnecting in Settings → Integrations.</p>
            )}
          </div>
        </div>
      )}
      {open && query && matches.length === 0 && (
        <div className="absolute z-20 mt-1 w-full rounded-sm border border-border bg-background shadow-lg">
          <div className="px-3 py-2 text-xs text-muted-foreground">
            {contacts && contacts.length === 0
              ? "No Xero contacts loaded yet. Tap Refresh below to pull them in."
              : "No matching Xero contacts. Just type below to enter manually."}
          </div>
          <div className="border-t border-border px-3 py-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">
                {syncing ? "Refreshing from Xero…" : `${contacts?.length ?? 0} contacts loaded`}
              </span>
              <button
                type="button"
                disabled={syncing}
                onClick={manualRefresh}
                className="text-primary font-semibold hover:underline disabled:opacity-50 flex items-center gap-1"
              >
                {syncing ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                Refresh from Xero
              </button>
            </div>
            {syncError && (
              <p className="mt-1 text-destructive">⚠ {syncError} — try reconnecting in Settings → Integrations.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
