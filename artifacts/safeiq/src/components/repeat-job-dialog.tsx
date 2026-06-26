/**
 * Repeat Last Job dialog — the absolute fastest path.
 * Everything is copied from the last SSSP. Only date + site address shown.
 * One tap → done.
 */
import { useState, useEffect, useCallback, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RotateCcw, MapPin, Mic, MicOff, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { useCreateSssp, getListSsspsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import type { SsspItem } from "./quick-job-dialog";

interface RepeatJobDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lastSssp?: SsspItem;
}

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

function useSpeech(onResult: (text: string) => void) {
  const [listening, setListening] = useState(false);
  const recRef = useRef<any>(null);
  const SR = typeof window !== "undefined" ? ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition) : null;
  const supported = !!SR;
  const start = useCallback(() => {
    if (!SR || listening) return;
    const rec = new SR();
    recRef.current = rec;
    rec.lang = "en-NZ"; rec.interimResults = false; rec.maxAlternatives = 1;
    rec.onresult = (e: any) => onResult(e.results[0][0].transcript);
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    rec.start(); setListening(true);
  }, [SR, listening, onResult]);
  const stop = useCallback(() => { recRef.current?.stop(); setListening(false); }, []);
  return { supported, listening, start, stop };
}

export function RepeatJobDialog({ open, onOpenChange, lastSssp }: RepeatJobDialogProps) {
  const createSssp = useCreateSssp();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const lastData = (lastSssp?.data as Record<string, unknown>) ?? {};
  const lastPcbu1 = (lastData.pcbu1 as Record<string, string> | undefined) ?? {};
  const today = format(new Date(), "yyyy-MM-dd");

  const [date, setDate] = useState(today);
  const [siteAddress, setSiteAddress] = useState("");
  const [gpsLoading, setGpsLoading] = useState(false);

  const speech = useSpeech(setSiteAddress);

  useEffect(() => {
    if (open) {
      setDate(today);
      setSiteAddress((lastData.siteAddress as string) ?? "");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

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

  function handleSubmit(sameAddress = false) {
    const address = sameAddress ? (lastData.siteAddress as string ?? "") : siteAddress.trim();
    if (!address) return;

    const newData = {
      ...lastData,
      siteAddress: address,
      pcbu2SignedDate: date,
    };

    const pcbu1Name = lastPcbu1.company || "Job";
    const jobName = `${pcbu1Name} — ${address}`;

    createSssp.mutate(
      { data: { projectName: jobName, status: "active", data: newData } },
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

  if (!lastSssp) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <RotateCcw className="w-5 h-5 text-primary" />
            <DialogTitle className="font-black">Repeat Last Job</DialogTitle>
          </div>
          <DialogDescription>
            Everything copies from your last SSSP — just confirm the date and address.
          </DialogDescription>
        </DialogHeader>

        {/* Summary of what's being copied */}
        <div className="rounded-md bg-muted/40 border border-border px-4 py-3 text-sm space-y-1">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Copying from last job</p>
          {lastPcbu1.company && <p className="font-semibold">PCBU 1: {lastPcbu1.company}</p>}
          {!!lastData.siteAddress && <p className="text-muted-foreground">Last site: {String(lastData.siteAddress)}</p>}
          <p className="text-xs text-muted-foreground">All hazards, procedures, PPE + PCBU 2 carry over.</p>
        </div>

        <div className="space-y-4">
          {/* Date */}
          <div className="space-y-1.5">
            <Label className="font-semibold text-xs uppercase tracking-wide">Today's date</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>

          {/* Site address */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="font-semibold text-xs uppercase tracking-wide">Site address</Label>
              <button
                type="button"
                onClick={handleGps}
                disabled={gpsLoading}
                className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline disabled:opacity-50"
              >
                {gpsLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <MapPin className="w-3.5 h-3.5" />}
                {gpsLoading ? "Locating…" : "Use GPS"}
              </button>
            </div>
            <div className="relative">
              <Input
                placeholder="New site address, or leave for same site"
                value={siteAddress}
                onChange={(e) => setSiteAddress(e.target.value)}
                className="pr-9"
              />
              {speech.supported && (
                <button
                  type="button"
                  onClick={speech.listening ? speech.stop : speech.start}
                  className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md transition-colors ${
                    speech.listening ? "text-red-500 animate-pulse" : "text-muted-foreground hover:text-primary hover:bg-muted"
                  }`}
                >
                  {speech.listening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-col gap-2">
          <Button
            onClick={() => handleSubmit(false)}
            disabled={!siteAddress.trim() || createSssp.isPending}
            className="gap-2 w-full"
          >
            <RotateCcw className="w-4 h-4" />
            {createSssp.isPending ? "Creating…" : "Create + Open PDF"}
          </Button>
          <Button
            variant="outline"
            onClick={() => handleSubmit(true)}
            disabled={createSssp.isPending}
            className="w-full text-sm"
          >
            Same site as last time
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
