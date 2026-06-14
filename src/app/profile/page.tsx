'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import BottomNav from '@/components/BottomNav'
import VLLogo from '@/components/VLLogo'

export default function ProfilePage() {
  const router = useRouter()
  const supabase = createClient()
  const [profile, setProfile] = useState<any>(null)
  const [stats, setStats] = useState({ posts: 0, exchanges: 0 })
  const [copied, setCopied] = useState(false)
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState('')
  const [bio, setBio] = useState('')
  const [location, setLocation] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data: p } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (p) {
        setProfile(p)
        setName(p.display_name || '')
        setBio(p.bio || '')
        setLocation(p.location || '')
      }
      const { count: postCount } = await supabase.from('posts').select('*', { count: 'exact', head: true }).eq('user_id', user.id)
      const { count: exchCount } = await supabase.from('exchanges').select('*', { count: 'exact', head: true }).eq('status', 'completed')
      setStats({ posts: postCount || 0, exchanges: exchCount || 0 })
    }
    load()
  }, [])

  async function saveProfile() {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from('profiles').update({
      display_name: name,
      bio,
      location,
      updated_at: new Date().toISOString(),
    }).eq('id', user.id).select().single()
    if (data) setProfile(data)
    setSaving(false)
    setEditing(false)
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  function copyInvite() {
    const link = `${window.location.origin}/join/${profile?.invite_code}`
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const initials = profile?.display_name?.slice(0, 2).toUpperCase() || '??'
  const inviteLink = profile ? `valueloop.app/join/${profile.invite_code}` : ''

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
        <VLLogo size={28} />
        <button onClick={handleSignOut} className="text-xs text-gray-400 hover:text-gray-600 transition">
          Sign out
        </button>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
        {/* Avatar + name */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center shadow-sm">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-teal-400 to-purple-500 flex items-center justify-center text-white text-2xl font-bold mx-auto mb-3">
            {initials}
          </div>
          {!editing ? (
            <>
              <h1 className="text-xl font-bold text-gray-900">{profile?.display_name || 'ValueLooper'}</h1>
              {profile?.bio && <p className="text-sm text-gray-500 mt-1 leading-relaxed">{profile.bio}</p>}
              {profile?.location && <p className="text-xs text-gray-400 mt-1">ð {profile.location}</p>}
              <button onClick={() => setEditing(true)}
                className="mt-4 px-5 py-2 text-sm font-semibold text-teal-600 border border-teal-200 rounded-xl hover:bg-teal-50 transition">
                Edit Profile
              </button>
            </>
          ) : (
            <div className="space-y-3 text-left mt-2">
              <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Display name"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
              <textarea value={bio} onChange={e => setBio(e.target.value)} rows={2} placeholder="Short bio"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 resize-none" />
              <input type="text" value={location} onChange={e => setLocation(e.target.value)} placeholder="City / location"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
              <div className="flex gap-2">
                <button onClick={() => setEditing(false)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium">Cancel</button>
                <button onClick={saveProfile} disabled={saving}
                  className="flex-1 py-2.5 bg-gradient-to-r from-teal-500 to-purple-600 text-white rounded-xl text-sm font-semibold disabled:opacity-50">
                  {saving ? 'Savingâ¦' : 'Save'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Posts', value: stats.posts, emoji: 'ð' },
            { label: 'Exchanges', value: stats.exchanges, emoji: 'ð¤' },
            { label: 'Trust Score', value: profile?.trust_score ?? 0, emoji: 'â­' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-4 text-center shadow-sm">
              <div className="text-xl mb-1">{s.emoji}</div>
              <div className="text-xl font-bold text-gray-900">{s.value}</div>
              <div className="text-xs text-gray-400 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Invite link */}
        <div className="bg-gradient-to-br from-teal-500 to-purple-600 rounded-2xl p-5 text-white shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">ð</span>
            <span className="font-semibold text-sm">Your Invite Link</span>
          </div>
          <p className="text-xs text-white/70 mb-3">Share this with anyone to invite them to ValueLoop</p>
          <div className="bg-white/20 backdrop-blur rounded-xl px-3 py-2 flex items-center justify-between gap-3">
            <span className="text-xs font-mono text-white/90 truncate">{inviteLink}</span>
            <button onClick={copyInvite}
              className="flex-shrink-0 bg-white text-teal-600 text-xs font-bold px-3 py-1.5 rounded-lg transition active:scale-95">
              {copied ? 'â Copied!' : 'Copy'}
            </button>
          </div>
        </div>

        {/* Member since */}
        {profile?.created_at && (
          <p className="text-center text-xs text-gray-400">
            Member since {new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </p>
        )}
      </div>

      <BottomNav />
    </div>
  )
}
