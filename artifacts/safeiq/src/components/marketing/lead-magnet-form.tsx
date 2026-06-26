import { useState } from "react";
import { Check, Download } from "lucide-react";

const TRADES = [
  "Concrete & Grinding",
  "Builder / Carpenter",
  "Electrician",
  "Plumber / Gasfitter",
  "Painter",
  "Roofer",
  "Scaffolder",
  "Earthworks / Excavator",
  "Demolition",
  "Other trade",
];

interface LeadMagnetFormProps {
  /** Lead source tag stored against the captured email. */
  source?: string;
  /** URL of the template to open after capture. */
  templateHref?: string;
  /** Button label before submitting. */
  buttonLabel?: string;
  /** Success-state description. */
  successText?: string;
}

export function LeadMagnetForm({
  source = "sssp-template",
  templateHref = "/sssp-template.html",
  buttonLabel = "Email me the free SSSP template",
  successText = "Your free NZ SSSP template is ready to print or save as PDF.",
}: LeadMagnetFormProps) {
  const [email, setEmail] = useState("");
  const [trade, setTrade] = useState("");
  const [website, setWebsite] = useState(""); // honeypot
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const r = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          trade: trade || undefined,
          source,
          website, // honeypot — bots fill, humans don't
        }),
      });
      if (!r.ok) {
        const data = await r.json().catch(() => ({}));
        throw new Error(data.error || "Couldn't save — try again.");
      }
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save — try again.");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/20 mb-4">
          <Check className="w-6 h-6 text-primary" />
        </div>
        <h3 className="text-xl font-black tracking-tight mb-2">You're in.</h3>
        <p className="text-sm text-white/60 mb-5">{successText}</p>
        <a
          href={templateHref}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-cta hover:bg-cta/90 text-white font-bold px-5 py-3 rounded-md text-sm"
        >
          <Download className="w-4 h-4" /> Open the template
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      {/* Honeypot — hidden from real users, scraped by bots */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        value={website}
        onChange={(e) => setWebsite(e.target.value)}
        style={{ position: "absolute", left: "-9999px", width: 1, height: 1, opacity: 0 }}
        aria-hidden="true"
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input
          type="email"
          required
          placeholder="your@email.co.nz"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={busy}
          className="bg-white/10 border border-white/20 rounded-md px-4 py-3 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-primary disabled:opacity-50"
        />
        <select
          value={trade}
          onChange={(e) => setTrade(e.target.value)}
          disabled={busy}
          aria-label="Select your trade"
          className="bg-white/10 border border-white/20 rounded-md px-4 py-3 text-sm text-white focus:outline-none focus:border-primary disabled:opacity-50"
        >
          <option value="" className="bg-[#0F172A]">Your trade…</option>
          {TRADES.map((t) => (
            <option key={t} value={t} className="bg-[#0F172A]">{t}</option>
          ))}
        </select>
      </div>
      <button
        type="submit"
        disabled={busy}
        className="w-full inline-flex items-center justify-center gap-2 bg-cta hover:bg-cta/90 text-white font-bold px-5 py-3.5 rounded-md disabled:opacity-50 transition-colors"
      >
        <Download className="w-4 h-4" />
        {busy ? "Sending…" : buttonLabel}
      </button>
      {error && <p className="text-xs text-red-300">{error}</p>}
      <p className="text-[11px] text-white/40 text-center">
        No spam. Just the template + the occasional tip. Unsubscribe anytime.
      </p>
    </form>
  );
}
