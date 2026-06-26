import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { CheckCircle2, Zap, Clock, Star, CreditCard, ExternalLink } from "lucide-react";
import { authedFetch } from "@/lib/api";

interface BillingStatus {
  currentPlan: string;
  trialStartedAt: string | null;
  trialDaysRemaining: number | null;
  trialExpired: boolean;
  isActive: boolean;
  subscriptionStatus: string | null;
  foundingPriceNzd: number;
}

export default function BillingPage() {
  const [status, setStatus] = useState<BillingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => {
    authedFetch("/api/billing")
      .then((r) => r.json())
      .then((d) => { setStatus(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  async function handleCheckout() {
    setCheckoutLoading(true);
    try {
      const r = await authedFetch("/api/billing/checkout", { method: "POST" });
      const data = await r.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert("Payments are coming very soon!\n\nEmail hello@formate.co.nz to get set up early and we'll sort you out.");
      }
    } catch {
      alert("Payments are coming very soon!\n\nEmail hello@formate.co.nz to get set up early and we'll sort you out.");
    } finally {
      setCheckoutLoading(false);
    }
  }

  async function handlePortal() {
    setPortalLoading(true);
    try {
      const r = await authedFetch("/api/billing/portal");
      const data = await r.json();
      if (data.url) window.location.href = data.url;
    } catch {
      alert("Something went wrong. Please try again.");
    } finally {
      setPortalLoading(false);
    }
  }

  const days = status?.trialDaysRemaining ?? null;
  const isTrialing = days !== null && days > 0 && !status?.isActive;
  const isExpired = status?.trialExpired && !status?.isActive;
  const isActive = status?.isActive;

  return (
    <MainLayout>
      {/* Header */}
      <div className="bg-[#0F172A] rounded-xl p-8 mb-6 relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(circle at 80% 50%, rgba(232,119,34,0.18), transparent 60%)" }}
        />
        <div className="relative">
          <div className="inline-flex items-center gap-2 bg-primary/20 text-primary text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full mb-4">
            <Zap className="w-3 h-3" /> Plans &amp; billing
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight mb-2">
            {isActive ? "You're all set 🎉" : "Simple, honest pricing."}
          </h1>
          <p className="text-white/60 text-sm">
            {isActive
              ? "Founding Member plan · $9 NZD/month locked in forever."
              : "30-day free trial. No credit card needed to start."}
          </p>
        </div>
      </div>

      {loading && (
        <div className="text-muted-foreground text-sm py-8 text-center">Loading…</div>
      )}

      {!loading && status && (
        <div className="space-y-6">
          {/* Trial countdown banner */}
          {isTrialing && (
            <div className="bg-primary/10 border border-primary/30 rounded-xl p-5 flex items-start gap-4">
              <div className="bg-primary/20 rounded-full p-2 shrink-0">
                <Clock className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-foreground">
                  {days === 1 ? "Last day of your trial" : `${days} days left in your free trial`}
                </p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  After your trial, continue as a Founding Member for just $9 NZD/month — locked in forever.
                </p>
              </div>
              <button
                onClick={handleCheckout}
                disabled={checkoutLoading}
                className="shrink-0 bg-primary text-white text-sm font-bold px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-60 whitespace-nowrap"
              >
                {checkoutLoading ? "Loading…" : "Activate plan →"}
              </button>
            </div>
          )}

          {/* Trial expired banner */}
          {isExpired && (
            <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-5 flex items-start gap-4">
              <div className="bg-destructive/20 rounded-full p-2 shrink-0">
                <Clock className="w-5 h-5 text-destructive" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-foreground">Your free trial has ended</p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Subscribe now to continue using Formate. $9 NZD/month, no contracts.
                </p>
              </div>
              <button
                onClick={handleCheckout}
                disabled={checkoutLoading}
                className="shrink-0 bg-primary text-white text-sm font-bold px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-60 whitespace-nowrap"
              >
                {checkoutLoading ? "Loading…" : "Subscribe →"}
              </button>
            </div>
          )}

          {/* Active subscription */}
          {isActive && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-5 flex items-center gap-4">
              <div className="bg-green-500/20 rounded-full p-2 shrink-0">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-foreground">Founding Member — Active</p>
                <p className="text-sm text-muted-foreground">$9 NZD/month · locked in forever · no price increases</p>
              </div>
              <button
                onClick={handlePortal}
                disabled={portalLoading}
                className="shrink-0 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground border border-input px-3 py-2 rounded-lg transition-colors disabled:opacity-60"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                {portalLoading ? "Loading…" : "Manage"}
              </button>
            </div>
          )}

          {/* Founding member plan card */}
          {!isActive && (
            <div className="bg-card border-2 border-primary rounded-xl p-6 relative">
              <div className="absolute -top-3.5 left-6 bg-primary text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                <Star className="w-3 h-3" /> Founding Member offer
              </div>

              <div className="flex items-start justify-between gap-4 mb-5">
                <div>
                  <h3 className="font-black text-xl">Founding Member</h3>
                  <p className="text-sm text-muted-foreground">For the first 20 tradies — rate locked forever.</p>
                </div>
                <div className="text-right shrink-0">
                  <div className="flex items-end gap-1">
                    <span className="text-4xl font-black">$9</span>
                    <span className="text-sm text-muted-foreground mb-1">NZD/month</span>
                  </div>
                  <p className="text-xs text-primary font-semibold">Never increases</p>
                </div>
              </div>

              <ul className="space-y-2.5 mb-6">
                {[
                  "Unlimited safety forms (SSSP, SWMS, JSA)",
                  "Sticky fields — open the form, it's already filled",
                  "Clean signed PDFs, organised by site",
                  "Send for sign — email your PCBU for sign-off",
                  "30-day free trial, no credit card needed",
                  "Rate locked forever — never goes up",
                ].map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={handleCheckout}
                disabled={checkoutLoading}
                className="w-full bg-primary text-white font-bold py-3 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
              >
                <CreditCard className="w-4 h-4" />
                {checkoutLoading
                  ? "Loading…"
                  : isTrialing
                  ? `Activate plan — ${days} day${days === 1 ? "" : "s"} free remaining`
                  : "Start my plan — $9 NZD/month"}
              </button>

              <p className="text-xs text-muted-foreground text-center mt-3">
                {isTrialing
                  ? "Your card won't be charged until your trial ends."
                  : "30-day free trial · No credit card needed to start · Cancel anytime"}
              </p>
            </div>
          )}

          {/* Why this price */}
          <div className="bg-card border rounded-xl p-6">
            <h2 className="font-bold text-lg mb-3">Why $9?</h2>
            <p className="text-sm text-muted-foreground mb-3">
              Built for tradies who don't need a full enterprise H&amp;S platform. Tools like HazardCo start at $138/month — fair for big builders, overkill for subbies.
            </p>
            <p className="text-sm text-muted-foreground mb-3">
              We charge less because we do less. That's the point.
            </p>
            <div className="bg-muted/50 rounded-lg p-4 border-l-4 border-primary">
              <p className="text-sm font-medium">The maths:</p>
              <p className="text-sm text-muted-foreground mt-1">
                Save ~8 hours of paperwork a month at $25/hr = <strong className="text-foreground">$200 back in your pocket</strong>. That's a 22× return on $9.
              </p>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
