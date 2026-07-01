import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-06-20' })

export async function POST(req: Request) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Missing signature or webhook secret' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = await createClient()

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const postId = session.metadata?.post_id
    const sellerId = session.metadata?.seller_id
    const amountTotal = session.amount_total || 0
    const platformFeeAmount = Math.round(amountTotal * 0.05) // 5% we kept
    const sellerAmount = amountTotal - platformFeeAmount

    if (postId) {
      // Log the payment in ai_recommendation_log (reuse for revenue tracking)
      await supabase.from('ai_recommendation_log').insert({
        type: 'payment',
        input_snapshot: {
          post_id: postId,
          seller_id: sellerId,
          stripe_session_id: session.id,
          customer_email: session.customer_details?.email,
        },
        output_snapshot: {
          amount_total_cents: amountTotal,
          platform_fee_cents: platformFeeAmount,
          seller_amount_cents: sellerAmount,
          currency: session.currency,
          payment_status: session.payment_status,
        },
        model: 'stripe',
      }).then(() => {}, () => {})

      // Mark post as matched/completed
      await supabase.from('posts').update({ status: 'matched' }).eq('id', postId).then(() => {}, () => {})
    }
  }

  if (event.type === 'payment_link.updated') {
    // Handle payment link deactivation if needed
  }

  return NextResponse.json({ received: true })
}

// App Router reads the raw body via req.text() (used above), which is what
// Stripe needs for signature verification. Force the Node.js runtime so the
// Stripe SDK works. (The old Pages-style `export const config` is invalid here
// and breaks the build.)
export const runtime = 'nodejs'
