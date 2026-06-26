import { useState } from "react";
import { useLocation } from "wouter";
import { Shield, ArrowRight } from "lucide-react";
import { authedFetch } from "@/lib/api";
import { useCompanyStatus } from "@/lib/company-status";

const TRADES = [
  // Concrete & surfaces
  ["concrete_grinding", "Concrete Grinding"],
  ["concrete_laying", "Concrete Laying & Finishing"],
  ["asphalt", "Asphalt / Bitumen Laying"],
  ["line_marking", "Line Marking"],
  // Structural & civil
  ["civil", "Civil / Earthworks"],
  ["demolition", "Demolition"],
  ["scaffolding", "Scaffolding"],
  ["bricklaying", "Bricklaying / Masonry"],
  // Building trades
  ["carpentry", "Carpentry / Joinery"],
  ["roofing", "Roofing"],
  ["glazing", "Glazing / Aluminium Joinery"],
  ["plastering", "Plastering / Gib Stopping"],
  ["tiling", "Tiling (floor & wall)"],
  ["insulation", "Insulation Installation"],
  // Services
  ["electrical", "Electrical"],
  ["plumbing", "Plumbing"],
  ["gas_fitting", "Gas Fitting"],
  ["drainage", "Drainage / Sewer"],
  ["hvac", "HVAC / Refrigeration"],
  ["fire_protection", "Fire Protection / Sprinklers"],
  ["security", "Security / Alarms / CCTV"],
  // Finishing & other
  ["painting", "Painting & Decorating"],
  ["landscaping", "Landscaping / Grounds"],
  ["cleaning", "Commercial Cleaning"],
  ["welding", "Welding & Fabrication"],
  ["pest_control", "Pest Control"],
  ["general", "General / Other trade"],
] as const;

export default function Onboarding() {
  const [, navigate] = useLocation();
  const { refresh } = useCompanyStatus();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    businessName: "",
    tradingName: "",
    website: "",
    mainContactName: "",
    mainContactPhone: "",
    mainContactEmail: "",
    safetyRepName: "",
    safetyRepPhone: "",
    firstAidName: "",
    firstAidPhone: "",
    primaryTrade: "general",
    signupIntent: "",
    country: "NZ",
  });

  function set(field: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await authedFetch("/api/company", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Save failed");
      }
      // Refresh company status before navigating so ProtectedRoute sees the new
      // company and doesn't bounce us straight back to onboarding (infinite loop).
      // Only navigate once the status actually reflects a saved company, otherwise
      // ProtectedRoute would redirect us right back here.
      const next = await refresh();
      if (next === "no" || next === "loading") {
        throw new Error("Saved, but we couldn't confirm your company. Please try again.");
      }
      try { (window as any).fbq?.("track", "CompleteRegistration"); } catch { /* ignore */ }
      navigate("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-start py-12 px-4">
      {/* Header */}
      <div className="w-full max-w-2xl mb-8">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-2.5 h-2.5 rounded-full bg-primary" />
          <span className="text-xl font-black tracking-tight"><span className="text-foreground">FOR</span><span className="text-primary">MATE</span></span>
        </div>
        <div className="bg-primary/10 border border-primary/20 rounded-xl p-6 mb-6">
          <div className="inline-flex items-center gap-2 bg-primary/20 text-primary text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full mb-3">
            <Shield className="w-3 h-3" /> Quick setup · 5 minutes
          </div>
          <h1 className="text-3xl font-black tracking-tight mb-2">Let's set up your safety system.</h1>
          <p className="text-muted-foreground">Tell us about your business. We'll pre-load standard hazards, PPE and controls for your trade. Everything can be edited later.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="w-full max-w-2xl space-y-8">
        {/* Business */}
        <div className="bg-card border rounded-xl p-6">
          <h2 className="text-lg font-bold mb-4">Your business</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-1.5">Business name <span className="text-destructive">*</span></label>
              <input
                type="text"
                required
                value={form.businessName}
                onChange={(e) => set("businessName", e.target.value)}
                className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                placeholder="RTC Concrete Grinding Ltd"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-1.5">Trading name <span className="text-muted-foreground font-normal">if different</span></label>
                <input
                  type="text"
                  value={form.tradingName}
                  onChange={(e) => set("tradingName", e.target.value)}
                  className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5">Website <span className="text-muted-foreground font-normal">optional</span></label>
                <input
                  type="url"
                  value={form.website}
                  onChange={(e) => set("website", e.target.value)}
                  className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                  placeholder="https://"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Contact details */}
        <div className="bg-card border rounded-xl p-6">
          <h2 className="text-lg font-bold mb-1">Contact details</h2>
          <p className="text-sm text-muted-foreground mb-4">These appear on every SSSP as PCBU 2 (contractor) contact info.</p>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-1.5">Main contact name <span className="text-destructive">*</span></label>
                <input
                  type="text"
                  required
                  value={form.mainContactName}
                  onChange={(e) => set("mainContactName", e.target.value)}
                  className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                  placeholder="Rogerio Taher Correa"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5">Phone <span className="text-destructive">*</span></label>
                <input
                  type="tel"
                  required
                  value={form.mainContactPhone}
                  onChange={(e) => set("mainContactPhone", e.target.value)}
                  className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                  placeholder="021 000 0000"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5">Email</label>
              <input
                type="email"
                value={form.mainContactEmail}
                onChange={(e) => set("mainContactEmail", e.target.value)}
                className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                placeholder="you@example.co.nz"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-1.5">On-site safety rep <span className="text-muted-foreground font-normal">usually you</span></label>
                <input
                  type="text"
                  value={form.safetyRepName}
                  onChange={(e) => set("safetyRepName", e.target.value)}
                  className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5">Phone</label>
                <input
                  type="tel"
                  value={form.safetyRepPhone}
                  onChange={(e) => set("safetyRepPhone", e.target.value)}
                  className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-1.5">First aid rep <span className="text-muted-foreground font-normal">usually you</span></label>
                <input
                  type="text"
                  value={form.firstAidName}
                  onChange={(e) => set("firstAidName", e.target.value)}
                  className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5">Phone</label>
                <input
                  type="tel"
                  value={form.firstAidPhone}
                  onChange={(e) => set("firstAidPhone", e.target.value)}
                  className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Trade */}
        <div className="bg-card border rounded-xl p-6">
          <h2 className="text-lg font-bold mb-1">Your trade</h2>
          <p className="text-sm text-muted-foreground mb-4">We'll pre-load standard hazards, PPE and controls for this trade. Customise everything later.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-1.5">Closest match <span className="text-destructive">*</span></label>
              <select
                required
                value={form.primaryTrade}
                onChange={(e) => set("primaryTrade", e.target.value)}
                className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                {TRADES.map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5">Country</label>
              <select
                value={form.country}
                onChange={(e) => set("country", e.target.value)}
                className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="NZ">🇳🇿 New Zealand (SSSP)</option>
                <option value="AU">🇦🇺 Australia (SWMS)</option>
              </select>
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-semibold mb-1.5">What made you look today? <span className="text-muted-foreground font-normal">optional</span></label>
            <select
              value={form.signupIntent}
              onChange={(e) => set("signupIntent", e.target.value)}
              className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="">Choose one…</option>
              <option value="builder_asked">A builder or main contractor asked me for safety docs</option>
              <option value="prequal">Renewing / chasing a Site Safe or prequal requirement</option>
              <option value="from_paper">Sick of doing it on paper</option>
              <option value="from_other_app">Switching from another app</option>
              <option value="exploring">Just having a look</option>
            </select>
          </div>
        </div>

        {/* Info box */}
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 text-sm text-muted-foreground">
          After setup you can edit every hazard, control, PPE item, substance and emergency procedure under <strong className="text-foreground">Settings</strong>. Your content is yours — we never share or sell it.
        </div>

        {error && (
          <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 text-sm text-destructive">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 disabled:opacity-60 text-white font-bold py-3.5 rounded-md transition-colors text-base"
        >
          {saving ? "Saving…" : <>Finish setup — go to dashboard <ArrowRight className="w-4 h-4" /></>}
        </button>
      </form>
    </div>
  );
}
