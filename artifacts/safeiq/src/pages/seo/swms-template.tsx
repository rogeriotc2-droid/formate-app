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
    q: "Is the SWMS template free?",
    a: "Yes. Download it, print it, and fill it in by hand — no cost, no credit card. Formate can also build the same Safe Work Method Statement online in about 60 seconds if you'd rather not re-type it each job.",
  },
  {
    q: "Does this SWMS work for both New Zealand and Australia?",
    a: "Yes. The template follows the WHS Act 2011 structure used across Australia for high-risk construction work, and works equally well alongside an SSSP on New Zealand sites under WorkSafe NZ.",
  },
  {
    q: "When do I need a SWMS?",
    a: "A SWMS is required for high-risk construction work — for example work at height above 2m, trenching, demolition, asbestos, confined spaces, work near live electrical or traffic. The template includes a checklist of high-risk activities to tick.",
  },
  {
    q: "What's the difference between a SWMS and a JSA?",
    a: "Both break a job into steps with hazards and controls. A SWMS is the formal document required for high-risk construction work (especially in AU). A JSA (Job Safety Analysis) is a lighter task-level tool used for everyday jobs. Many crews use a JSA daily and a SWMS for high-risk tasks.",
  },
];

export default function SwmsTemplate() {
  useSeo({
    title: "SWMS Template (NZ & AU) — Free Safe Work Method Statement | Formate",
    description:
      "Free SWMS template for NZ & Australian worksites. Build a Safe Work Method Statement in 60 seconds — high-risk job steps, hazards, controls and worker sign-off. Faster than paper.",
    path: "/swms-template",
  });

  return (
    <MarketingLayout>
      <MarketingHero
        badge={<><Shield className="w-3 h-3" /> Free download · WHS Act AU · WorkSafe NZ</>}
        title="Free SWMS Template"
        highlight="(NZ & AU)"
        subtitle="A ready-to-fill Safe Work Method Statement for high-risk construction work — job steps, hazards, control measures and worker sign-off. Print it, or build it online in 60 seconds."
      >
        <CtaButtons
          secondary={
            <a
              href="/swms-template.html"
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
        title="What's in the SWMS template"
        items={[
          "Project & high-risk work details",
          "Responsible persons & supervisor",
          "High-risk activity checklist",
          "Job steps, hazards & controls",
          "Plant, equipment & permits",
          "PPE checklist",
          "Emergency procedures",
          "Worker sign-off register",
        ]}
      />

      <section className="mx-auto w-full max-w-3xl px-5 sm:px-8 pb-14">
        <div className="rounded-2xl border border-primary/40 bg-gradient-to-br from-primary/15 to-primary/5 p-8 sm:p-10">
          <div className="text-center mb-7">
            <div className="inline-flex items-center gap-2 bg-primary text-white text-[11px] font-black uppercase tracking-wider px-3 py-1.5 rounded-full mb-4">
              <Download className="w-3 h-3" /> Free download
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight mb-3">Get the free SWMS template</h2>
            <p className="text-white/70 text-sm sm:text-base max-w-md mx-auto">
              Pop your email in and we'll send the template, ready to print or save as PDF today.
            </p>
          </div>
          <LeadMagnetForm
            source="swms-template-page"
            templateHref="/swms-template.html"
            buttonLabel="Email me the free SWMS template"
            successText="Your free SWMS template is ready to print or save as PDF."
          />
        </div>
      </section>

      <ProseSection>
        <h2>Generic PDF form, or done in 60 seconds?</h2>
        <p>
          The template above is free — but a SWMS for every high-risk job means opening the same PDF, retyping the same
          steps, hazards and controls again and again. <strong>The real competition is a generic PDF form — Formate is just faster.</strong>
        </p>
        <p>
          With Formate you set your method statement once. Every new job opens with last time's steps already filled in, so you
          only change what's different today, get your crew to sign on the phone, and email the PDF on. Nothing lost, nothing
          smudged, no scanning runs.
        </p>
        <h3>Related free templates</h3>
        <ul>
          <li><Link href="/free-sssp-template">Free SSSP template (NZ)</Link></li>
          <li><Link href="/jsa-template">Free JSA template (Job Safety Analysis)</Link></li>
          <li><Link href="/guides/what-is-an-sssp">What is an SSSP? A plain-English guide</Link></li>
        </ul>
      </ProseSection>

      <FaqSection items={FAQ} />

      <FinalCta
        heading="Stop re-typing your SWMS"
        sub="Set your method statement once, reuse it forever. 30-day free trial, no card needed."
      />
    </MarketingLayout>
  );
}
