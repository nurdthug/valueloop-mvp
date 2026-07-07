import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { revalidatePath } from 'next/cache'

async function flagPost(formData: FormData) {
  'use server'
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  const postId = formData.get('post_id') as string
  await supabase.from('posts').update({ status: 'flagged' }).eq('id', postId)
  await supabase.from('activity_flags').insert({
    user_id: (await supabase.from('posts').select('user_id').eq('id', postId).single()).data?.user_id,
    type: 'spam',
    description: `Post flagged by admin: ${postId}`,
  })
  revalidatePath('/admin/posts')
}

export default async function AdminPostsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !['admin', 'super_admin'].includes(profile.role)) redirect('/dashboard')

  const { data: posts } = await supabase
    .from('posts')
    .select('*, profiles(display_name, location)')
    .order('created_at', { ascending: false })
    .limit(100)

  const byStatus = {
    active:    posts?.filter(p => p.status === 'active')    ?? [],
    matched:   posts?.filter(p => p.status === 'matched')   ?? [],
    completed: posts?.filter(p => p.status === 'completed') ?? [],
    flagged:   posts?.filter(p => p.status === 'flagged')   ?? [],
  }

  const statusColors: Record<string, string> = {
    active:    'bg-green-100 text-green-700',
    matched:   'bg-blue-100 text-blue-700',
    completed: 'bg-blue-100 text-blue-700',
    abandoned: 'bg-gray-100 text-gray-500',
    flagged:   'bg-red-100 text-red-700',
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-100 px-6 py-4 flex items-center gap-4">
        <Link href="/admin" className="text-gray-400 hover:text-gray-600">←</Link>
        <span className="font-semibold text-gray-900">All Posts</span>
        <span className="text-xs text-gray-400">{posts?.length ?? 0} total</span>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        {/* Summary */}
        <div className="grid grid-cols-4 gap-4">
          {Object.entries(byStatus).map(([status, items]) => (
            <div key={status} className="bg-white rounded-2xl border border-gray-100 p-5 text-center">
              <div className="text-2xl font-bold text-gray-900">{items.length}</div>
              <span className={`text-xs font-bold px-2 py-1 rounded-full mt-2 inline-block ${statusColors[status]}`}>
                {status}
              </span>
            </div>
          ))}
        </div>

        {/* Posts table */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-xs text-gray-500 uppercase tracking-wide">
                <th className="text-left px-5 py-3">Post</th>
                <th className="text-left px-5 py-3">User</th>
                <th className="text-left px-5 py-3">Category</th>
                <th className="text-left px-5 py-3">Value</th>
                <th className="text-left px-5 py-3">Status</th>
                <th className="text-left px-5 py-3">Date</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {posts?.map(post => (
                <tr key={post.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${post.type === 'need' ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'}`}>
                        {post.type}
                      </span>
                      <span className="text-gray-900 font-medium">{post.title}</span>
                    </div>
                    {post.description && (
                      <p className="text-xs text-gray-400 mt-1 line-clamp-1">{post.description}</p>
                    )}
                  </td>
                  <td className="px-5 py-3 text-gray-600">
                    {(post as any).profiles?.display_name}
                    {(post as any).profiles?.location && (
                      <div className="text-xs text-gray-400">📍 {(post as any).profiles.location}</div>
                    )}
                  </td>
                  <td className="px-5 py-3 text-gray-500 text-xs">{post.category}</td>
                  <td className="px-5 py-3">
                    {post.estimated_value ? (
                      <div>
                        <span className="text-gray-900 font-medium">${post.estimated_value}</span>
                        {post.ai_value_min && (
                          <div className="text-xs text-gray-400">AI: ${post.ai_value_min}–${post.ai_value_max}</div>
                        )}
                      </div>
                    ) : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-5 py-3">
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${statusColors[post.status]}`}>
                      {post.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-gray-400 text-xs">
                    {new Date(post.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-3">
                    {post.status === 'active' && (
                      <form action={flagPost}>
                        <input type="hidden" name="post_id" value={post.id} />
                        <button type="submit" className="text-xs text-red-500 hover:text-red-700 font-medium">
                          Flag
                        </button>
                      </form>
                    )}
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
