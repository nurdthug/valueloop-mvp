import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const { slug, new_user_id } = await req.json()
  const supabase = await createClient()

  const { data: invite } = await supabase.from('invite_links').select('*').eq('slug', slug).eq('is_active', true).single()
  if (!invite) return NextResponse.json({ error: 'Invalid invite' }, { status: 404 })
  if (invite.signup_count >= 50) return NextResponse.json({ error: 'Invite limit reached' }, { status: 429 })

  await supabase.from('invite_links').update({ signup_count: invite.signup_count + 1 }).eq('id', invite.id)
  await supabase.from('profiles').update({ invited_by: invite.owner_id }).eq('id', new_user_id)

  return NextResponse.json({ success: true })
}
