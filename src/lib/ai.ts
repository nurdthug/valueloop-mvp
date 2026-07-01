// Provider-agnostic AI helper.
// Uses Anthropic (Claude) when ANTHROPIC_API_KEY is set;
// otherwise falls back to Google Gemini (free tier) via GEMINI_API_KEY.

export const AI_PROVIDER = process.env.ANTHROPIC_API_KEY ? 'anthropic' : 'gemini'

export const AI_MODEL = process.env.ANTHROPIC_API_KEY
  ? process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514'
  : process.env.GEMINI_MODEL || 'gemini-2.5-flash'

// Most recent AI failure reason, so API routes can surface a real message
// instead of a generic "could not estimate" error. Read immediately after a
// null return from aiJson().
export let lastAiError: string | null = null

/** Send a prompt expecting a JSON object back. Returns parsed object or null. */
export async function aiJson(prompt: string, maxTokens = 400): Promise<any | null> {
  lastAiError = null
  try {
    if (!process.env.ANTHROPIC_API_KEY && !process.env.GEMINI_API_KEY) {
      throw new Error('No AI provider configured (set ANTHROPIC_API_KEY or GEMINI_API_KEY)')
    }
    const text = process.env.ANTHROPIC_API_KEY
      ? await anthropicText(prompt, maxTokens)
      : await geminiText(prompt, maxTokens)

    const parsed = extractJson(text)
    if (parsed == null) {
      throw new Error(`AI returned unparseable output: ${text.slice(0, 200)}`)
    }
    return parsed
  } catch (err: any) {
    lastAiError = err?.message ? String(err.message) : String(err)
    // Visible in Vercel function logs for diagnosis.
    console.error(`[ai:${AI_PROVIDER}:${AI_MODEL}] ${lastAiError}`)
    return null
  }
}

/** Robustly pull a JSON object out of a model response. */
function extractJson(text: string): any | null {
  if (!text) return null
  // 1) The whole response is already JSON (Gemini JSON mode).
  try { return JSON.parse(text) } catch { /* fall through */ }
  // 2) Greedy match from first { to last } (handles prose/fences around it).
  const match = text.match(/\{[\s\S]*\}/)
  if (match) {
    try { return JSON.parse(match[0]) } catch { /* fall through */ }
  }
  return null
}

async function anthropicText(prompt: string, maxTokens: number): Promise<string> {
  const Anthropic = (await import('@anthropic-ai/sdk')).default
  const client = new Anthropic()
  const msg = await client.messages.create({
    model: AI_MODEL,
    max_tokens: maxTokens,
    messages: [{ role: 'user', content: prompt }],
  })
  const block = msg.content.find((b: any) => b.type === 'text') as any
  return block?.text ?? ''
}

async function geminiText(prompt: string, maxTokens: number): Promise<string> {
  const key = process.env.GEMINI_API_KEY
  if (!key) throw new Error('GEMINI_API_KEY not set')
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${AI_MODEL}:generateContent`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          maxOutputTokens: maxTokens,
          temperature: 0.4,
        },
      }),
    }
  )
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`Gemini API ${res.status}: ${body.slice(0, 300)}`)
  }
  const data = await res.json()
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) {
    const reason = data.candidates?.[0]?.finishReason || data.promptFeedback?.blockReason || 'no text returned'
    throw new Error(`Gemini returned no content (${reason})`)
  }
  return text
}
