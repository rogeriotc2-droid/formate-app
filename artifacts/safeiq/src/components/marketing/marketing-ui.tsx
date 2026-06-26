import type { ReactNode } from "react";
import { Link } from "wouter";
import { ArrowRight, Zap } from "lucide-react";
import { useFaqJsonLd, type FaqItem } from "@/lib/use-seo";

// ─── Layout (nav + footer) ───────────────────────────────────────────────────

export function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0F172A] text-white flex flex-col">
      <nav className="border-b border-white/10 sticky top-0 z-40 bg-[#0F172A]/95 backdrop-blur">
        <div className="mx-auto w-full max-w-6xl px-5 sm:px-8 py-4 flex items-center justify-between">
          <Link href="/">
            <span className="flex items-center gap-2.5 cursor-pointer">
              <span className="w-2.5 h-2.5 rounded-full bg-primary" />
              <span className="text-lg sm:text-xl font-black tracking-tight">
                <span className="text-white">FOR</span><span className="text-primary">MATE</span>
              </span>
            </span>
          </Link>
          <div className="flex items-center gap-1 sm:gap-2">
            <a href="/#pricing" className="hidden sm:inline text-sm font-semibold text-white/70 hover:text-white px-3 py-2">Pricing</a>
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

      <main className="flex-1">{children}</main>

      <footer className="border-t border-white/10">
        <div className="mx-auto w-full max-w-6xl px-5 sm:px-8 py-10">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mb-8 text-sm">
            <div>
              <p className="font-bold text-white/80 mb-3">Free templates</p>
              <ul className="space-y-2 text-white/50">
                <li><Link href="/free-sssp-template"><span className="hover:text-white cursor-pointer">SSSP template</span></Link></li>
                <li><Link href="/swms-template"><span className="hover:text-white cursor-pointer">SWMS template</span></Link></li>
                <li><Link href="/jsa-template"><span className="hover:text-white cursor-pointer">JSA template</span></Link></li>
              </ul>
            </div>
            <div>
              <p className="font-bold text-white/80 mb-3">Guides</p>
              <ul className="space-y-2 text-white/50">
                <li><Link href="/guides/what-is-an-sssp"><span className="hover:text-white cursor-pointer">What is an SSSP?</span></Link></li>
                <li><Link href="/guides/how-to-write-an-sssp"><span className="hover:text-white cursor-pointer">How to write an SSSP</span></Link></li>
                <li><Link href="/guides/sssp-requirements-nz"><span className="hover:text-white cursor-pointer">SSSP requirements (NZ)</span></Link></li>
              </ul>
            </div>
            <div>
              <p className="font-bold text-white/80 mb-3">Product</p>
              <ul className="space-y-2 text-white/50">
                <li><a href="/#pricing" className="hover:text-white">Pricing</a></li>
                <li><Link href="/sign-in"><span className="hover:text-white cursor-pointer">Sign in</span></Link></li>
                <li><Link href="/sign-up"><span className="hover:text-white cursor-pointer">Start free trial</span></Link></li>
              </ul>
            </div>
            <div>
              <p className="font-bold text-white/80 mb-3">Company</p>
              <ul className="space-y-2 text-white/50">
                <li><a href="mailto:hello@formate.co.nz" className="hover:text-white">Contact us</a></li>
                <li><Link href="/terms"><span className="hover:text-white cursor-pointer">Terms of Service</span></Link></li>
                <li><Link href="/privacy"><span className="hover:text-white cursor-pointer">Privacy Policy</span></Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 pt-5 text-xs text-white/30">
            © {new Date().getFullYear()} Afterglow Digital Ltd · Formate · formate.co.nz
          </div>
        </div>
      </footer>
    </div>
  );
}

// ─── Hero ────────────────────────────────────────────────────────────────────

export function MarketingHero({
  badge,
  title,
  highlight,
  subtitle,
  children,
}: {
  badge: ReactNode;
  title: string;
  highlight?: string;
  subtitle: string;
  children?: ReactNode;
}) {
  return (
    <section className="mx-auto w-full max-w-4xl px-5 sm:px-8 pt-14 sm:pt-20 pb-10 sm:pb-14 text-center">
      <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/30 text-primary text-[11px] sm:text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full">
        {badge}
      </div>
      <h1 className="mt-6 sm:mt-8 mx-auto max-w-3xl text-4xl sm:text-6xl font-black tracking-[-0.03em] leading-[1.0]">
        {title} {highlight && <span className="text-primary">{highlight}</span>}
      </h1>
      <p className="mt-6 mx-auto max-w-xl text-base sm:text-lg text-white/60 leading-relaxed">{subtitle}</p>
      {children && <div className="mt-8">{children}</div>}
    </section>
  );
}

// ─── CTA row ─────────────────────────────────────────────────────────────────

export function CtaButtons({ secondary }: { secondary?: ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4">
      <Link href="/sign-up">
        <button className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white font-bold px-7 py-3.5 rounded-md text-base">
          <Zap className="w-4 h-4" /> Start 30-day free trial
        </button>
      </Link>
      {secondary}
    </div>
  );
}

// ─── Prose section ───────────────────────────────────────────────────────────

export function ProseSection({ children }: { children: ReactNode }) {
  return (
    <section className="mx-auto w-full max-w-3xl px-5 sm:px-8 pb-14">
      <div className="space-y-5 text-white/70 text-[15px] leading-relaxed [&_h2]:text-2xl [&_h2]:sm:text-3xl [&_h2]:font-black [&_h2]:tracking-tight [&_h2]:text-white [&_h2]:mt-10 [&_h2]:mb-1 [&_h3]:text-lg [&_h3]:font-bold [&_h3]:text-white [&_h3]:mt-6 [&_strong]:text-white [&_a]:text-primary [&_a]:font-semibold hover:[&_a]:underline [&_ul]:space-y-2 [&_ul]:list-none [&_li]:pl-5 [&_li]:relative [&_li]:before:content-['→'] [&_li]:before:absolute [&_li]:before:left-0 [&_li]:before:text-primary">
        {children}
      </div>
    </section>
  );
}

// ─── Feature list card ───────────────────────────────────────────────────────

export function IncludedList({ title, items }: { title: string; items: string[] }) {
  return (
    <section className="mx-auto w-full max-w-3xl px-5 sm:px-8 pb-14">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-7 sm:p-9">
        <h2 className="text-2xl sm:text-3xl font-black tracking-tight mb-5">{title}</h2>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5 text-sm text-white/80">
          {items.map((f) => (
            <li key={f} className="flex items-start gap-2">
              <ArrowRight className="w-4 h-4 text-primary mt-0.5 shrink-0" /> {f}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

// ─── FAQ (renders + injects JSON-LD) ─────────────────────────────────────────

export function FaqSection({ items }: { items: FaqItem[] }) {
  useFaqJsonLd(items);
  return (
    <section className="mx-auto w-full max-w-3xl px-5 sm:px-8 pb-14">
      <h2 className="text-2xl sm:text-3xl font-black tracking-tight mb-6">Frequently asked questions</h2>
      <div className="space-y-3">
        {items.map((item) => (
          <details key={item.q} className="group rounded-xl border border-white/10 bg-white/5 p-5">
            <summary className="cursor-pointer font-bold text-white list-none flex items-center justify-between gap-3">
              {item.q}
              <span className="text-primary transition-transform group-open:rotate-45 text-xl leading-none">+</span>
            </summary>
            <p className="mt-3 text-sm text-white/65 leading-relaxed">{item.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

// ─── Final CTA band ──────────────────────────────────────────────────────────

export function FinalCta({ heading, sub }: { heading: string; sub: string }) {
  return (
    <section className="mx-auto w-full max-w-4xl px-5 sm:px-8 pb-20 sm:pb-28">
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-8 py-12 sm:py-14 text-center">
        <h2 className="text-2xl sm:text-3xl font-black tracking-tight mb-3">{heading}</h2>
        <p className="text-white/60 mb-7 max-w-md mx-auto text-sm sm:text-base">{sub}</p>
        <CtaButtons />
        <p className="mt-5 text-xs text-white/40">No credit card. Cancel anytime. Built in NZ for NZ &amp; AU tradies.</p>
      </div>
    </section>
  );
}
