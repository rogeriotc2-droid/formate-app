import { useState, useEffect, useRef, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Zap, MapPin, Mic, MicOff, Loader2, Building2, X } from "lucide-react";
import { format } from "date-fns";
import { useCreateSssp, getListSsspsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { authedFetch } from "@/lib/api";

export interface SsspItem {
  id: number;
  data: unknown;
  updatedAt: string;
  projectName: string;
}

interface Company {
  businessName: string;
  tradingName?: string | null;
  mainContactName: string;
  mainContactPhone: string;
  safetyRepName?: string | null;
  firstAidName?: string | null;
}

interface QuickJobDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recentSssps?: SsspItem[];
}

function useStickyDefaults(recentSssps?: SsspItem[]) {
  const [company, setCompany] = useState<Company | null>(null);
  useEffect(() => {
    authedFetch("/api/company").then(r => r.ok ? r.json() : null).then(d => d && setCompany(d)).catch(() => {});
  }, []);
  const lastData = (recentSssps?.[0]?.data as Record<string, unknown>) ?? {};
  const lastPcbu1 = (lastData.pcbu1 as Record<string, string> | undefined) ?? {};
  const lastSiteAddress = (lastData.siteAddress as string) ?? "";
  return { company, lastPcbu1, lastSiteAddress };
}

/** Extract unique PCBU 1 companies from past SSSPs for autocomplete */
function usePcbu1History(recentSssps?: SsspItem[]) {
  return Array.from(
    new Map(
      (recentSssps ?? [])
        .map(s => {
          const d = (s.data as Record<string, unknown>) ?? {};
          const p = (d.pcbu1 as Record<string, string> | undefined);
          return p?.company ? { company: p.company, contact: p.contact ?? "", phone: p.phone ?? "" } : null;
        })
        .filter(Boolean)
        .map(p => [p!.company.toLowerCase(), p!] as const)
    ).values()
  );
}

/** GPS → readable NZ address via OpenStreetMap Nominatim (free, no API key) */
async function gpsToAddress(): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) { reject(new Error("GPS not available")); return; }
    navigator.geolocation.getCurrentPosition(async pos => {
      try {
        const { latitude: lat, longitude: lon } = pos.coords;
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1`,
          { headers: { "Accept-Language": "en" } }
        );
        const data = await res.json();
        const a = data.address ?? {};
        const parts = [
          a.house_number && a.road ? `${a.house_number} ${a.road}` : a.road,
          a.suburb || a.neighbourhood || a.village || a.town || a.city,
        ].filter(Boolean);
        resolve(parts.join(", ") || data.display_name || "");
      } catch { reject(new Error("Could not get address")); }
    }, () => reject(new Error("Location denied")));
  });
}

/** Web Speech API — works on Chrome/Edge/Android Chrome. Returns transcript. */
function useSpeech(onResult: (text: string) => void) {
  const [listening, setListening] = useState(false);
  const recRef = useRef<any>(null);
  const SR = typeof window !== "undefined" ? ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition) : null;
  const supported = !!SR;

  const start = useCallback(() => {
    if (!SR || listening) return;
    const rec = new SR();
    recRef.current = rec;
    rec.lang = "en-NZ";
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript;
      onResult(transcript);
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    rec.start();
    setListening(true);
  }, [SR, listening, onResult]);

  const stop = useCallback(() => { recRef.current?.stop(); setListening(false); }, []);

  return { supported, listening, start, stop };
}

/** Small mic toggle button */
function MicButton({ onResult, disabled }: { onResult: (t: string) => void; disabled?: boolean }) {
  const { supported, listening, start, stop } = useSpeech(onResult);
  if (!supported) return null;
  return (
    <button
      type="button"
      onClick={listening ? stop : start}
      disabled={disabled}
      title={listening ? "Stop listening" : "Speak to fill"}
      className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md transition-colors ${
        listening ? "text-red-500 bg-red-50 dark:bg-red-900/30 animate-pulse" : "text-muted-foreground hover:text-primary hover:bg-muted"
      }`}
    >
      {listening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
    </button>
  );
}

export function QuickJobDialog({ open, onOpenChange, recentSssps }: QuickJobDialogProps) {
  const { company, lastPcbu1, lastSiteAddress } = useStickyDefaults(recentSssps);
  const pcbu1History = usePcbu1History(recentSssps);
  const createSssp = useCreateSssp();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const today = format(new Date(), "yyyy-MM-dd");
  const [date, setDate] = useState(today);
  const [siteAddress, setSiteAddress] = useState("");
  const [gpsLoading, setGpsLoading] = useState(false);
  const [pcbu1Company, setPcbu1Company] = useState("");
  const [pcbu1Contact, setPcbu1Contact] = useState("");
  const [pcbu1Phone, setPcbu1Phone] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Filter suggestions based on what's typed
  const suggestions = pcbu1Company.trim().length >= 1
    ? pcbu1History.filter(h => h.company.toLowerCase().includes(pcbu1Company.toLowerCase()) && h.company !== pcbu1Company)
    : [];

  useEffect(() => {
    if (open) {
      setDate(today);
      setSiteAddress(lastSiteAddress || "");
      setPcbu1Company(lastPcbu1.company || "");
      setPcbu1Contact(lastPcbu1.contact || "");
      setPcbu1Phone(lastPcbu1.phone || "");
      setShowSuggestions(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, lastSiteAddress, lastPcbu1.company]);

  async function handleGps() {
    setGpsLoading(true);
    try {
      const addr = await gpsToAddress();
      setSiteAddress(addr);
      toast({ title: "Location found", description: addr });
    } catch (err: any) {
      toast({ title: "GPS error", description: err.message || "Could not get location", variant: "destructive" });
    } finally { setGpsLoading(false); }
  }

  function selectSuggestion(s: { company: string; contact: string; phone: string }) {
    setPcbu1Company(s.company);
    setPcbu1Contact(s.contact);
    setPcbu1Phone(s.phone);
    setShowSuggestions(false);
  }

  const canSubmit = siteAddress.trim() && pcbu1Company.trim();

  function handleSubmit() {
    if (!canSubmit) return;
    const pcbu2Company = company?.tradingName || company?.businessName || "";
    const pcbu2Contact = company?.mainContactName || "";
    const pcbu2Phone = "";
    const safetyRep = company?.safetyRepName || company?.mainContactName || "";
    const firstAid = company?.firstAidName || company?.mainContactName || "";
    const jobName = `${pcbu1Company} — ${siteAddress}`;
    const initialData = {
      _template: "line-marking",
      siteAddress: siteAddress.trim(),
      activities: "Line marking and concrete grinding",
      pcbu1: { company: pcbu1Company.trim(), contact: pcbu1Contact.trim() || undefined, phone: pcbu1Phone.trim() || undefined, role: "Principal / Client" },
      pcbu2: { company: pcbu2Company, contact: pcbu2Contact, phone: pcbu2Phone, role: "Subcontractor", safetyRep, firstAid },
      pcbu2SignedBy: pcbu2Contact,
      pcbu2SignedDate: date,
    };
    createSssp.mutate(
      { data: { projectName: jobName, status: "active", data: initialData } },
      {
        onSuccess: (sssp) => {
          queryClient.invalidateQueries({ queryKey: getListSsspsQueryKey() });
          toast({ title: "Job created!", description: "Review, sign, then send to PCBU 1." });
          onOpenChange(false);
          navigate(`/sssps/${sssp.id}`);
        },
        onError: () => toast({ title: "Error", description: "Failed to create job", variant: "destructive" }),
      }
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <Zap className="w-5 h-5 text-primary" />
            <DialogTitle className="font-black">Quick SSSP</DialogTitle>
          </div>
          <DialogDescription>
            Fill 2 fields — PDF opens instantly. Everything else carries over from your last job.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-1">
          {/* Date */}
          <div className="space-y-1.5">
            <Label className="font-semibold text-xs uppercase tracking-wide">Date</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>

          {/* Site address + GPS + Voice */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="font-semibold text-xs uppercase tracking-wide">Site address <span className="text-destructive">*</span></Label>
              <button
                type="button"
                onClick={handleGps}
                disabled={gpsLoading}
                className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline disabled:opacity-50"
              >
                {gpsLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <MapPin className="w-3.5 h-3.5" />}
                {gpsLoading ? "Locating…" : "Use my location"}
              </button>
            </div>
            <div className="relative">
              <Input
                placeholder="e.g. 117 South Belt Rd, Christchurch"
                value={siteAddress}
                onChange={(e) => setSiteAddress(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                className="pr-9"
              />
              <MicButton onResult={setSiteAddress} />
            </div>
          </div>

          {/* PCBU 1 with history autocomplete + voice */}
          <div className="space-y-2">
            <Label className="font-semibold text-xs uppercase tracking-wide">
              PCBU 1 — Client / Principal <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <Input
                  placeholder="Company name (type to search history)"
                  value={pcbu1Company}
                  onChange={(e) => { setPcbu1Company(e.target.value); setShowSuggestions(true); }}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                  onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                  className="pl-9 pr-9"
                />
                <MicButton onResult={(t) => { setPcbu1Company(t); setShowSuggestions(false); }} />
              </div>
              {/* Suggestions dropdown */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-popover border border-border rounded-md shadow-lg overflow-hidden">
                  {suggestions.map((s) => (
                    <button
                      key={s.company}
                      type="button"
                      onMouseDown={() => selectSuggestion(s)}
                      className="w-full text-left px-3 py-2.5 hover:bg-muted transition-colors flex items-center gap-2"
                    >
                      <Building2 className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <div>
                        <p className="text-sm font-semibold">{s.company}</p>
                        {s.contact && <p className="text-xs text-muted-foreground">{s.contact}{s.phone ? ` · ${s.phone}` : ""}</p>}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Input placeholder="Contact name" value={pcbu1Contact} onChange={(e) => setPcbu1Contact(e.target.value)} />
              <Input placeholder="Phone" value={pcbu1Phone} onChange={(e) => setPcbu1Phone(e.target.value)} />
            </div>
          </div>

          {/* PCBU 2 — auto-filled read-only preview */}
          {company && (
            <div className="rounded-md bg-muted/40 border border-border px-4 py-3 text-sm">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">PCBU 2 — Your company (auto-filled)</p>
              <p className="font-semibold">{company.tradingName || company.businessName}</p>
              <p className="text-muted-foreground">{company.mainContactName}</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!canSubmit || createSssp.isPending} className="gap-2">
            <Zap className="w-4 h-4" />
            {createSssp.isPending ? "Creating…" : "Generate SSSP + PDF"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
