import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function MatchesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: matches } = await supabase
    .from('matches')
    .select('*, match_participants(*, profiles(*), posts(*))')
    .eq('status', 'approved')
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
        <Link href="/dashboard" className="text-gray-400">←</Link>
        <span className="font-semibold text-gray-900">Your Matches</span>
        <div />
      </nav>
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-4">
        {!matches?.length ? (
          <div className="text-center py-20 text-gray-400">
            <div className="text-4xl mb-3">🔍</div>
            <p className="font-medium">No matches yet</p>
            <p className="text-sm mt-1">Post what you need and offer — our AI will find your matches</p>
            <Link href="/post/new" className="inline-block mt-4 px-6 py-3 bg-gradient-to-r from-teal-500 to-purple-600 text-white text-sm font-semibold rounded-xl">
              Create a Post
            </Link>
          </div>
        ) : matches.map(match => {
          const others = match.match_participants?.filter((p: any) => p.user_id !== user.id) || []
          return (
            <Link key={match.id} href={`/chat?match=${match.id}`}
              className="block bg-white rounded-2xl border border-gray-100 p-5 hover:border-teal-200 transition">
              <div className="flex items-center justify-between mb-3">
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${match.type === 'direct' ? 'bg-teal-50 text-teal-600' : 'bg-purple-50 text-purple-600'}`}>
                  {match.type === 'direct' ? '⚡ Direct Match' : '🔄 Loop Match'}
                </span>
                <span className="text-xs text-gray-400">{match.match_score}% match</span>
              </div>
              <p className="text-sm text-gray-600 mb-3">{match.ai_explanation}</p>
              <div className="flex gap-2">
                {others.slice(0,3).map((p: any) => (
                  <div key={p.id} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-teal-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                      {p.profiles?.display_name?.[0] || '?'}
                    </div>
                    <span className="text-xs text-gray-700">{p.profiles?.display_name}</span>
                  </div>
                ))}
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
