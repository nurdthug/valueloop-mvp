import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { revalidatePath } from 'next/cache'

async function resolveFlag(formData: FormData) {
  'use server'
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  const flagId = formData.get('flag_id') as string
  await supabase.from('activity_flags').update({ resolved: true, resolved_by: user.id }).eq('id', flagId)
  revalidatePath('/admin/flags')
}

const FLAG_COLORS: Record<string, string> = {
  spam: 'bg-red-100 text-red-700',
  suspicious_pricing: 'bg-orange-100 text-orange-700',
  repeated_failure: 'bg-yellow-100 text-yellow-700',
  invite_abuse: 'bg-pink-100 text-pink-700',
  poor_ai_match: 'bg-blue-100 text-blue-700',
  user_report: 'bg-green-100 text-green-700',
  unusual_activity: 'bg-gray-100 text-gray-700',
}

export default async function AdminFlagsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !['admin', 'super_admin'].includes(profile.role)) redirect('/dashboard')

  const { data: openFlags } = await supabase
    .from('activity_flags')
    .select('*, profiles!activity_flags_user_id_fkey(display_name)')
    .eq('resolved', false)
    .order('created_at', { ascending: false })

  const { data: resolvedFlags } = await supabase
    .from('activity_flags')
    .select('*, profiles!activity_flags_user_id_fkey(display_name)')
    .eq('resolved', true)
    .order('created_at', { ascending: false })
    .limit(20)

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-100 px-6 py-4 flex items-center gap-4">
        <Link href="/admin" className="text-gray-400 hover:text-gray-600">←</Link>
        <span className="font-semibold text-gray-900">Activity Flags</span>
        {openFlags?.length ? (
          <span className="text-xs bg-red-100 text-red-600 font-bold px-2 py-1 rounded-full">{openFlags.length} open</span>
        ) : null}
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
        <div>
          <h2 className="font-bold text-gray-900 mb-4">Open Flags</h2>
          {!openFlags?.length ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-gray-400">
              <div className="text-3xl mb-2">🎉</div>
              <p className="text-sm">No open flags — community looks healthy.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {openFlags.map(flag => (
                <div key={flag.id} className="bg-white rounded-2xl border border-gray-100 p-5 flex items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${FLAG_COLORS[flag.type] || 'bg-gray-100 text-gray-700'}`}>
                        {flag.type.replace(/_/g, ' ')}
                      </span>
                      <span className="text-sm font-medium text-gray-900">
                        {(flag as any).profiles?.display_name || 'Unknown user'}
                      </span>
                    </div>
                    {flag.description && (
                      <p className="text-sm text-gray-600">{flag.description}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">{new Date(flag.created_at).toLocaleString()}</p>
                  </div>
                  <form action={resolveFlag}>
                    <input type="hidden" name="flag_id" value={flag.id} />
                    <button type="submit" className="px-4 py-2 bg-green-50 text-green-700 text-xs font-semibold rounded-xl hover:bg-green-100 transition">
                      Resolve
                    </button>
                  </form>
                </div>
              ))}
            </div>
          )}
        </div>

        {resolvedFlags && resolvedFlags.length > 0 && (
          <div>
            <h2 className="font-bold text-gray-900 mb-4 text-sm text-gray-500">Recently Resolved</h2>
            <div className="space-y-2">
              {resolvedFlags.map(flag => (
                <div key={flag.id} className="bg-white rounded-xl border border-gray-100 px-5 py-3 flex items-center gap-3 opacity-60">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${FLAG_COLORS[flag.type] || 'bg-gray-100 text-gray-700'}`}>
                    {flag.type.replace(/_/g, ' ')}
                  </span>
                  <span className="text-sm text-gray-600 flex-1">{(flag as any).profiles?.display_name}</span>
                  <span className="text-xs text-gray-400">✓ Resolved</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
