'use client'
import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { CATEGORIES, PostType } from '@/types'

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
      if (data.min) setAiRange(data)
    } catch {}
    setAiLoading(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase.from('posts').insert({
      user_id: user.id,
      type,
      title,
      description,
      category,
      location: location || null,
      remote_ok: remoteOk,
      estimated_value: estimatedValue ? parseFloat(estimatedValue) : null,
      ai_value_min: aiRange?.min || null,
      ai_value_max: aiRange?.max || null,
      ai_value_accepted: aiRange ? (estimatedValue ? 'edited' : 'accepted') : 'ignored',
      cash_price: cashPrice ? parseFloat(cashPrice) : null,
      status: 'active',
    }).select().single()

    if (!error && data) {
      // Generate Stripe payment link if requested
      if (generateStripeLink && cashPrice && parseFloat(cashPrice) > 0) {
        fetch('/api/stripe/create-link', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ post_id: data.id, cash_price: parseFloat(cashPrice), title, description }),
        }).catch(() => {})
      }

      // Trigger AI matching in the background
      fetch('/api/ai/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ post_id: data.id }),
      }).catch(() => {})

      router.push('/dashboard')
    } else {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-600">←</button>
        <span className="font-semibold text-gray-900">New Post</span>
      </nav>
      <div className="max-w-lg mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Type toggle */}
          <div className="flex bg-gray-100 rounded-xl p-1">
            {(['need','offer'] as PostType[]).map(t => (
              <button key={t} type="button" onClick={() => setType(t)}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${type === t ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}>
                {t === 'need' ? '📋 I Need' : '🎁 I Offer'}
              </button>
            ))}
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Title</label>
              <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder={type === 'need' ? 'e.g. Need a logo designer' : 'e.g. Offering web development'}
                className="w-full mt-1 px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" required />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Description</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} rows={4} placeholder="Describe in detail…"
                className="w-full mt-1 px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 resize-none" required />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Category</label>
              <select value={category} onChange={e => setCategory(e.target.value)}
                className="w-full mt-1 px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" required>
                <option value="">Select a category…</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Location</label>
                <input type="text" value={location} onChange={e => setLocation(e.target.value)} placeholder="City (optional)"
                  className="w-full mt-1 px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
              </div>
              <label className="flex items-end gap-2 pb-3 cursor-pointer">
                <input type="checkbox" checked={remoteOk} onChange={e => setRemoteOk(e.target.checked)} className="w-4 h-4 accent-teal-500" />
                <span className="text-sm text-gray-600">Remote OK</span>
              </label>
            </div>
          </div>

          {/* AI Value */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Estimated Value (USD)</label>
              <button type="button" onClick={fetchAiPrice} disabled={aiLoading || !title || !category}
                className="text-xs text-teal-600 font-medium disabled:opacity-40">
                {aiLoading ? '⏳ Getting AI estimate…' : '✨ Get AI estimate'}
              </button>
            </div>
            {aiRange && (
              <div className="bg-teal-50 rounded-xl px-4 py-3 text-sm text-teal-800">
                <span className="font-semibold">AI suggests: ${aiRange.min}–${aiRange.max}</span>
                <p className="text-xs mt-1 text-teal-600">{aiRange.rationale}</p>
              </div>
            )}
            <input type="number" value={estimatedValue} onChange={e => setEstimatedValue(e.target.value)} placeholder="0.00" min="0" step="0.01"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
          </div>

          {/* Cash price + Stripe link (offers only) */}
          {type === 'offer' && (
            <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Cash Purchase Price (optional)</label>
              <p className="text-xs text-gray-400">Allow people to pay cash instead of exchanging. We'll generate a Stripe payment link.</p>
              <input
                type="number"
                value={cashPrice}
                onChange={e => setCashPrice(e.target.value)}
                placeholder="0.00"
                min="0"
                step="0.01"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
              />
              {cashPrice && parseFloat(cashPrice) > 0 && (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={generateStripeLink}
                    onChange={e => setGenerateStripeLink(e.target.checked)}
                    className="w-4 h-4 accent-teal-500"
                  />
                  <span className="text-sm text-gray-700">Generate Stripe payment link for ${cashPrice}</span>
                </label>
              )}
            </div>
          )}

          <button type="submit" disabled={saving}
            className="w-full py-4 bg-gradient-to-r from-teal-500 to-purple-600 text-white font-bold rounded-xl hover:opacity-90 transition disabled:opacity-50 text-sm">
            {saving ? 'Posting…' : `Post ${type === 'need' ? 'Request' : 'Offer'}`}
          </button>
        </form>
      </div>
    </div>
  )
}

export default function NewPost() {
  return <Suspense><PostForm /></Suspense>
}
