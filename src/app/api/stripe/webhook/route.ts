import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-06-20' })

export async function POST(req: Request) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Missing signature or secret' }, { status: 400 })
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
      // Log the payment
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
      }).catch(() => {})

      // Mark post as matched/completed
      await supabase.from('posts').update({ status: 'matched' }).eq('id', postId).catch(() => {})
    }
  }

  if (event.type === 'payment_link.updated') {
    // Handle payment link deactivation if needed
  }

  return NextResponse.json({ received: true })
}

// Disable body parsing â Stripe needs the raw body for signature verification
export const config = { api: { bodyParser: false } }
