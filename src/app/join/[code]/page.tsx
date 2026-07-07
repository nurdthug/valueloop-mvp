import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'

interface Props {
  params: { code: string }
}

export default async function JoinPage({ params }: Props) {
  const { code } = params
  const supabase = await createClient()

  const { data: invite } = await supabase
    .from('invite_links')
    .select('*, profiles(display_name)')
    .eq('slug', code)
    .eq('is_active', true)
    .single()

  if (!invite) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-sm text-center">
          <div className="text-5xl mb-4">😕</div>
          <h1 className="text-xl font-bold text-gray-900">Invite not found</h1>
          <p className="text-gray-500 text-sm mt-2">This link may have expired or been deactivated.</p>
          <Link href="/signup" className="inline-block mt-6 px-6 py-3 bg-gradient-to-r from-blue-500 to-green-600 text-white text-sm font-semibold rounded-xl">
            Sign up anyway →
          </Link>
        </div>
      </div>
    )
  }

  // Increment click count — the visitor doesn't own this invite row, so RLS
  // would block the write with the anon client; use the service-role client.
  await createAdminClient()
    .from('invite_links')
    .update({ click_count: invite.click_count + 1 })
    .eq('id', invite.id)

  const inviterName = (invite as any).profiles?.display_name || 'someone'

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🔄</div>
          <h1 className="text-2xl font-bold text-gray-900">You&apos;re invited to ValueLoop</h1>
          <p className="text-gray-500 text-sm mt-2">
            <span className="font-medium text-blue-600">{inviterName}</span> invited you to join the value exchange community.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4 mb-6">
          <div className="flex items-start gap-3">
            <span className="text-xl">📋</span>
            <div>
              <div className="font-semibold text-gray-900 text-sm">Post what you need</div>
              <div className="text-gray-500 text-xs mt-0.5">Request skills, services, or goods</div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-xl">🎁</span>
            <div>
              <div className="font-semibold text-gray-900 text-sm">Offer what you have</div>
              <div className="text-gray-500 text-xs mt-0.5">Share your skills, services, or goods</div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-xl">🤖</span>
            <div>
              <div className="font-semibold text-gray-900 text-sm">AI finds your matches</div>
              <div className="text-gray-500 text-xs mt-0.5">Direct swaps or multi-party loops</div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-xl">🤝</span>
            <div>
              <div className="font-semibold text-gray-900 text-sm">Exchange directly</div>
              <div className="text-gray-500 text-xs mt-0.5">Chat and complete the exchange</div>
            </div>
          </div>
        </div>

        <Link
          href={`/signup?ref=${code}`}
          className="block w-full py-4 bg-gradient-to-r from-blue-500 to-green-600 text-white font-bold rounded-xl hover:opacity-90 transition text-sm text-center"
        >
          Join ValueLoop 🚀
        </Link>
        <p className="text-center text-xs text-gray-400 mt-4">
          Already have an account?{' '}
          <Link href="/login" className="text-blue-600">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
