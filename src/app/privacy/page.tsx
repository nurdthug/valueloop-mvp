import Link from 'next/link'
import VLLogo from '@/components/VLLogo'

export const metadata = {
  title: 'Privacy Policy — ValueLoop',
  description: 'How ValueLoop collects, uses, and protects your information.',
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/"><VLLogo size={28} /></Link>
          <Link href="/login" className="text-sm text-blue-600 font-semibold">Sign in</Link>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-10 pb-20">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Privacy Policy</h1>
          <p className="text-sm text-gray-400 mb-8">Effective date: June 15, 2025 · Last updated: June 15, 2025</p>

          <div className="prose prose-sm max-w-none text-gray-600 space-y-6">

            <section>
              <h2 className="text-base font-bold text-gray-900 mb-2">1. Who We Are</h2>
              <p>ValueLoop is operated by <strong>Zean LLC</strong> ("we," "us," or "our"). We provide a peer-to-peer value exchange platform at <a href="https://valueloop.app" className="text-blue-600">valueloop.app</a> that helps users trade skills, services, and resources without cash. Questions can be directed to <a href="mailto:hello@valueloop.app" className="text-blue-600">hello@valueloop.app</a>.</p>
            </section>

            <section>
              <h2 className="text-base font-bold text-gray-900 mb-2">2. Information We Collect</h2>
              <p><strong>Information you provide:</strong></p>
              <ul className="list-disc pl-5 mt-1 space-y-1">
                <li>Account details: name, email address, password (stored encrypted)</li>
                <li>Profile information: display name, bio, location (all optional)</li>
                <li>Posts: titles, descriptions, categories, estimated values</li>
                <li>Messages: content of chat threads with matched users</li>
                <li>Payment information: processed entirely by Stripe — we never see or store your card details</li>
              </ul>
              <p className="mt-3"><strong>Information collected automatically:</strong></p>
              <ul className="list-disc pl-5 mt-1 space-y-1">
                <li>Authentication tokens and session data</li>
                <li>Basic usage activity (posts created, exchanges completed, invite links used)</li>
                <li>Device type and general location (country/city, not GPS)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-base font-bold text-gray-900 mb-2">3. How We Use Your Information</h2>
              <ul className="list-disc pl-5 space-y-1">
                <li>To provide, operate, and improve the ValueLoop platform</li>
                <li>To power AI-assisted matching and value estimation features</li>
                <li>To connect you with matched users via chat threads</li>
                <li>To process payments through Stripe when applicable</li>
                <li>To detect and prevent fraud, spam, or abuse</li>
                <li>To send transactional communications (match notifications, account alerts)</li>
                <li>We do <strong>not</strong> sell your personal data to third parties</li>
                <li>We do <strong>not</strong> use your data for advertising</li>
              </ul>
            </section>

            <section>
              <h2 className="text-base font-bold text-gray-900 mb-2">4. AI Processing</h2>
              <p>ValueLoop uses AI models (Google Gemini or Anthropic Claude) to suggest matches and estimate value ranges for posts. When you create a post, its title, description, and category may be sent to these AI providers to generate suggestions. We do not send personally identifiable information (name, email) to AI providers. AI providers' own privacy policies govern their data handling.</p>
            </section>

            <section>
              <h2 className="text-base font-bold text-gray-900 mb-2">5. Information Sharing</h2>
              <p>We share your information only with:</p>
              <ul className="list-disc pl-5 mt-1 space-y-1">
                <li><strong>Supabase</strong> — our database and authentication provider</li>
                <li><strong>Stripe</strong> — payment processing (only when you make or receive a cash payment)</li>
                <li><strong>Google / Anthropic</strong> — AI matching and pricing suggestions (post content only)</li>
                <li><strong>Vercel</strong> — our hosting provider</li>
                <li>Law enforcement or legal process when required by law</li>
              </ul>
              <p className="mt-2">Your display name and public post content are visible to other ValueLoop users.</p>
            </section>

            <section>
              <h2 className="text-base font-bold text-gray-900 mb-2">6. Data Retention</h2>
              <p>We retain your account data for as long as your account is active. If you delete your account, we remove your personal profile data within 30 days. Post content and anonymized exchange records may be retained for up to 12 months for service improvement purposes.</p>
            </section>

            <section>
              <h2 className="text-base font-bold text-gray-900 mb-2">7. Your Rights</h2>
              <p>Depending on where you live, you may have the right to access, correct, or delete your personal data. To make a request, email <a href="mailto:hello@valueloop.app" className="text-blue-600">hello@valueloop.app</a>. We will respond within 30 days.</p>
            </section>

            <section>
              <h2 className="text-base font-bold text-gray-900 mb-2">8. Security</h2>
              <p>We use HTTPS/TLS encryption in transit, encrypted password storage, row-level database security, and role-based access controls. No method of transmission over the internet is 100% secure, but we take reasonable precautions to protect your data.</p>
            </section>

            <section>
              <h2 className="text-base font-bold text-gray-900 mb-2">9. Children's Privacy</h2>
              <p>ValueLoop is not directed at children under 13. We do not knowingly collect personal information from anyone under 13. If you believe a child has provided us with personal data, contact us and we will promptly delete it.</p>
            </section>

            <section>
              <h2 className="text-base font-bold text-gray-900 mb-2">10. Changes to This Policy</h2>
              <p>We may update this policy from time to time. We will notify you of significant changes by email or in-app notice. Your continued use after changes take effect constitutes acceptance of the updated policy.</p>
            </section>

            <section>
              <h2 className="text-base font-bold text-gray-900 mb-2">11. Contact</h2>
              <p>Zean LLC<br />Email: <a href="mailto:hello@valueloop.app" className="text-blue-600">hello@valueloop.app</a><br />Website: <a href="https://valueloop.app" className="text-blue-600">valueloop.app</a></p>
            </section>
          </div>
        </div>

        <div className="text-center mt-6 flex items-center justify-center gap-4 text-sm text-gray-400">
          <Link href="/terms" className="hover:text-blue-600 transition">Terms of Service</Link>
          <span>·</span>
          <Link href="/login" className="hover:text-blue-600 transition">Sign in</Link>
        </div>
      </div>
    </div>
  )
}
