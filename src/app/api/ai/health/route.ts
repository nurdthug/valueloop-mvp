import { aiJson, AI_MODEL, AI_PROVIDER, lastAiError } from '@/lib/ai'
import { NextResponse } from 'next/server'

// GET /api/ai/health — quick diagnostic for AI configuration.
// Returns which provider/model is active and whether a live call succeeds.
export async function GET() {
  const configured = Boolean(process.env.ANTHROPIC_API_KEY || process.env.GEMINI_API_KEY)

  const result = await aiJson(
    'Return ONLY this JSON: {"ok": true}',
    50
  )

  return NextResponse.json({
    provider: AI_PROVIDER,
    model: AI_MODEL,
    key_configured: configured,
    ok: Boolean(result?.ok === true || result),
    error: result ? null : (lastAiError || 'unknown AI error'),
  })
}
