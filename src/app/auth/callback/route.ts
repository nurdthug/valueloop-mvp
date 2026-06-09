import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    const { data } = await supabase.auth.exchangeCodeForSession(code)

    // Claim invite if user signed up via an invite link
    if (data?.user) {
      const inviteCode = data.user.user_metadata?.invite_code_used
      if (inviteCode) {
        try {
          const { data: invite } = await supabase
            .from('invite_links')
            .select('id, owner_id, signup_count')
            .eq('slug', inviteCode)
            .eq('is_active', true)
            .single()

          if (invite) {
            await Promise.all([
              supabase
                .from('invite_links')
                .update({ signup_count: invite.signup_count + 1 })
                .eq('id', invite.id),
              supabase
                .from('profiles')
                .update({ invited_by: invite.owner_id })
                .eq('id', data.user.id),
            ])
          }
        } catch {
          // Non-fatal — invite claim failure shouldn't block login
        }
      }
    }
  }

  return NextResponse.redirect(`${origin}/dashboard`)
}
