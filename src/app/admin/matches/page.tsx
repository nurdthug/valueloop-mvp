import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { revalidatePath } from 'next/cache'

async function reviewMatch(formData: FormData) {
  'use server'
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const matchId = formData.get('match_id') as string
  const action = formData.get('action') as string
  const notes = formData.get('notes') as string

  await supabase.from('matches').update({
    status: action === 'approve' ? 'approved' : 'rejected',
    admin_notes: notes || null,
    reviewed_by: user.id,
    reviewed_at: new Date().toISOString(),
  }).eq('id', matchId)

  revalidatePath('/admin/matches')
}

export default async function AdminMatchesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !['admin', 'super_admin'].includes(profile.role)) redirect('/dashboard')

  const { data: pending } = await supabase
    .from('matches')
    .select('*, match_participants(*, profiles(display_name, location), posts(title, type, category, estimated_value, description))')
    .eq('status', 'pending_review')
    .order('created_at', { ascending: true })

  const { data: recent } = await supabase
    .from('matches')
    .select('*, match_participants(*, profiles(display_name), posts(title, type))')
    .in('status', ['approved', 'rejected'])
    .order('reviewed_at', { ascending: false })
    .limit(10)

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-100 px-6 py-4 flex items-center gap-4">
        <Link href="/admin" className="text-gray-400 hover:text-gray-600">←</Link>
        <span className="font-semibold text-gray-900">Match Review</span>
        {pending?.length ? (
          <span className="text-xs bg-orange-100 text-orange-600 font-bold px-2 py-1 rounded-full">{pending.length} pending</span>
        ) : null}
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
        {/* Pending */}
        <div>
          <h2 className="font-bold text-gray-900 mb-4">Pending Review</h2>
          {!pending?.length ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-gray-400">
              <div className="text-3xl mb-2">✅</div>
              <p className="text-sm">All caught up — no matches waiting for review.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pending.map(match => {
                const participants = match.match_participants || []
                return (
                  <div key={match.id} className="bg-white rounded-2xl border border-gray-100 p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                          {match.type === 'direct' ? '⚡ Direct' : '🔄 Loop'}
                        </span>
                        <span className="ml-2 text-xs text-gray-400">{match.match_score}% match score</span>
                      </div>
                      <span className="text-xs text-gray-400">{new Date(match.created_at).toLocaleDateString()}</span>
                    </div>

                    <div className="bg-blue-50 rounded-xl px-4 py-3 mb-4">
                      <p className="text-sm text-blue-800 font-medium">AI says:</p>
                      <p className="text-sm text-blue-700 mt-1">{match.ai_explanation}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                      {participants.map((p: any) => (
                        <div key={p.id} className="bg-gray-50 rounded-xl p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-green-500 flex items-center justify-center text-white text-xs font-bold">
                              {p.profiles?.display_name?.[0] || '?'}
                            </div>
                            <span className="text-sm font-medium text-gray-900">{p.profiles?.display_name}</span>
                            {p.profiles?.location && <span className="text-xs text-gray-400">📍 {p.profiles.location}</span>}
                          </div>
                          {p.posts && (
                            <div>
                              <span className={`text-xs font-bold px-2 py-0.5 rounded-full mr-2 ${p.posts.type === 'offer' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                                {p.posts.type.toUpperCase()}
                              </span>
                              <span className="text-sm text-gray-800">{p.posts.title}</span>
                              <p className="text-xs text-gray-500 mt-1 line-clamp-2">{p.posts.description}</p>
                              <div className="flex items-center gap-3 mt-2">
                                <span className="text-xs text-gray-400">{p.posts.category}</span>
                                {p.posts.estimated_value && (
                                  <span className="text-xs text-gray-600 font-medium">${p.posts.estimated_value}</span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    <form action={reviewMatch} className="border-t border-gray-100 pt-4">
                      <input type="hidden" name="match_id" value={match.id} />
                      <textarea name="notes" placeholder="Admin notes (optional)…" rows={2}
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none mb-3" />
                      <div className="flex gap-3">
                        <button type="submit" name="action" value="approve"
                          className="flex-1 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-xl text-sm hover:opacity-90 transition">
                          ✅ Approve — Connect Users
                        </button>
                        <button type="submit" name="action" value="reject"
                          className="flex-1 py-2.5 bg-gray-100 text-gray-700 font-semibold rounded-xl text-sm hover:bg-gray-200 transition">
                          ✗ Reject
                        </button>
                      </div>
                    </form>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Recent decisions */}
        {recent && recent.length > 0 && (
          <div>
            <h2 className="font-bold text-gray-900 mb-4">Recent Decisions</h2>
            <div className="space-y-2">
              {recent.map(match => (
                <div key={match.id} className="bg-white rounded-xl border border-gray-100 px-5 py-4 flex items-center gap-4">
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${match.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {match.status === 'approved' ? 'Approved' : 'Rejected'}
                  </span>
                  <span className="text-sm text-gray-600 flex-1">
                    {(match.match_participants as any[])?.map((p: any) => p.profiles?.display_name).filter(Boolean).join(' ↔ ')}
                  </span>
                  <span className="text-xs text-gray-400">{match.match_score}%</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
