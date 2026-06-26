import { Link } from "wouter";
import { Shield, Zap, FileText, CheckCircle2, Clock, ArrowRight, Mail, X, Check, AlertTriangle } from "lucide-react";

const PLANS = [
  {
    name: "Starter",
    price: "$15",
    tag: "Solo subcontractor",
    features: [
      "Unlimited JHAs & JSAs",
      "Sticky fields — fill once, reuse forever",
      "Email PDF to your GC instantly",
      "30-day free trial",
    ],
  },
  {
    name: "Pro",
    price: "$25",
    tag: "Growing operation",
    featured: true,
    features: [
      "Everything in Starter",
      "Branded PDFs with your logo",
      "Up to 3 team members",
      "Priority support",
    ],
  },
  {
    name: "Team",
    price: "$59",
    tag: "Small crew (up to 10)",
    features: [
      "Everything in Pro",
      "Unlimited team members",
      "Shared site & client list",
      "Admin dashboard",
    ],
  },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-[#0F172A] text-white flex flex-col">
      {/* Nav */}
      <nav className="border-b border-white/10 sticky top-0 z-40 bg-[#0F172A]/95 backdrop-blur">
        <div className="mx-auto w-full max-w-6xl px-5 sm:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-primary" />
            <span className="text-lg sm:text-xl font-black tracking-tight">
              <span className="text-white">FOR</span><span className="text-primary">MATE</span>
            </span>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <a href="#pricing" className="hidden sm:inline text-sm font-semibold text-white/70 hover:text-white px-3 py-2">Pricing</a>
            <Link href="/sign-in">
              <button className="text-sm font-semibold text-white/70 hover:text-white px-3 sm:px-4 py-2">Sign in</button>
            </Link>
            <Link href="/sign-up">
              <button className="text-sm font-bold bg-primary hover:bg-primary/90 text-white px-4 sm:px-5 py-2 rounded-md">
                Start free trial
              </button>
            </Link>
          </div>
        </div>
      </nav>

      <main className="flex-1">

        {/* OSHA urgency banner */}
        <div className="bg-amber-500/10 border-b border-amber-500/20">
          <div className="mx-auto w-full max-w-6xl px-5 sm:px-8 py-2.5 flex items-center justify-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <p className="text-xs text-amber-300 font-semibold text-center">
              OSHA fines up to <span className="text-amber-200">$15,625 per violation</span> — a completed JHA is your first line of defense.
            </p>
          </div>
        </div>

        {/* Hero */}
        <section className="mx-auto w-full max-w-6xl px-5 sm:px-8 pt-14 sm:pt-20 pb-10 sm:pb-16 text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/30 text-primary text-[11px] sm:text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full">
            <Shield className="w-3 h-3" /> OSHA-aligned · 29 CFR 1926 & 1910
          </div>

          <h1 className="mt-6 sm:mt-8 mx-auto max-w-3xl text-5xl sm:text-7xl lg:text-8xl font-black tracking-[-0.03em] leading-[0.95]">
            JHA done in
            <br className="hidden sm:block" />
            <span className="text-primary"> 60 seconds.</span>
          </h1>

          <p className="mt-6 sm:mt-8 mx-auto max-w-xl text-base sm:text-lg text-white/60 leading-relaxed">
            Stop filling out the same generic JHA from scratch every job.
            Formate comes pre-loaded with your trade's hazards and controls —
            OSHA-aligned, on your phone, done in 60 seconds.
          </p>

          <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4">
            <Link href="/sign-up">
              <button className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white font-bold px-7 py-3.5 rounded-md text-base">
                <Zap className="w-4 h-4" /> Start 30-day free trial
              </button>
            </Link>
          </div>

          <p className="mt-5 text-xs text-white/40">No credit card. Cancel anytime. Built for US subcontractors.</p>
        </section>

        {/* Hero loop */}
        <section className="mx-auto w-full max-w-5xl px-5 sm:px-8 -mt-2 sm:-mt-4 pb-16 sm:pb-24">
          <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-[0_30px_80px_-20px_rgba(249,115,22,0.35)] bg-[#0F172A]">
            <div className="aspect-video w-full">
              <iframe
                src="/hero-loop/?locale=us"
                title="Formate in action"
                className="w-full h-full border-0"
                loading="lazy"
              />
            </div>
          </div>
          <p className="mt-3 text-center text-xs uppercase tracking-[0.2em] text-white/40 font-semibold">
            See it in action — auto-loops
          </p>
        </section>

        {/* Pain vs Formate comparison */}
        <section className="mx-auto w-full max-w-5xl px-5 sm:px-8 pb-16 sm:pb-24">
          <h2 className="text-center text-3xl sm:text-4xl font-black tracking-tight mb-3">
            Faster than a generic PDF form.
          </h2>
          <p className="text-center text-white/60 max-w-2xl mx-auto mb-10 text-sm sm:text-base">
            We measured every screen against one question:{" "}
            <span className="text-white">"Is this faster than filling in a PDF?"</span>{" "}
            If it wasn't, we cut it.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="w-5 h-5 text-white/50" />
                <h3 className="font-bold text-base">Generic PDF form</h3>
              </div>
              <ul className="space-y-3 text-sm text-white/70">
                {[
                  "Open the PDF, retype your name, site and GC — again",
                  "Re-enter the same hazards from scratch every job",
                  "Download, fill, save, find the attachment, email",
                  "Can't search or filter — just a folder of PDFs",
                  "No record of which version you sent the GC",
                ].map((t) => (
                  <li key={t} className="flex items-start gap-2">
                    <X className="w-4 h-4 text-red-400 mt-0.5 shrink-0" /> {t}
                  </li>
                ))}
              </ul>
              <p className="mt-5 text-xs uppercase tracking-wider text-white/40 font-bold">~45 minutes per job</p>
            </div>
            <div className="bg-primary/10 border border-primary/40 rounded-xl p-6 shadow-[0_20px_60px_-30px_rgba(249,115,22,0.6)]">
              <div className="flex items-center gap-2 mb-4">
                <Zap className="w-5 h-5 text-primary" />
                <h3 className="font-bold text-base">With Formate</h3>
              </div>
              <ul className="space-y-3 text-sm text-white">
                {[
                  "Open the app — last job's details already filled",
                  "Change only the site address and GC name",
                  "Voice input when your hands are dirty",
                  "Tap once to email the GC a professional PDF",
                  "Every JHA stored, searchable, never lost",
                ].map((t) => (
                  <li key={t} className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" /> {t}
                  </li>
                ))}
              </ul>
              <p className="mt-5 text-xs uppercase tracking-wider text-primary font-bold flex items-center gap-1.5">
                <Clock className="w-3 h-3" /> Under 60 seconds
              </p>
            </div>
          </div>
        </section>

        {/* 4-step flow */}
        <section className="mx-auto w-full max-w-5xl px-5 sm:px-8 pb-16 sm:pb-24">
          <div className="rounded-2xl border border-white/10 bg-white/5 px-6 sm:px-10 py-10 sm:py-14">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary mb-6 text-center">How it works</p>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-6 text-left max-w-3xl mx-auto">
              {[
                { step: "1", label: "Open the app", desc: "Already signed in. Last job's details pre-filled for your trade." },
                { step: "2", label: "Update what's different", desc: "New site address, new GC name. Everything else stays." },
                { step: "3", label: "Sign", desc: "Digital signature captured right on your phone." },
                { step: "4", label: "Email the GC", desc: "One tap. They get an OSHA-aligned PDF instantly." },
              ].map(({ step, label, desc }) => (
                <div key={step} className="flex flex-col gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-black text-sm shrink-0">{step}</div>
                  <p className="font-bold text-sm text-white">{label}</p>
                  <p className="text-xs text-white/50 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="mx-auto w-full max-w-5xl px-5 sm:px-8 pb-16 sm:pb-24">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
            {[
              {
                icon: Zap,
                title: "Quick Job",
                body: "3 fields — site address, GC name, date. OSHA-aligned hazards and controls auto-filled for your trade.",
              },
              {
                icon: FileText,
                title: "Professional PDF",
                body: "Cover page, hazard register, task analysis, PPE list, emergency procedures, and signature blocks — all included.",
              },
              {
                icon: CheckCircle2,
                title: "OSHA-aligned",
                body: "29 CFR 1926 (construction) and 29 CFR 1910 (general industry). Trade presets cover silica, fall protection, LOTO, and more.",
              },
            ].map(({ icon: Icon, title, body }) => (
              <div key={title} className="bg-white/5 border border-white/10 rounded-xl p-5 sm:p-6 text-left hover:bg-white/[0.08] transition-colors">
                <Icon className="w-5 h-5 text-primary" />
                <h3 className="mt-4 font-bold text-base tracking-tight">{title}</h3>
                <p className="mt-1.5 text-sm text-white/55 leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Trades callout */}
        <section className="mx-auto w-full max-w-5xl px-5 sm:px-8 pb-16 sm:pb-24">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-6 sm:px-10 py-8 sm:py-10">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary mb-4 text-center">Built for your trade</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {[
                "Electricians", "Plumbers", "Painters", "Roofers",
                "Carpenters", "Concrete Grinders", "Stripers",
                "HVAC", "Drywall", "Demolition", "Landscaping", "General Contractors",
              ].map((t) => (
                <span
                  key={t}
                  className="text-xs font-semibold text-white/60 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="mx-auto w-full max-w-6xl px-5 sm:px-8 pb-20 sm:pb-28">
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-3">Simple pricing. No surprises.</h2>
            <p className="text-white/60 text-sm sm:text-base">30-day free trial. Cancel anytime. Prices in USD, per month.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
            {PLANS.map((p) => (
              <div
                key={p.name}
                className={`rounded-xl p-6 sm:p-7 border ${
                  p.featured
                    ? "bg-primary/10 border-primary/50 shadow-[0_20px_60px_-30px_rgba(249,115,22,0.6)]"
                    : "bg-white/5 border-white/10"
                }`}
              >
                {p.featured && (
                  <div className="inline-block bg-primary text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full mb-3">
                    Most popular
                  </div>
                )}
                <h3 className="font-black text-xl tracking-tight">{p.name}</h3>
                <p className="text-xs text-white/50 mt-0.5 mb-4">{p.tag}</p>
                <div className="flex items-baseline gap-1 mb-5">
                  <span className="text-4xl font-black tracking-tight">{p.price}</span>
                  <span className="text-sm text-white/50 font-semibold">/ month</span>
                </div>
                <ul className="space-y-2.5 text-sm text-white/80 mb-6">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
                <Link href="/sign-up">
                  <button
                    className={`w-full inline-flex items-center justify-center gap-1.5 font-bold px-5 py-3 rounded-md text-sm transition-colors ${
                      p.featured
                        ? "bg-primary hover:bg-primary/90 text-white"
                        : "bg-white/10 hover:bg-white/15 text-white border border-white/20"
                    }`}
                  >
                    Start free trial <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <section className="mx-auto w-full max-w-4xl px-5 sm:px-8 pb-20 sm:pb-28">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-8 py-12 sm:py-16 text-center">
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-3">
              Ready to stop rewriting the same JHA?
            </h2>
            <p className="text-white/60 mb-7 max-w-md mx-auto text-sm sm:text-base">
              Set up in under 5 minutes. Your first JHA is ready before the GC calls.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link href="/sign-up">
                <button className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white font-bold px-7 py-3.5 rounded-md">
                  <Zap className="w-4 h-4" /> Start 30-day free trial
                </button>
              </Link>
              <a href="mailto:hello@formate.us" className="inline-flex items-center gap-1.5 text-white/60 hover:text-white text-sm font-semibold px-3 py-3">
                <Mail className="w-4 h-4" /> Talk to a human
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10">
        <div className="mx-auto w-full max-w-6xl px-5 sm:px-8 py-5 text-xs text-white/30 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>© {new Date().getFullYear()} Formate · US Edition</span>
          <div className="flex gap-4">
            <Link href="/terms"><span className="hover:text-white/60 transition-colors cursor-pointer">Terms of Service</span></Link>
            <Link href="/privacy"><span className="hover:text-white/60 transition-colors cursor-pointer">Privacy Policy</span></Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
