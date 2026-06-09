import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-06-20' })

export async function POST(req: Request) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err: any) {
    return NextResponse.json({ error: `Webhook error: ${err.message}` }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const post_id = session.metadata?.post_id

    if (post_id) {
      const supabase = await createClient()

      // Mark the post as matched/completed
      await supabase
        .from('posts')
        .update({ status: 'matched' })
        .eq('id', post_id)

      // Find any exchange linked to this post and mark cash_used
      const { data: participant } = await supabase
        .from('match_participants')
        .select('match_id')
        .eq('post_id', post_id)
        .single()

      if (participant) {
        await supabase.from('exchanges').upsert({
          match_id: participant.match_id,
          status: 'completed',
          cash_used: true,
          stripe_payment_id: session.payment_intent as string,
          completed_at: new Date().toISOString(),
        }, { onConflict: 'match_id' })
      }
    }
  }

  return NextResponse.json({ received: true })
}
