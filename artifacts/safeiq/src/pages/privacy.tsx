import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPage() {
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
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-2">Privacy Policy</h1>
        <p className="text-white/40 text-sm mb-10">Last updated: 1 June {year}</p>

        <div className="prose prose-invert prose-sm max-w-none space-y-8 text-white/80 leading-relaxed">

          <section>
            <h2 className="text-lg font-bold text-white mb-3">1. Who We Are</h2>
            <p>Formate is operated by Afterglow Digital Ltd, a New Zealand company. This Privacy Policy explains how we collect, use, and protect your personal information in compliance with the New Zealand Privacy Act 2020.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">2. Information We Collect</h2>
            <p><strong className="text-white">Account information:</strong> Name, email address, and company details you provide when signing up.</p>
            <p className="mt-3"><strong className="text-white">Safety documents:</strong> The content of SSSPs, SWMS, JSAs, and form submissions you create, including site addresses, worker names, and job details.</p>
            <p className="mt-3"><strong className="text-white">Billing information:</strong> Payment details are handled directly by Stripe — we never see or store your card number.</p>
            <p className="mt-3"><strong className="text-white">Usage data:</strong> How you interact with the app (pages visited, features used) to help us improve the service.</p>
            <p className="mt-3"><strong className="text-white">Device information:</strong> Browser type, operating system, and IP address for security and analytics purposes.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">3. How We Use Your Information</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>To provide and operate the Formate service</li>
              <li>To send safety document notifications to recipients you specify</li>
              <li>To process your subscription payments via Stripe</li>
              <li>To send service-related emails (account updates, billing receipts)</li>
              <li>To improve the platform based on how it is used</li>
              <li>To comply with legal obligations</li>
            </ul>
            <p className="mt-3">We do not sell your personal information to third parties. We do not use your safety document content for advertising.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">4. Who We Share Information With</h2>
            <p>We share your information only with trusted service providers who help us operate Formate:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li><strong className="text-white">Stripe</strong> — payment processing</li>
              <li><strong className="text-white">Resend</strong> — transactional email delivery</li>
              <li><strong className="text-white">Xero</strong> — if you choose to connect your Xero account</li>
            </ul>
            <p className="mt-3">Each provider has their own privacy policy and is bound by contractual obligations to protect your data.</p>
            <p className="mt-3">We may also disclose information if required by law, court order, or to protect the rights and safety of our users.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">5. Data Storage and Security</h2>
            <p>Your data is stored on secure cloud infrastructure. We use industry-standard encryption in transit (HTTPS) and at rest.</p>
            <p className="mt-3">Our servers are located in the United States (Replit cloud infrastructure). By using Formate, you consent to your data being stored outside New Zealand. We ensure appropriate safeguards are in place in accordance with the Privacy Act 2020.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">6. Your Rights</h2>
            <p>Under the NZ Privacy Act 2020, you have the right to:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Access the personal information we hold about you</li>
              <li>Request correction of inaccurate information</li>
              <li>Request deletion of your account and data</li>
              <li>Ask us to stop using your information in certain ways</li>
            </ul>
            <p className="mt-3">To exercise these rights, email us at <a href="mailto:hello@formate.co.nz" className="text-[#f97316] hover:underline">hello@formate.co.nz</a>. We will respond within 20 working days.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">7. Cookies</h2>
            <p>We use essential cookies to keep you logged in and remember your session. We do not use advertising or tracking cookies. You can disable cookies in your browser settings, but this will prevent you from logging in.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">8. Data Retention</h2>
            <p>We retain your data for as long as your account is active. If you cancel, we keep your data for 90 days before permanent deletion, giving you time to export anything you need. Billing records are retained for 7 years as required by NZ tax law.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">9. Children</h2>
            <p>Formate is not intended for use by anyone under 18. We do not knowingly collect personal information from children.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">10. Changes to This Policy</h2>
            <p>We may update this policy from time to time. We will notify you by email of any significant changes. Continued use of Formate after that date means you accept the updated policy.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">11. Contact and Complaints</h2>
            <p>For privacy questions or complaints, contact us at <a href="mailto:hello@formate.co.nz" className="text-[#f97316] hover:underline">hello@formate.co.nz</a></p>
            <p className="mt-3">If you are not satisfied with our response, you may contact the Office of the Privacy Commissioner at <a href="https://www.privacy.org.nz" target="_blank" rel="noopener noreferrer" className="text-[#f97316] hover:underline">privacy.org.nz</a></p>
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
