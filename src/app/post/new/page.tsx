'use client'
import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { CATEGORIES, PostType } from '@/types'

const CATEGORY_EMOJI: Record<string, string> = {
  'Design & Creative': '🎨', 'Web & Tech': '💻', 'Marketing': '📣',
  'Writing & Content': '✍️', 'Legal': '⚖️', 'Finance & Accounting': '💰',
  'Tutoring & Education': '📚', 'Health & Wellness': '🌿', 'Home & Garden': '🏡',
  'Food & Cooking': '🍳', 'Transport & Moving': '🚚', 'Music & Audio': '🎵',
  'Photography & Video': '📷', 'Business & Consulting': '💼', 'Other': '✨',
}

function PostForm() {
  const router = useRouter()
  const params = useSearchParams()
  const [type, setType] = useState<PostType>((params.get('type') as PostType) || 'offer')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [location, setLocation] = useState('')
  const [remoteOk, setRemoteOk] = useState(true)
  const [estimatedValue, setEstimatedValue] = useState('')
  const [cashPrice, setCashPrice] = useState('')
  const [generateStripeLink, setGenerateStripeLink] = useState(false)
  const [aiRange, setAiRange] = useState<{ min: number; max: number; rationale: string } | null>(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  async function fetchAiPrice() {
    if (!title || !description || !category) return
    setAiLoading(true)
    try {
      const res = await fetch('/api/ai/price', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, category }),
      })
      const data = await res.json()
      if (data.min) { setAiRange(data); if (!estimatedValue) setEstimatedValue(String(Math.round((data.min + data.max) / 2))) }
    } catch {}
    setAiLoading(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { data, error } = await supabase.from('posts').insert({
      user_id: user.id, type, title, description, category,
      location: location || null, remote_ok: remoteOk,
      estimated_value: estimatedValue ? parseFloat(estimatedValue) : null,
      ai_value_min: aiRange?.min || null, ai_value_max: aiRange?.max || null,
      ai_value_accepted: aiRange ? (estimatedValue ? 'edited' : 'accepted') : 'ignored',
      cash_price: cashPrice ? parseFloat(cashPrice) : null,
      status: 'active',
    }).select().single()

    if (!error && data) {
      if (generateStripeLink && cashPrice && parseFloat(cashPrice) > 0) {
        fetch('/api/stripe/create-link', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ post_id: data.id, cash_price: parseFloat(cashPrice), title, description }),
        }).catch(() => {})
      }
      fetch('/api/ai/match', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ post_id: data.id }),
      }).catch(() => {})
      router.push('/dashboard')
    } else {
      setSaving(false)
    }
  }

  const isNeed = type === 'need'

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Nav */}
      <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3 sticky top-0 z-40">
        <button onClick={() => router.back()}
          className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 transition text-gray-500">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span className="font-bold text-gray-900">New Post</span>
      </div>

      <div className="max-w-lg mx-auto px-4 py-5">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type toggle */}
          <div className="bg-gray-100 rounded-2xl p-1.5 flex">
            {(['need', 'offer'] as PostType[]).map(t => (
              <button key={t} type="button" onClick={() => setType(t)}
                className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${
                  type === t
                    ? `bg-white shadow-sm ${t === 'need' ? 'text-blue-600' : 'text-green-600'}`
                    : 'text-gray-400'
                }`}>
                {t === 'need' ? '📋 I Need' : '🎁 I Offer'}
              </button>
            ))}
          </div>

          {/* What is it */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4 shadow-sm">
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                {isNeed ? 'What do you need?' : 'What are you offering?'}
              </label>
              <input type="text" value={title} onChange={e => setTitle(e.target.value)}
                placeholder={isNeed ? 'e.g. Need a logo designer' : 'e.g. Web development services'}
                className="w-full mt-2 px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-50 focus:bg-white transition" required />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Description</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} rows={4}
                placeholder={isNeed ? 'Describe exactly what you need, timeline, any requirements…' : 'Describe what you offer, your experience, what’s included…'}
                className="w-full mt-2 px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-50 focus:bg-white transition resize-none" required />
            </div>
          </div>

          {/* Category grid */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Category</label>
            <div className="grid grid-cols-3 gap-2 mt-3">
              {CATEGORIES.map(cat => (
                <button key={cat} type="button" onClick={() => setCategory(cat)}
                  className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border text-center transition-all active:scale-95 ${
                    category === cat
                      ? 'border-blue-400 bg-blue-50 shadow-sm'
                      : 'border-gray-100 bg-gray-50 hover:border-gray-200'
                  }`}>
                  <span className="text-xl">{CATEGORY_EMOJI[cat]}</span>
                  <span className={`text-[10px] font-semibold leading-tight ${category === cat ? 'text-blue-700' : 'text-gray-500'}`}>
                    {cat}
                  </span>
                </button>
              ))}
            </div>
            {!category && <input type="text" required defaultValue="" className="sr-only" aria-hidden />}
          </div>

          {/* Location */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Location</label>
            <input type="text" value={location} onChange={e => setLocation(e.target.value)} placeholder="Your city (optional)"
              className="w-full mt-2 px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-50 focus:bg-white transition" />
            <label className="flex items-center gap-2.5 mt-3 cursor-pointer">
              <div
                onClick={() => setRemoteOk(v => !v)}
                className={`w-10 h-6 rounded-full transition-colors relative ${remoteOk ? 'bg-blue-500' : 'bg-gray-200'}`}>
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${remoteOk ? 'translate-x-5' : 'translate-x-1'}`} />
              </div>
              <span className="text-sm text-gray-700 font-medium">Remote / online OK</span>
            </label>
          </div>

          {/* Value */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Estimated Value (USD)</label>
              <button type="button" onClick={fetchAiPrice} disabled={aiLoading || !title || !category || !description}
                className="flex items-center gap-1 text-xs text-blue-600 font-bold disabled:opacity-40 bg-blue-50 px-2.5 py-1 rounded-lg transition hover:bg-blue-100">
                {aiLoading ? (
                  <><svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg> Estimating…</>
                ) : '✨ AI Estimate'}
              </button>
            </div>
            {aiRange && (
              <div className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-100 rounded-xl px-4 py-3">
                <p className="text-sm font-bold text-blue-800">AI suggests: ${aiRange.min}–${aiRange.max}</p>
                <p className="text-xs text-blue-600 mt-0.5">{aiRange.rationale}</p>
              </div>
            )}
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-semibold">$</span>
              <input type="number" value={estimatedValue} onChange={e => setEstimatedValue(e.target.value)} placeholder="0.00" min="0" step="0.01"
                className="w-full pl-8 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-50 focus:bg-white transition" />
            </div>
          </div>

          {/* Cash price (offers only) */}
          {type === 'offer' && (
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-3">
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Cash Price (optional)</label>
                <p className="text-xs text-gray-400 mt-1">Allow people to pay cash instead of exchanging</p>
              </div>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-semibold">$</span>
                <input type="number" value={cashPrice} onChange={e => setCashPrice(e.target.value)} placeholder="0.00" min="0" step="0.01"
                  className="w-full pl-8 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-50 focus:bg-white transition" />
              </div>
              {cashPrice && parseFloat(cashPrice) > 0 && (
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <div
                    onClick={() => setGenerateStripeLink(v => !v)}
                    className={`w-10 h-6 rounded-full transition-colors relative ${generateStripeLink ? 'bg-blue-500' : 'bg-gray-200'}`}>
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${generateStripeLink ? 'translate-x-5' : 'translate-x-1'}`} />
                  </div>
                  <span className="text-sm text-gray-700 font-medium">Generate Stripe payment link</span>
                </label>
              )}
            </div>
          )}

          <button type="submit" disabled={saving || !category}
            className="w-full py-4 bg-gradient-to-r from-blue-500 to-green-600 text-white font-bold rounded-2xl hover:opacity-90 active:scale-[0.98] transition shadow-lg shadow-blue-500/20 disabled:opacity-50 text-sm">
            {saving ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
                Posting…
              </span>
            ) : `Post ${isNeed ? 'Request' : 'Offer'} →`}
          </button>
        </form>
      </div>
    </div>
  )
}

export default function NewPost() {
  return <Suspense><PostForm /></Suspense>
}
