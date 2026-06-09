import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function Dashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (profile && !profile.onboarding_complete) redirect('/onboarding')

  const { data: myPosts } = await supabase.from('posts').select('*').eq('user_id', user.id).eq('status', 'active').order('created_at', { ascending: false }).limit(5)
  const { data: myMatches } = await supabase.from('matches').select('*, match_participants(*)').eq('status', 'approved').limit(5)

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
        <span className="font-bold text-gray-900">ValueLoop</span>
        <div className="flex gap-3 items-center">
          <Link href="/matches" className="text-sm text-gray-600 hover:text-gray-900">Matches</Link>
          <Link href="/post/new" className="px-4 py-2 bg-gradient-to-r from-teal-500 to-purple-600 text-white text-sm font-semibold rounded-lg">+ Post</Link>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Hey, {profile?.display_name || 'there'} 👋</h1>
          <p className="text-gray-500 text-sm mt-1">Ready to exchange some value today?</p>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-2 gap-3">
          <Link href="/post/new?type=need" className="bg-white border border-gray-100 rounded-2xl p-5 hover:border-teal-300 transition">
            <div className="text-2xl mb-2">📋</div>
            <div className="font-semibold text-gray-900 text-sm">I need something</div>
            <div className="text-gray-400 text-xs mt-1">Post a request</div>
          </Link>
          <Link href="/post/new?type=offer" className="bg-white border border-gray-100 rounded-2xl p-5 hover:border-purple-300 transition">
            <div className="text-2xl mb-2">🎁</div>
            <div className="font-semibold text-gray-900 text-sm">I can offer something</div>
            <div className="text-gray-400 text-xs mt-1">Post what you have</div>
          </Link>
        </div>

        {/* My posts */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-900">My Active Posts</h2>
          </div>
          {!myPosts?.length ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center text-gray-400 text-sm">
              No active posts yet. <Link href="/post/new" className="text-teal-600">Create your first one →</Link>
            </div>
          ) : (
            <div className="space-y-2">
              {myPosts.map(post => (
                <div key={post.id} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3">
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${post.type === 'need' ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'}`}>
                    {post.type.toUpperCase()}
                  </span>
                  <span className="text-sm text-gray-900 flex-1">{post.title}</span>
                  <span className="text-xs text-gray-400">{post.category}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Invite link */}
        <div className="bg-gradient-to-r from-teal-50 to-purple-50 border border-teal-100 rounded-2xl p-5">
          <div className="font-semibold text-gray-900 text-sm mb-1">🔗 Your invite link</div>
          <div className="text-xs text-gray-500 mb-3">Share this to grow the community</div>
          <div className="bg-white rounded-lg px-3 py-2 text-xs text-gray-600 font-mono break-all">
            {typeof window !== 'undefined' ? `${window.location.origin}/join/${profile?.invite_code}` : `https://valueloop.app/join/${profile?.invite_code}`}
          </div>
        </div>
      </div>
    </div>
  )
}
