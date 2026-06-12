// Provider-agnostic AI helper.
// Uses Anthropic (Claude) when ANTHROPIC_API_KEY is set;
// otherwise falls back to Google Gemini (free tier) via GEMINI_API_KEY.

export const AI_MODEL = process.env.ANTHROPIC_API_KEY
  ? process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6'
  : process.env.GEMINI_MODEL || 'gemini-2.5-flash'

/** Send a prompt expecting a JSON object back. Returns parsed object or null. */
export async function aiJson(prompt: string, maxTokens = 400): Promise<any | null> {
  try {
    const text = process.env.ANTHROPIC_API_KEY
      ? await anthropicText(prompt, maxTokens)
      : await geminiText(prompt)
    return JSON.parse(text.match(/\{[\s\S]*?\}/)?.[0] || 'null')
  } catch {
    return null
  }
}

async function anthropicText(prompt: string, maxTokens: number): Promise<string> {
  const Anthropic = (await import('@anthropic-ai/sdk')).default
  const client = new Anthropic()
  const msg = await client.messages.create({
    model: AI_MODEL,
    max_tokens: maxTokens,
    messages: [{ role: 'user', content: prompt }],
  })
  return (msg.content[0] as any).text
}

async function geminiText(prompt: string): Promise<string> {
  const key = process.env.GEMINI_API_KEY
  if (!key) throw new Error('No AI provider configured (set ANTHROPIC_API_KEY or GEMINI_API_KEY)')
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${AI_MODEL}:generateContent`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json' },
      }),
    }
  )
  if (!res.ok) throw new Error(`Gemini API error ${res.status}`)
  const data = await res.json()
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
}
