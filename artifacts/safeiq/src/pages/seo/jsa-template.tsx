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
    q: "Is the JSA template free?",
    a: "Yes. Download it, print it, and fill it in by hand at no cost. Formate can also build the same Job Safety Analysis online in about 60 seconds if you'd rather not re-write it every job.",
  },
  {
    q: "What is a JSA?",
    a: "A JSA (Job Safety Analysis), sometimes called a JSEA, breaks a job into steps, lists what can go wrong at each step, and records how you'll control each hazard. It's a quick, practical safety tool used before starting a task.",
  },
  {
    q: "JSA vs SWMS vs SSSP — which do I need?",
    a: "A JSA is a lightweight task-level analysis for everyday jobs. A SWMS is the formal document for high-risk construction work (common in AU). An SSSP is a whole-of-site safety plan used in NZ. Many crews use a JSA daily plus an SSSP or SWMS where required.",
  },
  {
    q: "Does the JSA template work in NZ and Australia?",
    a: "Yes. The step / hazard / control format is standard across both New Zealand and Australia, and the template includes PPE and emergency fields and a worker sign-off register.",
  },
];

export default function JsaTemplate() {
  useSeo({
    title: "JSA Template — Free Job Safety Analysis (NZ & AU) | Formate",
    description:
      "Free JSA template (Job Safety Analysis / JSEA). Break a job into steps, list hazards and controls, and sign off in 60 seconds. Built for NZ & AU tradies — faster than paper.",
    path: "/jsa-template",
  });

  return (
    <MarketingLayout>
      <MarketingHero
        badge={<><Shield className="w-3 h-3" /> Free download · NZ &amp; AU</>}
        title="Free JSA Template"
        highlight="(Job Safety Analysis)"
        subtitle="A ready-to-fill Job Safety Analysis — break the job into steps, list what can go wrong, and write the controls. Print it, or fill it online in 60 seconds and sign on your phone."
      >
        <CtaButtons
          secondary={
            <a
              href="/jsa-template.html"
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
        title="What's in the JSA template"
        items={[
          "Job & site details",
          "Step-by-step breakdown",
          "Hazards for each step",
          "Control measures",
          "PPE checklist",
          "Emergency information",
          "Worker sign-off register",
          "Print & save as PDF",
        ]}
      />

      <section className="mx-auto w-full max-w-3xl px-5 sm:px-8 pb-14">
        <div className="rounded-2xl border border-primary/40 bg-gradient-to-br from-primary/15 to-primary/5 p-8 sm:p-10">
          <div className="text-center mb-7">
            <div className="inline-flex items-center gap-2 bg-primary text-white text-[11px] font-black uppercase tracking-wider px-3 py-1.5 rounded-full mb-4">
              <Download className="w-3 h-3" /> Free download
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight mb-3">Get the free JSA template</h2>
            <p className="text-white/70 text-sm sm:text-base max-w-md mx-auto">
              Pop your email in and we'll send the template, ready to print or save as PDF today.
            </p>
          </div>
          <LeadMagnetForm
            source="jsa-template-page"
            templateHref="/jsa-template.html"
            buttonLabel="Email me the free JSA template"
            successText="Your free JSA template is ready to print or save as PDF."
          />
        </div>
      </section>

      <ProseSection>
        <h2>Generic PDF form, or done in 60 seconds?</h2>
        <p>
          The template above is free — but filling out a JSA PDF before every job adds up fast.
          <strong> The real competition is a generic PDF form — Formate is just faster.</strong>
        </p>
        <p>
          With Formate you save your common job steps and controls once. Each new analysis opens pre-filled, so you only adjust
          what's different today, your crew signs on the phone, and it's stored and searchable — never lost on a clipboard.
        </p>
        <h3>Related free templates</h3>
        <ul>
          <li><Link href="/free-sssp-template">Free SSSP template (NZ)</Link></li>
          <li><Link href="/swms-template">Free SWMS template (NZ &amp; AU)</Link></li>
          <li><Link href="/guides/what-is-an-sssp">What is an SSSP? A plain-English guide</Link></li>
        </ul>
      </ProseSection>

      <FaqSection items={FAQ} />

      <FinalCta
        heading="Stop re-writing your JSA"
        sub="Save your job steps once, reuse them forever. 30-day free trial, no card needed."
      />
    </MarketingLayout>
  );
}
