'use client'
import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import VLLogo from '@/components/VLLogo'

function SignupForm() {
  const router = useRouter()
  const params = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const inviteCode = params.get('ref') || ''

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    const supabase = createClient()
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: {
        data: { display_name: name, invite_code_used: inviteCode },
        emailRedirectTo: `${location.origin}/auth/callback`
      }
    })
    if (error) { setError(error.message); setLoading(false); return }
    if (data.session) {
      if (inviteCode) {
        try { await fetch('/api/invite/claim', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ slug: inviteCode, new_user_id: data.session.user.id }) }) } catch {}
      }
      router.push('/onboarding')
      router.refresh()
    } else {
      router.push('/verify-email')
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <div className="h-1.5 bg-gradient-to-r from-blue-500 to-green-600" />

      <div className="flex-1 flex flex-col items-center justify-center px-5 py-8">
        <div className="mb-6">
          <VLLogo size={44} />
        </div>

        <div className="w-full max-w-sm">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold text-gray-900">Join ValueLoop</h1>
            <p className="text-gray-500 text-sm mt-1">Exchange value. No money required.</p>
            {inviteCode && (
              <div className="mt-2 inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 text-xs font-semibold px-3 py-1.5 rounded-full">
                🎉 You were invited!
              </div>
            )}
          </div>

          {/* Value props */}
          <div className="grid grid-cols-3 gap-2 mb-6">
            {[['🤖', 'AI Matching'], ['🔄', 'Direct Swaps'], ['🤝', 'Real Value']].map(([emoji, label]) => (
              <div key={label} className="bg-white rounded-xl border border-gray-100 p-2.5 text-center shadow-sm">
                <div className="text-xl mb-1">{emoji}</div>
                <p className="text-[10px] font-semibold text-gray-500">{label}</p>
              </div>
            ))}
          </div>

          <form onSubmit={handleSignup} className="space-y-3">
            <input type="text" placeholder="Your name" value={name} onChange={e => setName(e.target.value)}
              className="w-full px-4 py-3.5 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white shadow-sm" required />
            <input type="email" placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)}
              className="w-full px-4 py-3.5 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white shadow-sm" required />
            <div className="relative">
              <input type={showPassword ? 'text' : 'password'} placeholder="Password (min 8 chars)" value={password} onChange={e => setPassword(e.target.value)} minLength={8}
                className="w-full px-4 py-3.5 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white shadow-sm pr-14" required />
              <button type="button" onClick={() => setShowPassword(v => !v)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-semibold">
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-100 rounded-xl px-3 py-2.5 flex items-start gap-2">
                <span className="text-sm">⚠️</span>
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-blue-500 to-green-600 text-white font-bold rounded-2xl hover:opacity-90 active:scale-[0.98] transition shadow-lg shadow-blue-500/20 disabled:opacity-50 text-sm">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  Creating account…
                </span>
              ) : 'Create Account →'}
            </button>

            <p className="text-center text-xs text-gray-400 mt-1">
              By signing up you agree to our{' '}
              <Link href="/terms" className="text-blue-600 hover:underline">Terms of Service</Link>
              {' '}and{' '}
              <Link href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</Link>
            </p>
          </form>

          <p className="text-center text-sm text-gray-500 mt-5">
            Already have an account?{' '}
            <Link href="/login" className="text-blue-600 font-semibold hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function SignupPage() {
  return <Suspense><SignupForm /></Suspense>
}
