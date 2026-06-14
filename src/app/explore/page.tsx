import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import BottomNav from '@/components/BottomNav'
import { CATEGORIES } from '@/types'

const CATEGORY_EMOJI: Record<string, string> = {
  'Design & Creative': 'ð¨',
  'Web & Tech': 'ð»',
  'Marketing': 'ð£',
  'Writing & Content': 'âï¸',
  'Legal': 'âï¸',
  'Finance & Accounting': 'ð°',
  'Tutoring & Education': 'ð',
  'Health & Wellness': 'ð¿',
  'Home & Garden': 'ð¡',
  'Food & Cooking': 'ð³',
  'Transport & Moving': 'ð',
  'Music & Audio': 'ðµ',
  'Photography & Video': 'ð·',
  'Business & Consulting': 'ð¼',
  'Other': 'â¨',
}

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: { category?: string; type?: string }
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const selectedCategory = searchParams.category || ''
  const selectedType = searchParams.type || ''

  let query = supabase
    .from('posts')
    .select('*, profile:profiles(display_name, avatar_url, location, trust_score)')
    .eq('status', 'active')
    .neq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(40)

  if (selectedCategory) query = query.eq('category', selectedCategory)
  if (selectedType) query = query.eq('type', selectedType)

  const { data: posts } = await query

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-lg mx-auto px-4 pt-4 pb-3">
          <h1 className="text-xl font-bold text-gray-900">Explore</h1>
          <p className="text-xs text-gray-400 mt-0.5">Discover what the community needs & offers</p>

          {/* Type filter */}
          <div className="flex gap-2 mt-3">
            <Link
              href="/explore"
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition ${!selectedType ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600'}`}
            >
              All
            </Link>
            <Link
              href={`/explore?type=need${selectedCategory ? `&category=${encodeURIComponent(selectedCategory)}` : ''}`}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition ${selectedType === 'need' ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-600'}`}
            >
              ð Needs
            </Link>
            <Link
              href={`/explore?type=offer${selectedCategory ? `&category=${encodeURIComponent(selectedCategory)}` : ''}`}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition ${selectedType === 'offer' ? 'bg-green-600 text-white' : 'bg-green-50 text-green-600'}`}
            >
              ð Offers
            </Link>
          </div>
        </div>

        {/* Category scroll */}
        <div className="flex gap-2 px-4 pb-3 overflow-x-auto scrollbar-hide">
          <Link
            href={selectedType ? `/explore?type=${selectedType}` : '/explore'}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition ${!selectedCategory ? 'bg-teal-500 text-white' : 'bg-gray-100 text-gray-600'}`}
          >
            All
          </Link>
          {CATEGORIES.map(cat => (
            <Link
              key={cat}
              href={`/explore?category=${encodeURIComponent(cat)}${selectedType ? `&type=${selectedType}` : ''}`}
              className={`flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition whitespace-nowrap ${selectedCategory === cat ? 'bg-teal-500 text-white' : 'bg-gray-100 text-gray-600'}`}
            >
              {CATEGORY_EMOJI[cat]} {cat}
            </Link>
          ))}
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-4 space-y-3">
        {!posts?.length ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">ð</div>
            <p className="font-semibold text-gray-700">Nothing here yet</p>
            <p className="text-sm text-gray-400 mt-1">Be the first to post in this category</p>
            <Link href="/post/new"
              className="inline-block mt-5 px-6 py-3 bg-gradient-to-r from-teal-500 to-purple-600 text-white text-sm font-bold rounded-2xl">
              Create a Post
            </Link>
          </div>
        ) : posts.map(post => {
          const profile = post.profile as any
          const initials = profile?.display_name?.slice(0, 2).toUpperCase() || '??'
          const emoji = CATEGORY_EMOJI[post.category] || 'â¨'
          const isNeed = post.type === 'need'
          return (
            <div key={post.id}
              className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm hover:border-teal-200 transition-all">
              {/* Header row */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-gray-800 truncate">{profile?.display_name || 'Anonymous'}</p>
                    {profile?.location && (
                      <p className="text-xs text-gray-400 truncate">ð {profile.location}</p>
                    )}
                  </div>
                </div>
                <span className={`flex-shrink-0 text-xs font-bold px-2.5 py-1 rounded-full ${isNeed ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'}`}>
                  {isNeed ? 'ð NEED' : 'ð OFFER'}
                </span>
              </div>

              {/* Content */}
              <div className="mt-3">
                <h3 className="font-semibold text-gray-900 text-sm leading-snug">{post.title}</h3>
                <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">{post.description}</p>
              </div>

              {/* Footer row */}
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
                <span className="text-xs text-gray-400 flex items-center gap-1">
                  {emoji} {post.category}
                </span>
                <div className="flex items-center gap-2">
                  {post.estimated_value && (
                    <span className="text-xs font-semibold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full">
                      ~${post.estimated_value}
                    </span>
                  )}
                  {post.remote_ok && (
                    <span className="text-xs text-purple-500 bg-purple-50 px-2 py-0.5 rounded-full">Remote â</span>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <BottomNav />
    </div>
  )
}
