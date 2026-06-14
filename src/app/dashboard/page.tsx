import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import BottomNav from '@/components/BottomNav'
import VLLogo from '@/components/VLLogo'
import CopyInvite from '@/components/CopyInvite'

const CATEGORY_EMOJI: Record<string, string> = {
  'Design & Creative': 'ð¨', 'Web & Tech': 'ð»', 'Marketing': 'ð£',
  'Writing & Content': 'âï¸', 'Legal': 'âï¸', 'Finance & Accounting': 'ð°',
  'Tutoring & Education': 'ð', 'Health & Wellness': 'ð¿', 'Home & Garden': 'ð¡',
  'Food & Cooking': 'ð³', 'Transport & Moving': 'ð', 'Music & Audio': 'ðµ',
  'Photography & Video': 'ð·', 'Business & Consulting': 'ð¼', 'Other': 'â¨',
}

export default async function Dashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (profile && !profile.onboarding_complete) redirect('/onboarding')

  const { data: myPosts } = await supabase.from('posts').select('*').eq('user_id', user.id).eq('status', 'active').order('created_at', { ascending: false }).limit(10)
  const { data: myMatches } = await supabase.from('matches').select('*').eq('status', 'approved').limit(3)

  const firstName = profile?.display_name?.split(' ')[0] || 'there'

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Top nav */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <VLLogo size={30} />
          <Link href="/profile">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-400 to-purple-500 flex items-center justify-center text-white text-sm font-bold">
              {profile?.display_name?.slice(0, 2).toUpperCase() || '??'}
            </div>
          </Link>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-5 space-y-5">
        {/* Greeting */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Hey, {firstName} ð</h1>
          <p className="text-sm text-gray-400 mt-0.5">Ready to exchange some value?</p>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-2 gap-3">
          <Link href="/post/new?type=need"
            className="group bg-white border border-gray-100 rounded-2xl p-5 hover:border-blue-300 hover:shadow-md transition-all active:scale-[0.98] shadow-sm">
            <div className="text-3xl mb-3">ð</div>
            <div className="font-bold text-gray-900 text-sm">I need something</div>
            <div className="text-gray-400 text-xs mt-1">Post a request</div>
            <div className="mt-3 text-xs text-blue-500 font-semibold">Post need â</div>
          </Link>
          <Link href="/post/new?type=offer"
            className="group bg-white border border-gray-100 rounded-2xl p-5 hover:border-purple-300 hover:shadow-md transition-all active:scale-[0.98] shadow-sm">
            <div className="text-3xl mb-3">ð</div>
            <div className="font-bold text-gray-900 text-sm">I can offer</div>
            <div className="text-gray-400 text-xs mt-1">Share what you have</div>
            <div className="mt-3 text-xs text-purple-500 font-semibold">Post offer â</div>
          </Link>
        </div>

        {/* Stats strip */}
        <div className="flex gap-3">
          <div className="flex-1 bg-white rounded-2xl border border-gray-100 px-4 py-3 shadow-sm text-center">
            <div className="text-xl font-bold text-gray-900">{myPosts?.length || 0}</div>
            <div className="text-xs text-gray-400 mt-0.5">Active Posts</div>
          </div>
          <div className="flex-1 bg-white rounded-2xl border border-gray-100 px-4 py-3 shadow-sm text-center">
            <div className="text-xl font-bold text-gray-900">{myMatches?.length || 0}</div>
            <div className="text-xs text-gray-400 mt-0.5">Matches</div>
          </div>
          <div className="flex-1 bg-white rounded-2xl border border-gray-100 px-4 py-3 shadow-sm text-center">
            <div className="text-xl font-bold text-gray-900">{profile?.trust_score ?? 0}</div>
            <div className="text-xs text-gray-400 mt-0.5">Trust Score</div>
          </div>
        </div>

        {/* Matches preview */}
        {myMatches && myMatches.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-gray-900">Recent Matches</h2>
              <Link href="/matches" className="text-xs text-teal-600 font-semibold">See all â</Link>
            </div>
            <div className="space-y-2">
              {myMatches.map((m: any) => (
                <Link key={m.id} href={`/chat?match=${m.id}`}
                  className="block bg-white rounded-2xl border border-gray-100 p-4 shadow-sm hover:border-teal-200 transition">
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${m.type === 'direct' ? 'bg-teal-50 text-teal-600' : 'bg-purple-50 text-purple-600'}`}>
                      {m.type === 'direct' ? 'â¡ Direct' : 'ð Loop'}
                    </span>
                    <span className="text-xs text-gray-400">{m.match_score}% match</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-2 line-clamp-2">{m.ai_explanation}</p>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* My posts */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-gray-900">My Posts</h2>
            <Link href="/post/new" className="text-xs text-teal-600 font-semibold">+ New</Link>
          </div>
          {!myPosts?.length ? (
            <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-8 text-center shadow-sm">
              <div className="text-4xl mb-3">â¨</div>
              <p className="font-semibold text-gray-700 text-sm">No posts yet</p>
              <p className="text-xs text-gray-400 mt-1 mb-4">Post what you need or can offer to start exchanging</p>
              <Link href="/post/new"
                className="inline-block px-5 py-2.5 bg-gradient-to-r from-teal-500 to-purple-600 text-white text-xs font-bold rounded-xl">
                Create First Post
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {myPosts.map((post: any) => (
                <div key={post.id} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3 shadow-sm">
                  <span className="text-xl">{CATEGORY_EMOJI[post.category] || 'â¨'}</span>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-semibold text-gray-900 truncate block">{post.title}</span>
                    <span className="text-xs text-gray-400">{post.category}</span>
                  </div>
                  <span className={`text-xs font-bold px-2 py-1 rounded-full flex-shrink-0 ${post.type === 'need' ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'}`}>
                    {post.type === 'need' ? 'NEED' : 'OFFER'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Explore CTA */}
        <Link href="/explore"
          className="block bg-gradient-to-r from-teal-500 to-purple-600 rounded-2xl p-5 text-white shadow-lg active:scale-[0.98] transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold text-sm mb-0.5">Explore the Community</p>
              <p className="text-xs text-white/70">See what others need & offer</p>
            </div>
            <span className="text-3xl">ð</span>
          </div>
        </Link>

        {/* Invite */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">ð</span>
            <span className="font-bold text-gray-900 text-sm">Invite Friends</span>
          </div>
          <p className="text-xs text-gray-400 mb-3">Grow your exchange network</p>
          <CopyInvite inviteCode={profile?.invite_code || ''} />
        </div>
      </div>

      <BottomNav />
    </div>
  )
}
