import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";

export default function TermsPage() {
  const year = new Date().getFullYear();
  return (
    <div className="min-h-screen bg-[#0F172A] text-white">
      <nav className="border-b border-white/10">
        <div className="mx-auto max-w-3xl px-5 sm:px-8 py-4 flex items-center gap-3">
          <Link href="/">
            <button className="flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
          </Link>
          <span className="text-white/20">·</span>
          <span className="text-sm font-black"><span className="text-white">FOR</span><span className="text-[#f97316]">MATE</span></span>
        </div>
      </nav>

      <main className="mx-auto max-w-3xl px-5 sm:px-8 py-12 sm:py-16">
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-2">Terms of Service</h1>
        <p className="text-white/40 text-sm mb-10">Last updated: 1 June {year}</p>

        <div className="prose prose-invert prose-sm max-w-none space-y-8 text-white/80 leading-relaxed">

          <section>
            <h2 className="text-lg font-bold text-white mb-3">1. About Formate</h2>
            <p>Formate is a software-as-a-service (SaaS) platform operated by Afterglow Digital Ltd ("we", "us", "our") that helps NZ and Australian subcontractors create and manage safety compliance documentation including Site-Specific Safety Plans (SSSPs), Safe Work Method Statements (SWMS), and Job Safety Analyses (JSAs).</p>
            <p className="mt-3">By creating an account or using Formate, you agree to these Terms of Service. If you do not agree, do not use the service.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">2. Your Account</h2>
            <p>You must provide accurate information when creating your account. You are responsible for keeping your login credentials secure and for all activity that occurs under your account.</p>
            <p className="mt-3">You must be at least 18 years old and authorised to enter into contracts on behalf of any business you register.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">3. Subscription and Payment</h2>
            <p>Formate is offered on a subscription basis. Pricing is shown on the Billing page. Subscriptions are billed monthly or annually in advance.</p>
            <p className="mt-3">A 30-day free trial is available for new accounts. No credit card is required during the trial. After the trial ends, continued access requires a paid subscription.</p>
            <p className="mt-3">All prices are in NZD unless otherwise stated. GST (15%) applies for NZ customers. Australian customers may be subject to GST under Australian law.</p>
            <p className="mt-3">Refunds are handled at our discretion. If you believe you have been charged in error, contact us within 30 days.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">4. Your Data and Documents</h2>
            <p>You retain ownership of all data, documents, and safety plans you create using Formate. We do not claim any rights over your content.</p>
            <p className="mt-3">You grant us a limited licence to store and process your content solely to provide the service to you.</p>
            <p className="mt-3">You are responsible for ensuring your safety documents comply with all applicable laws and regulations, including NZ WorkSafe requirements and Australian WHS Act obligations. Formate provides tools to assist compliance but does not guarantee that any document created meets every legal requirement for your specific situation.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">5. Acceptable Use</h2>
            <p>You agree not to use Formate to:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Create false or fraudulent safety documentation</li>
              <li>Violate any applicable law or regulation</li>
              <li>Attempt to access another user's account or data</li>
              <li>Reverse engineer, copy, or reproduce any part of the platform</li>
              <li>Use the service in any way that could harm other users or the platform</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">6. Limitation of Liability</h2>
            <p>To the maximum extent permitted by law, Formate and Afterglow Digital Ltd are not liable for any indirect, incidental, or consequential damages arising from your use of the service, including any reliance on safety documents generated through the platform.</p>
            <p className="mt-3">Our total liability to you for any claim shall not exceed the amount you paid to us in the 3 months preceding the claim.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">7. Service Availability</h2>
            <p>We aim to provide a reliable service but do not guarantee 100% uptime. We may perform maintenance, updates, or suspend the service for operational reasons. We will give reasonable notice of planned downtime where possible.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">8. Termination</h2>
            <p>You may cancel your subscription at any time from the Billing page. Access continues until the end of your paid period. We may suspend or terminate your account if you breach these terms.</p>
            <p className="mt-3">On cancellation, you may export your data. We will retain your data for 90 days after cancellation before permanent deletion.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">9. Changes to These Terms</h2>
            <p>We may update these terms from time to time. We will notify you by email at least 14 days before significant changes take effect. Continued use after that date constitutes acceptance.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">10. Governing Law</h2>
            <p>These terms are governed by the laws of New Zealand. Any disputes shall be subject to the exclusive jurisdiction of the New Zealand courts.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">11. Contact</h2>
            <p>Questions about these terms? Email us at <a href="mailto:hello@formate.co.nz" className="text-[#f97316] hover:underline">hello@formate.co.nz</a></p>
          </section>

        </div>
      </main>

      <footer className="border-t border-white/10 mt-16">
        <div className="mx-auto max-w-3xl px-5 sm:px-8 py-5 text-xs text-white/30 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>© {year} Afterglow Digital Ltd · Formate</span>
          <div className="flex gap-4">
            <Link href="/terms"><span className="hover:text-white/60 cursor-pointer">Terms</span></Link>
            <Link href="/privacy"><span className="hover:text-white/60 cursor-pointer">Privacy</span></Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
