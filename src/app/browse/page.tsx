import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import BottomNav from '@/components/BottomNav'
import { CATEGORIES } from '@/types'

export const dynamic = 'force-dynamic'

const CATEGORY_EMOJI: Record<string, string> = {
  'Design & Creative': '🎨',
  'Web & Tech': '💻',
  'Marketing': '📣',
  'Writing & Content': '✍️',
  'Legal': '⚖️',
  'Finance & Accounting': '💰',
  'Tutoring & Education': '📚',
  'Health & Wellness': '🌿',
  'Home & Garden': '🏡',
  'Food & Cooking': '🍳',
  'Transport & Moving': '🚚',
  'Music & Audio': '🎵',
  'Photography & Video': '📷',
  'Business & Consulting': '💼',
  'Other': '✨',
}

// Strip characters that would break a PostgREST or()/ilike filter.
function sanitize(q: string) {
  return q.replace(/[(),%*]/g, ' ').trim().slice(0, 80)
}

function qs(params: Record<string, string | undefined>) {
  const p = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => { if (v) p.set(k, v) })
  const s = p.toString()
  return s ? `?${s}` : ''
}

export default async function BrowsePage({
  searchParams,
}: {
  searchParams: { category?: string; type?: string; q?: string }
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const selectedCategory = searchParams.category || ''
  const selectedType = searchParams.type || ''
  const search = sanitize(searchParams.q || '')

  let query = supabase
    .from('posts')
    .select('*, profile:profiles(display_name, avatar_url, location, trust_score)')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(60)

  if (selectedCategory) query = query.eq('category', selectedCategory)
  if (selectedType) query = query.eq('type', selectedType)
  if (search) query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`)

  const { data: posts } = await query

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-lg mx-auto px-4 pt-4 pb-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Browse ValueLoop</h1>
              <p className="text-xs text-gray-400 mt-0.5">See what people need & offer near you</p>
            </div>
            {!user && (
              <div className="flex gap-2">
                <Link href="/login" className="text-xs font-semibold text-gray-600 px-3 py-1.5 rounded-full bg-gray-100">
                  Sign in
                </Link>
                <Link href="/signup" className="text-xs font-bold text-white px-3 py-1.5 rounded-full bg-gradient-to-r from-blue-500 to-green-600">
                  Sign up
                </Link>
              </div>
            )}
          </div>

          {/* Search */}
          <form action="/browse" method="get" className="mt-3">
            {selectedCategory && <input type="hidden" name="category" value={selectedCategory} />}
            {selectedType && <input type="hidden" name="type" value={selectedType} />}
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
              <input
                name="q"
                defaultValue={search}
                placeholder="Search needs & offers…"
                className="w-full pl-9 pr-20 py-2.5 rounded-full bg-gray-100 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <button type="submit"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 text-xs font-bold text-white px-3 py-1.5 rounded-full bg-blue-500">
                Search
              </button>
            </div>
          </form>

          {/* Type filter */}
          <div className="flex gap-2 mt-3">
            <Link href={`/browse${qs({ category: selectedCategory, q: search })}`}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition ${!selectedType ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600'}`}>
              All
            </Link>
            <Link href={`/browse${qs({ type: 'need', category: selectedCategory, q: search })}`}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition ${selectedType === 'need' ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-600'}`}>
              📋 Needs
            </Link>
            <Link href={`/browse${qs({ type: 'offer', category: selectedCategory, q: search })}`}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition ${selectedType === 'offer' ? 'bg-green-600 text-white' : 'bg-green-50 text-green-600'}`}>
              🎁 Offers
            </Link>
          </div>
        </div>

        {/* Category scroll */}
        <div className="flex gap-2 px-4 pb-3 overflow-x-auto scrollbar-hide">
          <Link href={`/browse${qs({ type: selectedType, q: search })}`}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition ${!selectedCategory ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'}`}>
            All
          </Link>
          {CATEGORIES.map(cat => (
            <Link key={cat} href={`/browse${qs({ category: cat, type: selectedType, q: search })}`}
              className={`flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition whitespace-nowrap ${selectedCategory === cat ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'}`}>
              {CATEGORY_EMOJI[cat]} {cat}
            </Link>
          ))}
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-4 space-y-3">
        {search && (
          <p className="text-xs text-gray-400 px-1">
            {posts?.length || 0} result{posts?.length === 1 ? '' : 's'} for “{search}”
          </p>
        )}
        {!posts?.length ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">🔍</div>
            <p className="font-semibold text-gray-700">Nothing here yet</p>
            <p className="text-sm text-gray-400 mt-1">
              {search ? 'Try a different search or category' : 'Be the first to post in this category'}
            </p>
            <Link href={user ? '/post/new' : '/signup'}
              className="inline-block mt-5 px-6 py-3 bg-gradient-to-r from-blue-500 to-green-600 text-white text-sm font-bold rounded-2xl">
              {user ? 'Create a Post' : 'Sign up to post'}
            </Link>
          </div>
        ) : posts.map(post => {
          const profile = post.profile as any
          const initials = profile?.display_name?.slice(0, 2).toUpperCase() || '??'
          const emoji = CATEGORY_EMOJI[post.category] || '✨'
          const isNeed = post.type === 'need'
          return (
            <div key={post.id}
              className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm hover:border-blue-200 transition-all">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-400 to-green-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-semibold text-gray-800 truncate">{profile?.display_name || 'Anonymous'}</p>
                      {typeof profile?.trust_score === 'number' && (
                        <span className="flex-shrink-0 text-[10px] font-semibold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full">
                          ⭐ {profile.trust_score}
                        </span>
                      )}
                    </div>
                    {profile?.location && (
                      <p className="text-xs text-gray-400 truncate">📍 {profile.location}</p>
                    )}
                  </div>
                </div>
                <span className={`flex-shrink-0 text-xs font-bold px-2.5 py-1 rounded-full ${isNeed ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'}`}>
                  {isNeed ? '📋 NEED' : '🎁 OFFER'}
                </span>
              </div>

              <div className="mt-3">
                <h3 className="font-semibold text-gray-900 text-sm leading-snug">{post.title}</h3>
                <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">{post.description}</p>
              </div>

              <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
                <span className="text-xs text-gray-400 flex items-center gap-1">
                  {emoji} {post.category}
                </span>
                <div className="flex items-center gap-2">
                  {post.estimated_value && (
                    <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                      ~${post.estimated_value}
                    </span>
                  )}
                  {post.remote_ok && (
                    <span className="text-xs text-green-500 bg-green-50 px-2 py-0.5 rounded-full">Remote ✓</span>
                  )}
                </div>
              </div>

              {!user && (
                <Link href="/signup"
                  className="mt-3 block text-center text-xs font-bold text-blue-600 bg-blue-50 rounded-xl py-2">
                  Sign up to connect →
                </Link>
              )}
            </div>
          )
        })}
      </div>

      {/* Public CTA footer for logged-out visitors */}
      {!user && (
        <div className="fixed bottom-0 inset-x-0 bg-white border-t border-gray-100 z-40 safe-area-pb">
          <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
            <p className="text-xs text-gray-500 flex-1">Have something to offer or need something?</p>
            <Link href="/signup"
              className="text-sm font-bold text-white px-4 py-2 rounded-full bg-gradient-to-r from-blue-500 to-green-600 whitespace-nowrap">
              Get started
            </Link>
          </div>
        </div>
      )}

      {user && <BottomNav />}
    </div>
  )
}
