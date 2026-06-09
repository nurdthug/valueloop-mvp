import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function AdminUsersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !['admin', 'super_admin'].includes(profile.role)) redirect('/dashboard')

  const { data: users } = await supabase
    .from('profiles')
    .select('*, invite_links(signup_count)')
    .order('created_at', { ascending: false })
    .limit(100)

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-100 px-6 py-4 flex items-center gap-4">
        <Link href="/admin" className="text-gray-400 hover:text-gray-600">←</Link>
        <span className="font-semibold text-gray-900">Users</span>
        <span className="text-xs text-gray-400">{users?.length ?? 0} total</span>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-xs text-gray-500 uppercase tracking-wide">
                <th className="text-left px-5 py-3">User</th>
                <th className="text-left px-5 py-3">Role</th>
                <th className="text-left px-5 py-3">Trust</th>
                <th className="text-left px-5 py-3">Invites sent</th>
                <th className="text-left px-5 py-3">Onboarded</th>
                <th className="text-left px-5 py-3">Joined</th>
              </tr>
            </thead>
            <tbody>
              {users?.map(u => (
                <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {u.display_name?.[0] || '?'}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{u.display_name}</div>
                        {u.location && <div className="text-xs text-gray-400">📍 {u.location}</div>}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                      u.role === 'super_admin' ? 'bg-purple-100 text-purple-700' :
                      u.role === 'admin' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>{u.role}</span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-teal-400 rounded-full" style={{ width: `${u.trust_score}%` }} />
                      </div>
                      <span className="text-xs text-gray-500">{u.trust_score}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-gray-600">
                    {(u.invite_links as any[])?.[0]?.signup_count ?? 0}
                  </td>
                  <td className="px-5 py-3">
                    {u.onboarding_complete
                      ? <span className="text-xs text-green-600">✓ Yes</span>
                      : <span className="text-xs text-gray-400">Pending</span>}
                  </td>
                  <td className="px-5 py-3 text-gray-400 text-xs">
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
