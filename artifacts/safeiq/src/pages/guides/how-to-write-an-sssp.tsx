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
    q: "What's the hardest part of writing an SSSP?",
    a: "For most tradies it's the hazard register — listing every hazard and a sensible control. Our free template comes with common construction hazards pre-filled so you can start from a solid baseline and just adjust.",
  },
  {
    q: "Do I need to write a new SSSP for every job?",
    a: "Usually yes — the plan has to be specific to each site. The trick is not starting from scratch each time. A tool like Formate keeps your standard hazards and controls so you only change the site-specific bits.",
  },
  {
    q: "Who signs the SSSP?",
    a: "Both parties — typically PCBU 1 (the principal or main contractor) and PCBU 2 (your company). Signing confirms everyone has read the plan and agrees to follow the controls.",
  },
];

export default function HowToWriteAnSssp() {
  useSeo({
    title: "How to Write an SSSP — Step-by-Step Guide (NZ) | Formate",
    description:
      "How to write an SSSP in NZ, step by step. What to include in your Site-Specific Safety Plan — hazards, controls, emergency plan, sign-off — and how to do it in 60 seconds.",
    path: "/guides/how-to-write-an-sssp",
  });

  return (
    <MarketingLayout>
      <MarketingHero
        badge={<><BookOpen className="w-3 h-3" /> Guide</>}
        title="How to Write an SSSP"
        highlight="(step by step)"
        subtitle="A simple, no-jargon walkthrough for building a Site-Specific Safety Plan that a main contractor will accept — without spending your evening on paperwork."
      />

      <ProseSection>
        <p>
          Writing an SSSP doesn't need to be hard. Work through these steps and you'll have a plan that covers what a New Zealand
          main contractor expects. Grab our <Link href="/free-sssp-template">free SSSP template</Link> to follow along.
        </p>

        <h2>1. Fill in the project & site details</h2>
        <p>
          Project name, site address, start and end dates, and a short scope of work. Be specific — this is what makes the plan
          "site-specific" rather than a generic policy.
        </p>

        <h2>2. Record the PCBUs</h2>
        <p>
          List PCBU 1 (the principal or main contractor who controls the site) and PCBU 2 (your business). Include contact
          names, phone and email for both.
        </p>

        <h2>3. List your site personnel</h2>
        <p>
          Everyone who'll be on site, their role, and any inductions, tickets or licences they hold. This shows your crew is
          competent for the work.
        </p>

        <h2>4. Build the hazard & risk register</h2>
        <p>
          This is the heart of the SSSP. For each hazard, note the risk level and the controls you'll put in place. Common
          construction hazards include working at height, manual handling, power tools, plant movements, hazardous substances,
          noise and dust. Start from the pre-filled list in the template and add anything specific to your trade and this site.
        </p>

        <h2>5. Break the job into task steps</h2>
        <p>
          List the main steps of the work, the hazards at each step, and the controls. This is similar to a
          <Link href="/jsa-template"> JSA</Link> and shows you've thought the job through.
        </p>

        <h2>6. Set out emergency procedures</h2>
        <p>
          Assembly point, first aider on site, nearest hospital, and your evacuation and incident-reporting plan. Keep it
          practical — everyone on site should understand it.
        </p>

        <h2>7. Confirm PPE and sign off</h2>
        <p>
          Tick the PPE required on this site, then both PCBUs sign and date the declaration. Signing confirms everyone has read
          the plan and agrees to follow it.
        </p>

        <h2>The 60-second version</h2>
        <p>
          Steps 1–7 take 15–20 minutes with a generic PDF form, every single job. <strong>The real competition is a generic PDF form — Formate is just faster.</strong> Set your hazards, controls and PPE once; every new SSSP opens pre-filled so you only
          change the site, the PCBU and the dates, sign on your phone, and email the PDF on.
        </p>
        <h3>Keep reading</h3>
        <ul>
          <li><Link href="/guides/what-is-an-sssp">What is an SSSP?</Link></li>
          <li><Link href="/guides/sssp-requirements-nz">SSSP requirements in New Zealand</Link></li>
        </ul>
      </ProseSection>

      <FaqSection items={FAQ} />

      <FinalCta
        heading="Write your SSSP in 60 seconds"
        sub="Follow the template once, then let Formate do the re-typing for you. 30-day free trial, no card needed."
      />
    </MarketingLayout>
  );
}
