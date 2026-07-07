import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// Service-role client for trusted server-side writes that RLS would block
// (Stripe webhooks have no user session; invite counters belong to other
// users). Never import this from client components. Falls back to the anon
// key if the service key is missing so dev environments don't crash.
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )
}
