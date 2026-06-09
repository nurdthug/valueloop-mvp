import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-06-20' })

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { post_id, cash_price, title, description } = await req.json()
  if (!cash_price || cash_price <= 0) {
    return NextResponse.json({ error: 'Invalid price' }, { status: 400 })
  }

  try {
    const priceObj = await stripe.prices.create({
      currency: 'usd',
      unit_amount: Math.round(cash_price * 100),
      product_data: {
        name: title,
        description: description?.slice(0, 255) || undefined,
        metadata: { post_id, seller_id: user.id },
      },
    })

    const paymentLink = await stripe.paymentLinks.create({
      line_items: [{ price: priceObj.id, quantity: 1 }],
      metadata: { post_id, seller_id: user.id },
      after_completion: {
        type: 'redirect',
        redirect: { url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?payment=success` },
      },
    })

    // Store stripe link on the post
    if (post_id) {
      await supabase
        .from('posts')
        .update({ stripe_link: paymentLink.url })
        .eq('id', post_id)
        .eq('user_id', user.id)
    }

    return NextResponse.json({ url: paymentLink.url })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
