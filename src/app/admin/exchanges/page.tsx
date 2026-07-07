import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function AdminExchangesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !['admin', 'super_admin'].includes(profile.role)) redirect('/dashboard')

  const { data: exchanges } = await supabase
    .from('exchanges')
    .select('*, matches(type, match_score, ai_explanation, match_participants(user_id, profiles(display_name), posts(title, type)))')
    .order('created_at', { ascending: false })
    .limit(100)

  const completed  = exchanges?.filter(e => e.status === 'completed')  ?? []
  const inProgress = exchanges?.filter(e => e.status === 'in_progress') ?? []
  const abandoned  = exchanges?.filter(e => e.status === 'abandoned')   ?? []

  const statusColors: Record<string, string> = {
    completed:   'bg-green-100 text-green-700',
    in_progress: 'bg-blue-100 text-blue-700',
    abandoned:   'bg-gray-100 text-gray-500',
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-100 px-6 py-4 flex items-center gap-4">
        <Link href="/admin" className="text-gray-400 hover:text-gray-600">←</Link>
        <span className="font-semibold text-gray-900">Exchanges</span>
        <span className="text-xs text-gray-400">{exchanges?.length ?? 0} total</span>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-5 text-center">
            <div className="text-3xl font-bold text-green-600">{completed.length}</div>
            <div className="text-xs text-gray-500 mt-1 font-medium">Completed</div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-5 text-center">
            <div className="text-3xl font-bold text-blue-600">{inProgress.length}</div>
            <div className="text-xs text-gray-500 mt-1 font-medium">In Progress</div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-5 text-center">
            <div className="text-3xl font-bold text-gray-400">{abandoned.length}</div>
            <div className="text-xs text-gray-500 mt-1 font-medium">Abandoned</div>
          </div>
        </div>

        {/* Completion rate */}
        {(exchanges?.length ?? 0) > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-gray-900">Completion rate</span>
              <span className="text-sm font-bold text-blue-600">
                {Math.round((completed.length / (exchanges?.length ?? 1)) * 100)}%
              </span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-400 to-blue-500 rounded-full"
                style={{ width: `${Math.round((completed.length / (exchanges?.length ?? 1)) * 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* Exchange list */}
        <div className="space-y-3">
          {!exchanges?.length ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center text-gray-400">
              <div className="text-4xl mb-3">🤝</div>
              <p className="text-sm">No exchanges yet — they appear here once users are matched and chatting.</p>
            </div>
          ) : exchanges.map(exchange => {
            const participants = (exchange as any).matches?.match_participants ?? []
            return (
              <div key={exchange.id} className="bg-white rounded-2xl border border-gray-100 p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${statusColors[exchange.status] ?? 'bg-gray-100 text-gray-500'}`}>
                      {exchange.status.replace('_', ' ')}
                    </span>
                    {exchange.cash_used && (
                      <span className="text-xs bg-yellow-50 text-yellow-600 font-medium px-2 py-1 rounded-full">
                        💳 Cash used
                      </span>
                    )}
                    <span className="text-xs text-gray-400">{(exchange as any).matches?.type} match · {(exchange as any).matches?.match_score}%</span>
                  </div>
                  <span className="text-xs text-gray-400">
                    {exchange.completed_at
                      ? new Date(exchange.completed_at).toLocaleDateString()
                      : new Date(exchange.created_at).toLocaleDateString()}
                  </span>
                </div>

                {(exchange as any).matches?.ai_explanation && (
                  <p className="text-xs text-gray-500 mb-3 italic">{(exchange as any).matches.ai_explanation}</p>
                )}

                <div className="flex gap-2 flex-wrap">
                  {participants.map((p: any) => (
                    <div key={p.user_id} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
                      <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-400 to-green-500 flex items-center justify-center text-white text-xs font-bold">
                        {p.profiles?.display_name?.[0] || '?'}
                      </div>
                      <div>
                        <span className="text-xs font-medium text-gray-800">{p.profiles?.display_name}</span>
                        {p.posts?.title && <span className="text-xs text-gray-400 ml-1">· {p.posts.title}</span>}
                      </div>
                    </div>
                  ))}
                </div>

                {exchange.outcome_notes && (
                  <p className="text-xs text-gray-400 mt-3 border-t border-gray-50 pt-3">{exchange.outcome_notes}</p>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
