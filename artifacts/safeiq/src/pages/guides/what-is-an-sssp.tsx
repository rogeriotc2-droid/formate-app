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
    q: "Who needs an SSSP?",
    a: "Contractors and subcontractors working on a construction site in New Zealand are usually asked for an SSSP by the main contractor or principal (PCBU 1) before they can start on site.",
  },
  {
    q: "Is an SSSP a legal requirement in NZ?",
    a: "The Health and Safety at Work Act 2015 requires PCBUs to manage risks and consult, but it doesn't name the document 'SSSP'. In practice, an SSSP is the standard way contractors show how they'll manage site safety, and most main contractors require one.",
  },
  {
    q: "How long does an SSSP take to make?",
    a: "On paper, 15–20 minutes per job once you've gathered everything. With a tool like Formate that remembers your details, a site-specific safety plan takes around 60 seconds.",
  },
];

export default function WhatIsAnSssp() {
  useSeo({
    title: "What is an SSSP? Site-Specific Safety Plan Explained (NZ) | Formate",
    description:
      "What is an SSSP (Site-Specific Safety Plan)? A plain-English guide for NZ tradies — what it covers, when you need one, who signs it, and how to make one fast.",
    path: "/guides/what-is-an-sssp",
  });

  return (
    <MarketingLayout>
      <MarketingHero
        badge={<><BookOpen className="w-3 h-3" /> Guide</>}
        title="What is an SSSP?"
        subtitle="A plain-English guide to the Site-Specific Safety Plan — what it is, what's in it, and why every NZ contractor gets asked for one."
      />

      <ProseSection>
        <p>
          <strong>An SSSP is a Site-Specific Safety Plan.</strong> It's a document that sets out how safety will be managed for
          a particular job or site — the hazards present, the controls you'll use, who's responsible, and what happens in an
          emergency. In New Zealand it's the standard way a contractor shows a main contractor or client that they'll work
          safely on site.
        </p>

        <h2>Why "site-specific"?</h2>
        <p>
          The "site-specific" part matters. A generic safety policy isn't enough — the plan has to reflect the actual site:
          its access, its hazards, the trades on it, and the emergency arrangements for that location. That's why a fresh SSSP
          is usually expected for each new job.
        </p>

        <h2>What goes in an SSSP?</h2>
        <p>A typical New Zealand SSSP includes:</p>
        <ul>
          <li>Project and site details</li>
          <li>PCBU 1 (principal/main contractor) and PCBU 2 (your company) contacts</li>
          <li>Site personnel, inductions and tickets</li>
          <li>A hazard and risk register with controls</li>
          <li>Task steps and the controls for each</li>
          <li>Emergency procedures and assembly points</li>
          <li>Required PPE</li>
          <li>A sign-off declaration from both parties</li>
        </ul>
        <p>
          You can see exactly how this looks in our <Link href="/free-sssp-template">free SSSP template</Link> — download it,
          print it, and fill it in by hand.
        </p>

        <h2>Who is PCBU 1 and PCBU 2?</h2>
        <p>
          PCBU stands for "Person Conducting a Business or Undertaking." On most sites, <strong>PCBU 1</strong> is the principal
          or main contractor who controls the site, and <strong>PCBU 2</strong> is your business coming on to do the work. The
          SSSP is the agreement between you about how safety will be handled.
        </p>

        <h2>SSSP vs SWMS vs JSA</h2>
        <p>
          These get mixed up a lot. An <strong>SSSP</strong> covers the whole site. A <Link href="/swms-template">SWMS</Link> is
          focused on one high-risk activity (and is the common term in Australia). A <Link href="/jsa-template">JSA</Link> is a
          quick task-level analysis. Many contractors use an SSSP for the site and a SWMS or JSA for specific tasks.
        </p>

        <h2>The faster way</h2>
        <p>
          Re-filling the same SSSP PDF for every job is the part everyone hates. <strong>The real competition is a generic PDF form — Formate is just faster.</strong> Set your hazards and controls once, and every new plan opens pre-filled so
          you only change what's different today, sign on your phone, and email the PDF to the PCBU.
        </p>
        <h3>Keep reading</h3>
        <ul>
          <li><Link href="/guides/how-to-write-an-sssp">How to write an SSSP, step by step</Link></li>
          <li><Link href="/guides/sssp-requirements-nz">SSSP requirements in New Zealand</Link></li>
        </ul>
      </ProseSection>

      <FaqSection items={FAQ} />

      <FinalCta
        heading="Make your SSSP in 60 seconds"
        sub="Skip the re-typing. Your first site-specific safety plan is ready before the kettle's boiled."
      />
    </MarketingLayout>
  );
}
