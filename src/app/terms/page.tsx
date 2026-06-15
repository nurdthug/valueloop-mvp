import Link from 'next/link'
import VLLogo from '@/components/VLLogo'

export const metadata = {
  title: 'Terms of Service â ValueLoop',
  description: 'The rules and conditions for using ValueLoop.',
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/"><VLLogo size={28} /></Link>
          <Link href="/login" className="text-sm text-teal-600 font-semibold">Sign in</Link>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-10 pb-20">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Terms of Service</h1>
          <p className="text-sm text-gray-400 mb-8">Effective date: June 15, 2025 Â· Last updated: June 15, 2025</p>

          <div className="prose prose-sm max-w-none text-gray-600 space-y-6">

            <section>
              <h2 className="text-base font-bold text-gray-900 mb-2">1. Acceptance of Terms</h2>
              <p>By creating an account or using ValueLoop ("the Platform"), you agree to these Terms of Service ("Terms") and our <Link href="/privacy" className="text-teal-600">Privacy Policy</Link>. If you do not agree, do not use the Platform. These Terms form a binding agreement between you and <strong>Zean LLC</strong>.</p>
            </section>

            <section>
              <h2 className="text-base font-bold text-gray-900 mb-2">2. Eligibility</h2>
              <p>You must be at least 18 years old to use ValueLoop. By using the Platform, you represent that you are 18 or older and legally capable of entering into a binding contract. Accounts for anyone under 18 will be terminated.</p>
            </section>

            <section>
              <h2 className="text-base font-bold text-gray-900 mb-2">3. The Service</h2>
              <p>ValueLoop is a peer-to-peer exchange platform. We provide tools for users to post what they need and what they offer, receive AI-assisted match suggestions, and communicate with potential exchange partners. <strong>We are a marketplace facilitator, not a party to any exchange between users.</strong> We do not guarantee the quality, safety, legality, or value of any goods or services exchanged between users.</p>
            </section>

            <section>
              <h2 className="text-base font-bold text-gray-900 mb-2">4. User Accounts</h2>
              <ul className="list-disc pl-5 space-y-1">
                <li>You are responsible for maintaining the security of your account credentials</li>
                <li>You must provide accurate information when creating your account</li>
                <li>You may not create accounts on behalf of others without authorization</li>
                <li>You may not have more than one active account</li>
                <li>Notify us immediately at <a href="mailto:hello@valueloop.app" className="text-teal-600">hello@valueloop.app</a> if you suspect unauthorized account access</li>
              </ul>
            </section>

            <section>
              <h2 className="text-base font-bold text-gray-900 mb-2">5. Acceptable Use</h2>
              <p>You agree <strong>not</strong> to:</p>
              <ul className="list-disc pl-5 mt-1 space-y-1">
                <li>Post false, misleading, or fraudulent offers or requests</li>
                <li>Offer or request illegal goods, services, or activities</li>
                <li>Harass, threaten, or harm other users</li>
                <li>Use the Platform for spam, pyramid schemes, or multi-level marketing</li>
                <li>Circumvent our platform to conduct exchanges off-platform after being matched</li>
                <li>Attempt to manipulate AI matching or pricing systems</li>
                <li>Scrape, reverse-engineer, or exploit the Platform's systems</li>
                <li>Create fake reviews, trust scores, or exchange records</li>
                <li>Use automated bots to post or interact</li>
              </ul>
            </section>

            <section>
              <h2 className="text-base font-bold text-gray-900 mb-2">6. AI-Assisted Features</h2>
              <p>ValueLoop uses AI to suggest matches and estimate value ranges. These suggestions are <strong>informational only</strong> and not guarantees of equal value or successful exchange. You are solely responsible for evaluating any match or exchange before agreeing to it. We make no warranty about the accuracy or fairness of AI suggestions.</p>
            </section>

            <section>
              <h2 className="text-base font-bold text-gray-900 mb-2">7. Payments</h2>
              <p>Where cash payment options are offered, payments are processed by <strong>Stripe</strong>. You agree to Stripe's terms of service. Zean LLC may collect a platform service fee on cash transactions, which will be disclosed at the time of payment. We are not responsible for payment disputes between users.</p>
            </section>

            <section>
              <h2 className="text-base font-bold text-gray-900 mb-2">8. Exchange Disputes</h2>
              <p>Disputes between users regarding exchange quality, fairness, or completion are between the users involved. We may, at our discretion, investigate reported disputes, suspend involved accounts, or remove content. We are not obligated to mediate or resolve user disputes.</p>
            </section>

            <section>
              <h2 className="text-base font-bold text-gray-900 mb-2">9. Intellectual Property</h2>
              <p>You retain ownership of content you post on ValueLoop. By posting, you grant Zean LLC a non-exclusive, royalty-free license to display and use that content to operate the Platform. The ValueLoop name, logo, and software are the property of Zean LLC and may not be used without permission.</p>
            </section>

            <section>
              <h2 className="text-base font-bold text-gray-900 mb-2">10. Termination</h2>
              <p>We may suspend or terminate your account at any time for violation of these Terms, fraudulent activity, or for any reason at our sole discretion with or without notice. You may delete your account at any time by contacting us. Termination does not entitle you to a refund of any fees paid.</p>
            </section>

            <section>
              <h2 className="text-base font-bold text-gray-900 mb-2">11. Disclaimer of Warranties</h2>
              <p>The Platform is provided "as is" and "as available" without warranties of any kind, express or implied. We do not warrant that the Platform will be error-free, uninterrupted, or that any exchange will be completed successfully.</p>
            </section>

            <section>
              <h2 className="text-base font-bold text-gray-900 mb-2">12. Limitation of Liability</h2>
              <p>To the maximum extent permitted by law, Zean LLC shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the Platform, including losses from failed exchanges, AI errors, or user disputes. Our total liability to you shall not exceed $100 or the amount you paid us in the past 12 months, whichever is greater.</p>
            </section>

            <section>
              <h2 className="text-base font-bold text-gray-900 mb-2">13. Governing Law</h2>
              <p>These Terms are governed by the laws of the United States. Any disputes shall be resolved through binding arbitration rather than in court, except that either party may seek injunctive relief in court for intellectual property violations.</p>
            </section>

            <section>
              <h2 className="text-base font-bold text-gray-900 mb-2">14. Changes to Terms</h2>
              <p>We may update these Terms at any time. We will notify you of material changes via email or in-app notice at least 14 days before they take effect. Continued use after the effective date constitutes acceptance.</p>
            </section>

            <section>
              <h2 className="text-base font-bold text-gray-900 mb-2">15. Contact</h2>
              <p>Zean LLC<br />Email: <a href="mailto:hello@valueloop.app" className="text-teal-600">hello@valueloop.app</a><br />Website: <a href="https://valueloop.app" className="text-teal-600">valueloop.app</a></p>
            </section>

          </div>
        </div>

        <div className="text-center mt-6 flex items-center justify-center gap-4 text-sm text-gray-400">
          <Link href="/privacy" className="hover:text-teal-600 transition">Privacy Policy</Link>
          <span>Â·</span>
          <Link href="/login" className="hover:text-teal-600 transition">Sign in</Link>
        </div>
      </div>
    </div>
  )
}
