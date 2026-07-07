import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import VLLogo from '@/components/VLLogo'

const STEPS = [
  { emoji: '📋', label: 'Post what you need', sub: 'Skills, services, or goods' },
  { emoji: '🎁', label: 'Offer what you have', sub: 'AI suggests a fair value' },
  { emoji: '🤖', label: 'AI finds your matches', sub: 'Direct swaps or multi-party loops' },
  { emoji: '🤝', label: 'Chat & exchange', sub: 'Complete it — no money required' },
]

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect('/dashboard')

  return (
    <div className="min-h-screen text-white" style={{ background: '#0D1B2A' }}>
      {/* Ambient brand glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full opacity-25 blur-3xl"
          style={{ background: 'radial-gradient(circle,#1E8BF5,transparent)' }} />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full opacity-25 blur-3xl"
          style={{ background: 'radial-gradient(circle,#19C95F,transparent)' }} />
      </div>

      <div className="relative max-w-lg mx-auto px-6 flex flex-col min-h-screen"
        style={{ paddingTop: 'calc(env(safe-area-inset-top,0px) + 20px)', paddingBottom: 'calc(env(safe-area-inset-bottom,0px) + 24px)' }}>
        {/* Top bar */}
        <div className="flex items-center justify-between">
          <VLLogo size={34} dark />
          <Link href="/login"
            className="text-sm font-semibold px-4 py-2 rounded-full"
            style={{ background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.12)' }}>
            Sign in
          </Link>
        </div>

        {/* Hero */}
        <div className="flex-1 flex flex-col items-center justify-center text-center py-12 vl-fade-in">
          <video
            src="/valueloop-animation.mp4"
            poster="/valueloop-animation-poster.jpg"
            autoPlay loop muted playsInline
            className="rounded-3xl"
            style={{ width: 200, height: 'auto', boxShadow: '0 24px 60px rgba(30,139,245,.4)' }}
          />
          <h1 className="mt-8 text-4xl font-extrabold leading-[1.1] tracking-tight whitespace-pre-line">
            {'Exchange value.\n'}
            <span className="text-transparent bg-clip-text"
              style={{ backgroundImage: 'linear-gradient(135deg,#1E8BF5,#19C95F)' }}>
              No money required.
            </span>
          </h1>
          <p className="mt-5 text-base leading-relaxed max-w-xs" style={{ color: '#9FB0C6' }}>
            Trade skills, time, and resources through smart, AI-matched, community-powered exchanges.
          </p>
        </div>

        {/* How it works */}
        <div className="space-y-3 mb-8">
          {STEPS.map((st, i) => (
            <div key={i} className="flex items-center gap-4 p-4 rounded-2xl"
              style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.08)' }}>
              <span className="text-2xl">{st.emoji}</span>
              <div>
                <div className="font-bold">{st.label}</div>
                <div className="text-xs" style={{ color: '#9FB0C6' }}>{st.sub}</div>
              </div>
            </div>
          ))}
        </div>

        {/* CTAs */}
        <div className="space-y-3">
          <Link href="/signup"
            className="block w-full py-4 text-center font-bold rounded-2xl text-white text-[17px] active:scale-[0.98] transition"
            style={{ background: 'linear-gradient(135deg,#1E8BF5,#19C95F)', boxShadow: '0 10px 30px rgba(30,139,245,.35)' }}>
            Join ValueLoop 🚀
          </Link>
          <Link href="/browse"
            className="block w-full py-4 text-center font-semibold rounded-2xl text-[15px]"
            style={{ background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.12)', color: '#CBD8E8' }}>
            Browse the marketplace →
          </Link>
        </div>
      </div>
    </div>
  )
}
