import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const { slug } = await req.json()
  if (!slug) return NextResponse.json({ error: 'Missing slug' }, { status: 400 })

  // Identify the claimer from their session — never trust a user id in the body.
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Counter updates touch another user's invite row, which RLS forbids —
  // use the service-role client after validating.
  const admin = createAdminClient()

  const { data: invite } = await admin.from('invite_links').select('*').eq('slug', slug).eq('is_active', true).single()
  if (!invite) return NextResponse.json({ error: 'Invalid invite' }, { status: 404 })
  if (invite.owner_id === user.id) return NextResponse.json({ error: 'Cannot claim your own invite' }, { status: 400 })
  if (invite.signup_count >= 50) return NextResponse.json({ error: 'Invite limit reached' }, { status: 429 })

  // Only credit once per user
  const { data: profile } = await admin.from('profiles').select('invited_by').eq('id', user.id).single()
  if (profile?.invited_by) return NextResponse.json({ success: true, already_claimed: true })

  await admin.from('invite_links').update({ signup_count: invite.signup_count + 1 }).eq('id', invite.id)
  await admin.from('profiles').update({ invited_by: invite.owner_id }).eq('id', user.id)

  return NextResponse.json({ success: true })
}
