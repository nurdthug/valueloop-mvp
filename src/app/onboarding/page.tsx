'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const STEPS = [
  {
    title: 'Trade value,\nnot just cash',
    subtitle: 'Welcome to ValueLoop',
    content: 'Post what you need and what you can offer. ValueLoop finds people who fit — directly or through a multi-party loop.',
    kind: 'hero',
  },
  {
    title: 'Your AI value\nassistant',
    subtitle: 'Smart, fair, transparent',
    steps: [
      { emoji: '📋', label: 'Post what you need', sub: 'Anything — skills, gear, time' },
      { emoji: '🎁', label: 'Post what you offer', sub: 'AI suggests a fair value range' },
      { emoji: '🤖', label: 'AI finds your matches', sub: 'Direct swaps or 3-way loops' },
      { emoji: '🤝', label: 'Chat & complete', sub: 'Reviewed for safety early on' },
    ],
    kind: 'steps',
  },
  {
    title: 'Set up your\nprofile',
    subtitle: "Help others know who they're swapping with",
    isForm: true,
    kind: 'form',
  },
]

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [name, setName] = useState('')
  const [bio, setBio] = useState('')
  const [location, setLocation] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleFinish() {
    setSaving(true)
    setError('')
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    // Profile row is created by a DB trigger at signup — update it (RLS allows update, not insert)
    const { error: updateError } = await supabase.from('profiles').update({
      display_name: name || user.user_metadata.display_name || 'ValueLooper',
      bio,
      location,
      onboarding_complete: true,
      updated_at: new Date().toISOString(),
    }).eq('id', user.id)
    if (updateError) {
      setError(`Could not save your profile: ${updateError.message}`)
      setSaving(false)
      return
    }
    router.push('/dashboard')
    router.refresh()
  }

  const s = STEPS[step]
  const isLast = step === STEPS.length - 1

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#0D1B2A', color: '#fff' }}>
      {/* ambient glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute rounded-full blur-3xl opacity-40"
          style={{ width: 420, height: 420, top: -80, left: '50%', transform: 'translateX(-50%)',
            background: step === 0 ? 'radial-gradient(circle,#1E8BF5,transparent)'
              : step === 1 ? 'radial-gradient(circle,#19C95F,transparent)'
              : 'radial-gradient(circle,#F59E0B,transparent)' }} />
      </div>

      <div className="relative flex-1 flex flex-col px-7" style={{ paddingTop: 'calc(env(safe-area-inset-top,0px) + 56px)' }}>
        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-12">
          {STEPS.map((_, i) => (
            <div key={i} className="h-2 rounded-full transition-all duration-300"
              style={{ width: i === step ? 28 : 8, background: i === step ? '#1E8BF5' : 'rgba(255,255,255,.22)' }} />
          ))}
        </div>

        {/* Step 0 — hero */}
        {step === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center text-center vl-fade-in -mt-10">
            <video
              src="/valueloop-animation.mp4"
              poster="/valueloop-animation-poster.jpg"
              autoPlay loop muted playsInline
              className="rounded-3xl"
              style={{ width: 188, height: 'auto', boxShadow: '0 24px 60px rgba(30,139,245,.4)' }}
            />
            <h1 className="mt-8 text-4xl font-extrabold whitespace-pre-line leading-[1.1] tracking-tight">{s.title}</h1>
            <p className="mt-5 text-base leading-relaxed max-w-xs" style={{ color: '#9FB0C6' }}>{s.content}</p>
          </div>
        )}

        {/* Step 1 — steps list */}
        {step === 1 && (
          <div className="flex-1 vl-fade-in">
            <h1 className="text-4xl font-extrabold whitespace-pre-line leading-[1.1] tracking-tight">{s.title}</h1>
            <p className="mt-2 text-sm" style={{ color: '#9FB0C6' }}>{s.subtitle}</p>
            <div className="mt-8 space-y-3">
              {s.steps?.map((st, i) => (
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
          </div>
        )}

        {/* Step 2 — profile form */}
        {step === 2 && (
          <div className="flex-1 vl-fade-in">
            <h1 className="text-4xl font-extrabold whitespace-pre-line leading-[1.1] tracking-tight">{s.title}</h1>
            <p className="mt-2 text-sm" style={{ color: '#9FB0C6' }}>{s.subtitle}</p>
            <div className="mt-8 space-y-3">
              <input type="text" placeholder="Display name" value={name} onChange={e => setName(e.target.value)}
                className="w-full rounded-2xl px-4 py-4 text-base outline-none"
                style={{ background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.12)', color: '#fff' }} />
              <textarea placeholder="Short bio (optional)" value={bio} onChange={e => setBio(e.target.value)} rows={3}
                className="w-full rounded-2xl px-4 py-4 text-base outline-none resize-none"
                style={{ background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.12)', color: '#fff' }} />
              <input type="text" placeholder="Your city / location (optional)" value={location} onChange={e => setLocation(e.target.value)}
                className="w-full rounded-2xl px-4 py-4 text-base outline-none"
                style={{ background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.12)', color: '#fff' }} />
            </div>
          </div>
        )}

        {error && <p className="text-sm mt-4 text-center" style={{ color: '#FCA5A5' }}>{error}</p>}
      </div>

      {/* Footer actions */}
      <div className="relative px-7" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom,0px) + 28px)' }}>
        <div className="flex gap-3">
          {step > 0 && (
            <button onClick={() => setStep(v => v - 1)}
              className="py-4 px-6 rounded-2xl font-bold transition active:scale-95"
              style={{ background: 'rgba(255,255,255,.08)', color: '#fff' }}>
              Back
            </button>
          )}
          {!isLast ? (
            <button onClick={() => setStep(v => v + 1)}
              className="flex-1 py-4 rounded-2xl font-bold text-white transition active:scale-95"
              style={{ background: 'linear-gradient(135deg,#1E8BF5,#19C95F)', boxShadow: '0 12px 28px rgba(30,139,245,.4)' }}>
              {step === 0 ? 'Get Started' : 'Continue'}
            </button>
          ) : (
            <button onClick={handleFinish} disabled={saving}
              className="flex-1 py-4 rounded-2xl font-bold text-white transition active:scale-95 disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg,#1E8BF5,#19C95F)', boxShadow: '0 12px 28px rgba(30,139,245,.4)' }}>
              {saving ? 'Saving…' : 'Enter ValueLoop'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

