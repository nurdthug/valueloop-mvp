import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const client = new Anthropic()

export async function POST(req: Request) {
  const { title, description, category, post_id } = await req.json()

  try {
    const msg = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 256,
      messages: [{
        role: 'user',
        content: `You are a market value estimator for a peer exchange platform.
Estimate the fair market value range for this offer:
Title: ${title}
Category: ${category}
Description: ${description}

Return ONLY valid JSON in this exact format:
{"min": number, "max": number, "currency": "USD", "rationale": "one sentence explanation"}`,
      }],
    })

    const text = (msg.content[0] as any).text
    const json = JSON.parse(text.match(/\{[\s\S]*?\}/)?.[0] || '{}')

    // Log to ai_recommendation_log (non-blocking)
    try {
      const supabase = await createClient()
      await supabase.from('ai_recommendation_log').insert({
        type: 'pricing',
        input_snapshot: { title, description, category, post_id: post_id || null },
        output_snapshot: { min: json.min, max: json.max, rationale: json.rationale },
        model: 'claude-sonnet-4-6',
      })
    } catch { /* non-fatal */ }

    return NextResponse.json(json)
  } catch {
    return NextResponse.json({ error: 'Could not estimate value' }, { status: 500 })
  }
}
