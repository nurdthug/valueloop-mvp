import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function AdminDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !['admin', 'super_admin'].includes(profile.role)) redirect('/dashboard')

  const [
    { count: userCount },
    { count: postCount },
    { count: pendingMatchCount },
    { count: flagCount },
    { count: completedCount },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('posts').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('matches').select('*', { count: 'exact', head: true }).eq('status', 'pending_review'),
    supabase.from('activity_flags').select('*', { count: 'exact', head: true }).eq('resolved', false),
    supabase.from('exchanges').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
  ])

  const stats = [
    { label: 'Total Users', value: userCount ?? 0, emoji: '👥', href: '/admin/users' },
    { label: 'Active Posts', value: postCount ?? 0, emoji: '📋', href: '/admin/posts' },
    { label: 'Pending Matches', value: pendingMatchCount ?? 0, emoji: '⏳', href: '/admin/matches', highlight: (pendingMatchCount ?? 0) > 0 },
    { label: 'Open Flags', value: flagCount ?? 0, emoji: '🚩', href: '/admin/flags', highlight: (flagCount ?? 0) > 0 },
    { label: 'Completed Exchanges', value: completedCount ?? 0, emoji: '✅', href: '/admin/exchanges' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="font-bold text-gray-900">ValueLoop</span>
          <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full font-medium">Admin</span>
        </div>
        <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-800">← Back to app</Link>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
        <p className="text-gray-500 text-sm mb-8">Monitor activity, review matches, and manage the ValueLoop community.</p>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-10">
          {stats.map(stat => (
            <Link key={stat.label} href={stat.href}
              className={`bg-white rounded-2xl border p-5 hover:shadow-sm transition ${stat.highlight ? 'border-orange-200 bg-orange-50' : 'border-gray-100'}`}>
              <div className="text-2xl mb-2">{stat.emoji}</div>
              <div className={`text-2xl font-bold ${stat.highlight ? 'text-orange-600' : 'text-gray-900'}`}>{stat.value}</div>
              <div className="text-xs text-gray-500 mt-1">{stat.label}</div>
            </Link>
          ))}
        </div>

        {/* Quick nav */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/admin/matches"
            className="bg-white rounded-2xl border border-gray-100 p-6 hover:border-teal-200 transition">
            <div className="text-2xl mb-3">🤝</div>
            <div className="font-semibold text-gray-900">Review Matches</div>
            <div className="text-sm text-gray-500 mt-1">Approve or reject AI-suggested matches before users are connected</div>
            {(pendingMatchCount ?? 0) > 0 && (
              <div className="mt-3 text-xs font-bold text-orange-600">{pendingMatchCount} awaiting review</div>
            )}
          </Link>
          <Link href="/admin/users"
            className="bg-white rounded-2xl border border-gray-100 p-6 hover:border-teal-200 transition">
            <div className="text-2xl mb-3">👥</div>
            <div className="font-semibold text-gray-900">Users</div>
            <div className="text-sm text-gray-500 mt-1">View user accounts, trust scores, and invite activity</div>
          </Link>
          <Link href="/admin/flags"
            className="bg-white rounded-2xl border border-gray-100 p-6 hover:border-teal-200 transition">
            <div className="text-2xl mb-3">🚩</div>
            <div className="font-semibold text-gray-900">Activity Flags</div>
            <div className="text-sm text-gray-500 mt-1">Investigate unusual behavior, spam, and poor AI suggestions</div>
            {(flagCount ?? 0) > 0 && (
              <div className="mt-3 text-xs font-bold text-red-600">{flagCount} unresolved</div>
            )}
          </Link>
        </div>
      </div>
    </div>
  )
}
