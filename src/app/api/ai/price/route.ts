import { aiJson, AI_MODEL, lastAiError } from '@/lib/ai'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const { title, description, category, post_id } = await req.json()

  const json = await aiJson(
    `You are a market value estimator for a peer exchange platform.
Estimate the fair market value range for this offer:
Title: ${title}
Category: ${category}
Description: ${description}

Return ONLY valid JSON in this exact format:
{"min": number, "max": number, "currency": "USD", "rationale": "one sentence explanation"}`,
    256
  )

  if (!json) {
    return NextResponse.json(
      { error: 'Could not estimate value', detail: lastAiError || 'unknown AI error' },
      { status: 502 }
    )
  }

  // Log to ai_recommendation_log (non-blocking)
  try {
    const supabase = await createClient()
    await supabase.from('ai_recommendation_log').insert({
      type: 'pricing',
      input_snapshot: { title, description, category, post_id: post_id || null },
      output_snapshot: { min: json.min, max: json.max, rationale: json.rationale },
      model: AI_MODEL,
    })
  } catch { /* non-fatal */ }

  return NextResponse.json(json)
}
