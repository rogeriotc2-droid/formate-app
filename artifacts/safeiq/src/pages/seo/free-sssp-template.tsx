import { Link } from "wouter";
import { Shield, Download } from "lucide-react";
import { useSeo } from "@/lib/use-seo";
import { LeadMagnetForm } from "@/components/marketing/lead-magnet-form";
import {
  MarketingLayout,
  MarketingHero,
  CtaButtons,
  IncludedList,
  ProseSection,
  FaqSection,
  FinalCta,
} from "@/components/marketing/marketing-ui";

const FAQ = [
  {
    q: "Is the SSSP template really free?",
    a: "Yes. Download the template, print it, and fill it in by hand — no payment and no credit card. If you'd rather not re-write it every job, Formate fills the same plan online in about 60 seconds with a 30-day free trial.",
  },
  {
    q: "Is this SSSP template suitable for New Zealand?",
    a: "Yes. It's built around WorkSafe NZ guidance for site-specific safety plans and uses the PCBU 1 / PCBU 2 structure NZ contractors are asked for. Always check it against the specific requirements of your site and main contractor.",
  },
  {
    q: "What's the difference between an SSSP and a SWMS?",
    a: "An SSSP (Site-Specific Safety Plan) covers safety for a whole site or job in New Zealand. A SWMS (Safe Work Method Statement) is focused on a specific high-risk activity and is the common term in Australia. Many contractors use both.",
  },
  {
    q: "Can I edit the template to suit my trade?",
    a: "Absolutely. The PDF is a starting point with common construction hazards pre-listed. Cross out what doesn't apply and add anything specific to your trade. In Formate you save your trade's hazards once and they auto-fill every time.",
  },
];

export default function FreeSsspTemplate() {
  useSeo({
    title: "Free SSSP Template NZ — Download or Fill in 60 Seconds | Formate",
    description:
      "Download a free NZ SSSP template built to WorkSafe guidance — or fill a site-specific safety plan online in 60 seconds. Hazard register, task analysis & sign-off included.",
    path: "/free-sssp-template",
  });

  return (
    <MarketingLayout>
      <MarketingHero
        badge={<><Shield className="w-3 h-3" /> Free download · WorkSafe NZ</>}
        title="Free SSSP Template"
        highlight="(NZ)"
        subtitle="A ready-to-fill Site-Specific Safety Plan built to WorkSafe NZ guidance — hazard register, task steps, emergency plan and PCBU sign-off. Print it, or skip the re-typing and fill it online in 60 seconds."
      >
        <CtaButtons
          secondary={
            <a
              href="/sssp-template.html"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 border border-white/20 hover:border-white/40 text-white font-semibold px-5 py-3.5 rounded-md text-base"
            >
              <Download className="w-4 h-4" /> Open the template
            </a>
          }
        />
      </MarketingHero>

      <IncludedList
        title="What's in the SSSP template"
        items={[
          "Project & site details",
          "PCBU 1 & PCBU 2 contacts",
          "Site personnel & inductions",
          "Hazard & risk register (pre-filled)",
          "Task steps & controls",
          "Emergency procedures",
          "PPE checklist",
          "Sign-off declaration",
        ]}
      />

      <section className="mx-auto w-full max-w-3xl px-5 sm:px-8 pb-14">
        <div className="rounded-2xl border border-primary/40 bg-gradient-to-br from-primary/15 to-primary/5 p-8 sm:p-10">
          <div className="text-center mb-7">
            <div className="inline-flex items-center gap-2 bg-primary text-white text-[11px] font-black uppercase tracking-wider px-3 py-1.5 rounded-full mb-4">
              <Download className="w-3 h-3" /> Free download
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight mb-3">Get the free SSSP template</h2>
            <p className="text-white/70 text-sm sm:text-base max-w-md mx-auto">
              Pop your email in and we'll send the template, ready to print or save as PDF today.
            </p>
          </div>
          <LeadMagnetForm source="free-sssp-template-page" />
        </div>
      </section>

      <ProseSection>
        <h2>Generic PDF form, or done in 60 seconds?</h2>
        <p>
          The template above is genuinely free — but if you fill out an SSSP for every new site, you already know the pain:
          opening the PDF, retyping your name, site and PCBU 1 from scratch, re-entering the same hazards as last week, then
          hunting for the right attachment to email. <strong>The real competition is a generic PDF form — Formate is just faster.</strong>
        </p>
        <p>
          With Formate you set your trade's hazards and controls once. Every new job opens with last time's details already
          filled in, so you only change what's different today — new site, new PCBU 1 — then sign on your phone and email the
          PDF straight to the client.
        </p>
        <h3>Related free templates</h3>
        <ul>
          <li><Link href="/swms-template">Free SWMS template (NZ &amp; AU)</Link></li>
          <li><Link href="/jsa-template">Free JSA template (Job Safety Analysis)</Link></li>
          <li><Link href="/guides/what-is-an-sssp">What is an SSSP? A plain-English guide</Link></li>
          <li><Link href="/guides/how-to-write-an-sssp">How to write an SSSP, step by step</Link></li>
        </ul>
      </ProseSection>

      <FaqSection items={FAQ} />

      <FinalCta
        heading="Stop re-typing your SSSP"
        sub="Your first site-specific safety plan is ready before the kettle's boiled. 30-day free trial, no card needed."
      />
    </MarketingLayout>
  );
}
