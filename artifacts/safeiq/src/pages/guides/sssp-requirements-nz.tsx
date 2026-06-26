import { Link } from "wouter";
import { BookOpen } from "lucide-react";
import { useSeo } from "@/lib/use-seo";
import {
  MarketingLayout,
  MarketingHero,
  ProseSection,
  FaqSection,
  FinalCta,
} from "@/components/marketing/marketing-ui";

const FAQ = [
  {
    q: "Is an SSSP legally required in New Zealand?",
    a: "The Health and Safety at Work Act 2015 requires every PCBU to manage risks so far as is reasonably practicable and to consult and coordinate with other PCBUs. It doesn't use the word 'SSSP', but a site-specific safety plan is the standard, widely-required way contractors demonstrate they're meeting those duties.",
  },
  {
    q: "What does WorkSafe NZ expect in a safety plan?",
    a: "WorkSafe expects you to identify the hazards for the actual work and site, put reasonable controls in place, make sure workers are competent and informed, and have emergency arrangements ready. An SSSP captures all of this in one document.",
  },
  {
    q: "Who is responsible for the SSSP on a shared site?",
    a: "Each PCBU has duties, and they must consult, cooperate and coordinate. In practice the principal (PCBU 1) sets site-wide requirements and each contractor (PCBU 2) provides an SSSP for their own work that fits within them.",
  },
];

export default function SsspRequirementsNz() {
  useSeo({
    title: "SSSP Requirements NZ — What WorkSafe Expects | Formate",
    description:
      "SSSP requirements in New Zealand explained. What a Site-Specific Safety Plan must include under WorkSafe NZ guidance, who needs one, and PCBU sign-off responsibilities.",
    path: "/guides/sssp-requirements-nz",
  });

  return (
    <MarketingLayout>
      <MarketingHero
        badge={<><BookOpen className="w-3 h-3" /> Guide</>}
        title="SSSP Requirements"
        highlight="(New Zealand)"
        subtitle="What a Site-Specific Safety Plan needs to cover under the Health and Safety at Work Act and WorkSafe NZ guidance — in plain English."
      />

      <ProseSection>
        <p>
          There's no single law that says "you must produce an SSSP." Instead, the
          <strong> Health and Safety at Work Act 2015 (HSWA)</strong> sets duties, and an SSSP is the practical document
          contractors use to show they're meeting them. Here's what that means on the ground.
        </p>

        <h2>The duties behind the document</h2>
        <p>Under HSWA, every PCBU must, so far as is reasonably practicable:</p>
        <ul>
          <li>Identify hazards and manage the risks of the work</li>
          <li>Provide a safe work environment, plant and systems of work</li>
          <li>Make sure workers are competent, informed and supervised</li>
          <li>Have emergency plans and first-aid arrangements</li>
          <li>Consult, cooperate and coordinate with other PCBUs sharing the site</li>
        </ul>
        <p>An SSSP is simply the place you write all of this down for a specific job.</p>

        <h2>What a compliant SSSP should include</h2>
        <ul>
          <li>Project and site details specific to the job</li>
          <li>PCBU 1 and PCBU 2 details and responsibilities</li>
          <li>A hazard and risk register with practical controls</li>
          <li>Competency records — inductions, tickets, licences</li>
          <li>Task steps and the controls for each</li>
          <li>Emergency procedures and assembly points</li>
          <li>PPE requirements</li>
          <li>Sign-off from both parties</li>
        </ul>
        <p>
          Our <Link href="/free-sssp-template">free SSSP template</Link> is laid out in exactly this order so nothing gets
          missed.
        </p>

        <h2>Who needs one, and when</h2>
        <p>
          If you're a contractor or subcontractor going onto someone else's construction site, expect to be asked for an SSSP
          before you start. Because it must be site-specific, you'll generally need a fresh one for each job — though the bulk
          of it (your standard hazards and controls) stays the same.
        </p>

        <h2>Keeping it reasonable</h2>
        <p>
          "Reasonably practicable" is the key phrase. Your plan should match the real risk of the work — a small maintenance job
          doesn't need the same depth as major construction. Keep it honest, specific and usable on site.
        </p>
        <p className="text-xs text-white/40">
          This guide is general information, not legal advice. Always check the current requirements on the
          {" "}<a href="https://www.worksafe.govt.nz" target="_blank" rel="noopener noreferrer">WorkSafe NZ website</a> and with
          your main contractor.
        </p>

        <h2>The faster way to stay compliant</h2>
        <p>
          The requirements don't change job to job — so why retype them into a PDF form every time? <strong>The real competition is a generic PDF form — Formate is just faster.</strong> Build your compliant SSSP once and reuse it in 60 seconds per job.
        </p>
        <h3>Keep reading</h3>
        <ul>
          <li><Link href="/guides/what-is-an-sssp">What is an SSSP?</Link></li>
          <li><Link href="/guides/how-to-write-an-sssp">How to write an SSSP, step by step</Link></li>
        </ul>
      </ProseSection>

      <FaqSection items={FAQ} />

      <FinalCta
        heading="Stay compliant in 60 seconds a job"
        sub="Build a WorkSafe-ready SSSP once, reuse it forever. 30-day free trial, no card needed."
      />
    </MarketingLayout>
  );
}
