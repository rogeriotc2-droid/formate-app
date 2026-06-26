import { useEffect, useState } from "react";
import { Smartphone, Download, X, Share } from "lucide-react";
import { useInstallPrompt } from "@/hooks/use-install-prompt";
import { Button } from "@/components/ui/button";

const DISMISS_KEY = "formate.installBanner.dismissedAt.v2";
const DISMISS_DAYS = 7;

export function InstallBanner() {
  const { prompt, install, isInstalled, isIos } = useInstallPrompt();
  const [dismissed, setDismissed] = useState(true);
  const [showIosHint, setShowIosHint] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(DISMISS_KEY);
      if (!raw) { setDismissed(false); return; }
      const at = parseInt(raw, 10);
      if (Number.isNaN(at)) { setDismissed(false); return; }
      const ageMs = Date.now() - at;
      setDismissed(ageMs < DISMISS_DAYS * 24 * 60 * 60 * 1000);
    } catch {
      setDismissed(false);
    }
  }, []);

  if (isInstalled || dismissed) return null;
  if (!prompt && !isIos) return null;

  const onDismiss = () => {
    try { localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch { /* ignore */ }
    setDismissed(true);
  };

  return (
    <div className="mb-4 rounded-xl border border-primary/30 bg-gradient-to-r from-primary/10 to-primary/5 p-4 relative">
      <button
        onClick={onDismiss}
        className="absolute top-2 right-2 text-muted-foreground hover:text-foreground"
        aria-label="Dismiss"
      >
        <X className="w-4 h-4" />
      </button>
      <div className="flex items-start gap-3 pr-6">
        <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
          <Smartphone className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm">Put Formate on your home screen</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Opens like a normal app — one tap to a new SSSP from your phone.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {isIos ? (
              <Button
                size="sm"
                onClick={() => setShowIosHint(v => !v)}
                className="bg-primary hover:bg-primary/90 text-white"
              >
                <Share className="w-4 h-4 mr-1.5" />
                Show me how
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={install}
                className="bg-primary hover:bg-primary/90 text-white"
              >
                <Download className="w-4 h-4 mr-1.5" />
                Install Formate
              </Button>
            )}
            <button
              onClick={onDismiss}
              className="text-xs text-muted-foreground hover:text-foreground font-medium px-2 py-1.5"
            >
              Not now
            </button>
          </div>
          {isIos && showIosHint && (
            <div className="mt-3 rounded-md bg-background border border-border px-3 py-2.5 text-xs leading-relaxed">
              <div className="font-semibold mb-1">In Safari:</div>
              <ol className="space-y-1 list-decimal list-inside text-muted-foreground">
                <li>Tap the <Share className="inline w-3 h-3 mx-0.5" /> <strong className="text-foreground">Share</strong> button (bottom of screen)</li>
                <li>Scroll down and tap <strong className="text-foreground">Add to Home Screen</strong></li>
                <li>Tap <strong className="text-foreground">Add</strong> — done!</li>
              </ol>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
