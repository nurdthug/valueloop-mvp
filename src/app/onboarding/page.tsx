'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const STEPS = [
  {
    title: 'Welcome to ValueLoop',
    subtitle: 'Exchange Value. Directly.',
    content: 'ValueLoop lets you trade what you have for what you need — no money required. Post what you can offer and what you need, and our AI finds people to swap with.',
    emoji: '🔄',
  },
  {
    title: 'How it works',
    subtitle: 'Four simple steps',
    steps: [
      { emoji: '📋', label: 'Post what you need' },
      { emoji: '🎁', label: 'Post what you offer' },
      { emoji: '🤖', label: 'AI suggests matches' },
      { emoji: '🤝', label: 'Chat & complete the exchange' },
    ],
  },
  {
    title: 'Set up your profile',
    subtitle: 'Help others know who they\'re exchanging with',
    isForm: true,
  },
]

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [name, setName] = useState('')
  const [bio, setBio] = useState('')
  const [location, setLocation] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleFinish() {
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('profiles').upsert({
      id: user.id,
      display_name: name || user.user_metadata.display_name || 'ValueLooper',
      bio,
      location,
      onboarding_complete: true,
    })
    router.push('/dashboard')
  }

  const s = STEPS[step]

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-8">
          {STEPS.map((_, i) => (
            <div key={i} className={`h-2 rounded-full transition-all ${i === step ? 'w-8 bg-teal-500' : 'w-2 bg-gray-200'}`} />
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          {step === 0 && (
            <div className="text-center">
              <div className="text-6xl mb-4">{s.emoji}</div>
              <h1 className="text-2xl font-bold text-gray-900">{s.title}</h1>
              <p className="text-teal-600 font-medium mt-1">{s.subtitle}</p>
              <p className="text-gray-500 text-sm mt-4 leading-relaxed">{s.content}</p>
            </div>
          )}
          {step === 1 && (
            <div>
              <h1 className="text-2xl font-bold text-gray-900 text-center">{s.title}</h1>
              <p className="text-gray-500 text-sm text-center mt-1">{s.subtitle}</p>
              <div className="mt-6 space-y-4">
                {s.steps?.map((st, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                    <span className="text-2xl">{st.emoji}</span>
                    <span className="font-medium text-gray-700">{st.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {step === 2 && (
            <div>
              <h1 className="text-2xl font-bold text-gray-900 text-center">{s.title}</h1>
              <p className="text-gray-500 text-sm text-center mt-1">{s.subtitle}</p>
              <div className="mt-6 space-y-4">
                <input type="text" placeholder="Display name" value={name} onChange={e => setName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
                <textarea placeholder="Short bio (optional)" value={bio} onChange={e => setBio(e.target.value)} rows={3}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 resize-none" />
                <input type="text" placeholder="Your city / location (optional)" value={location} onChange={e => setLocation(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
              </div>
            </div>
          )}

          <div className="mt-8 flex gap-3">
            {step > 0 && (
              <button onClick={() => setStep(s => s - 1)}
                className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50 transition">
                Back
              </button>
            )}
            {step < STEPS.length - 1 ? (
              <button onClick={() => setStep(s => s + 1)}
                className="flex-1 py-3 bg-gradient-to-r from-teal-500 to-purple-600 text-white font-semibold rounded-xl hover:opacity-90 transition">
                Next
              </button>
            ) : (
              <button onClick={handleFinish} disabled={saving}
                className="flex-1 py-3 bg-gradient-to-r from-teal-500 to-purple-600 text-white font-semibold rounded-xl hover:opacity-90 transition disabled:opacity-50">
                {saving ? 'Saving…' : 'Get Started 🚀'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
