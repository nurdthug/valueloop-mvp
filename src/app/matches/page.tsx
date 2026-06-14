import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import BottomNav from '@/components/BottomNav'

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
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-lg mx-auto px-4 py-4">
          <h1 className="text-xl font-bold text-gray-900">Matches</h1>
          <p className="text-xs text-gray-400 mt-0.5">AI-suggested exchange opportunities</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-4 space-y-3">
        {!matches?.length ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">ð¤</div>
            <p className="font-bold text-gray-700">No matches yet</p>
            <p className="text-sm text-gray-400 mt-2 leading-relaxed max-w-xs mx-auto">
              Post what you need and what you offer â our AI will suggest exchange matches
            </p>
            <Link href="/post/new"
              className="inline-block mt-5 px-6 py-3 bg-gradient-to-r from-teal-500 to-purple-600 text-white text-sm font-bold rounded-2xl shadow-lg">
              Create a Post
            </Link>
          </div>
        ) : matches.map((match: any) => {
          const others = match.match_participants?.filter((p: any) => p.user_id !== user.id) || []
          const isDirect = match.type === 'direct'
          return (
            <Link key={match.id} href={`/chat?match=${match.id}`}
              className="block bg-white rounded-2xl border border-gray-100 p-5 hover:border-teal-200 hover:shadow-md transition-all active:scale-[0.98] shadow-sm">
              {/* Match type + score */}
              <div className="flex items-center justify-between mb-3">
                <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${isDirect ? 'bg-teal-50 text-teal-600' : 'bg-purple-50 text-purple-600'}`}>
                  {isDirect ? 'â¡ Direct Match' : 'ð Loop Match'}
                </span>
                <div className="flex items-center gap-1.5">
                  <div className="h-1.5 w-16 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${isDirect ? 'bg-teal-500' : 'bg-purple-500'}`}
                      style={{ width: `${match.match_score}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-gray-500">{match.match_score}%</span>
                </div>
              </div>

              {/* AI explanation */}
              <p className="text-sm text-gray-600 leading-relaxed mb-4">{match.ai_explanation}</p>

              {/* Participants */}
              {others.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  {others.slice(0, 3).map((p: any) => (
                    <div key={p.id} className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2 border border-gray-100">
                      <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-teal-400 to-purple-500 flex items-center justify-center text-white text-[10px] font-bold">
                        {p.profiles?.display_name?.slice(0, 2).toUpperCase() || '??'}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-800">{p.profiles?.display_name}</p>
                        {p.posts?.title && <p className="text-[10px] text-gray-400 truncate max-w-[120px]">{p.posts.title}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-1 mt-3 pt-3 border-t border-gray-50">
                <span className="text-xs text-teal-600 font-semibold">Open chat â</span>
              </div>
            </Link>
          )
        })}
      </div>

      <BottomNav />
    </div>
  )
}
