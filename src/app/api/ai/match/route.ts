import { aiJson, AI_MODEL } from '@/lib/ai'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

async function scoreDirectMatch(post: any, candidate: any) {
  return aiJson(
    `You are a value exchange matchmaker. Evaluate if these two posts represent a fair and practical exchange.

Post A (${post.type}): ${post.title} — ${post.description} [Category: ${post.category}${post.estimated_value ? `, Value: $${post.estimated_value}` : ''}]
Post B (${candidate.type}): ${candidate.title} — ${candidate.description} [Category: ${candidate.category}${candidate.estimated_value ? `, Value: $${candidate.estimated_value}` : ''}]

Consider: category match, practical usefulness, value fairness, and feasibility.
Return ONLY valid JSON: {"score": 0-100, "explanation": "one sentence", "recommend_admin_review": true|false}`,
    300
  )
}

async function scoreLoopMatch(postA: any, postB: any, postC: any) {
  return aiJson(
    `Evaluate this 3-way value exchange loop for fairness and practicality.

Person A offers: ${postA.title} (${postA.category}${postA.estimated_value ? `, ~$${postA.estimated_value}` : ''})
Person B offers: ${postB.title} (${postB.category}${postB.estimated_value ? `, ~$${postB.estimated_value}` : ''})
Person C offers: ${postC.title} (${postC.category}${postC.estimated_value ? `, ~$${postC.estimated_value}` : ''})

Loop: A gives to B, B gives to C, C gives to A.
Return ONLY valid JSON: {"score": 0-100, "explanation": "one sentence describing the loop exchange"}`,
    400
  )
}

export async function POST(req: Request) {
  const { post_id } = await req.json()
  const supabase = await createClient()

  const { data: post } = await supabase
    .from('posts').select('*, profiles(*)').eq('id', post_id).single()
  if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 })

  const oppositeType = post.type === 'need' ? 'offer' : 'need'
  const { data: candidates } = await supabase
    .from('posts').select('*, profiles(*)')
    .eq('type', oppositeType).eq('status', 'active')
    .neq('user_id', post.user_id).limit(20)

  if (!candidates?.length) return NextResponse.json({ matches: [] })

  const directResults: any[] = []
  const loopResults: any[] = []

  // ── Direct matching ───────────────────────────────────────────────────────
  for (const candidate of candidates.slice(0, 5)) {
    const result = await scoreDirectMatch(post, candidate)
    if (result?.score >= 50) {
      directResults.push({ candidate_post_id: candidate.id, type: 'direct', ...result })
    }
  }

  // ── Loop matching (offer posts only) ─────────────────────────────────────
  // Pattern: A offers X → B (B also offers Y) → C (C also offers Z) → A
  if (post.type === 'offer') {
    const { data: bPosts } = await supabase
      .from('posts').select('*, profiles(*)')
      .eq('type', 'offer').eq('status', 'active')
      .neq('user_id', post.user_id).limit(10)

    if (bPosts) {
      for (const bPost of bPosts.slice(0, 3)) {
        const { data: cPosts } = await supabase
          .from('posts').select('*, profiles(*)')
          .eq('type', 'offer').eq('status', 'active')
          .neq('user_id', post.user_id)
          .neq('user_id', bPost.user_id)
          .eq('category', bPost.category)
          .limit(2)

        if (cPosts?.length) {
          const result = await scoreLoopMatch(post, bPost, cPosts[0])
          if (result?.score >= 55) {
            loopResults.push({
              type: 'loop',
              posts: [post.id, bPost.id, cPosts[0].id],
              users: [post.user_id, bPost.user_id, cPosts[0].user_id],
              recommend_admin_review: true,
              ...result,
            })
          }
        }
      }
    }
  }

  // ── Persist direct matches ────────────────────────────────────────────────
  directResults.sort((a, b) => b.score - a.score)
  const savedMatches: any[] = []

  for (const r of directResults.slice(0, 3)) {
    const candidate = candidates.find(c => c.id === r.candidate_post_id)
    if (!candidate) continue

    const { data: match } = await supabase.from('matches').insert({
      type: 'direct',
      status: r.recommend_admin_review ? 'pending_review' : 'approved',
      match_score: r.score,
      ai_explanation: r.explanation,
      ai_model: AI_MODEL,
    }).select().single()

    if (match) {
      await supabase.from('match_participants').insert([
        { match_id: match.id, user_id: post.user_id, post_id: post.id, role: post.type === 'offer' ? 'giver' : 'receiver' },
        { match_id: match.id, user_id: candidate.user_id, post_id: candidate.id, role: post.type === 'offer' ? 'receiver' : 'giver' },
      ])
      savedMatches.push(match)
    }
  }

  // ── Persist loop matches ──────────────────────────────────────────────────
  for (const r of loopResults.slice(0, 1)) {
    const { data: match } = await supabase.from('matches').insert({
      type: 'loop',
      status: 'pending_review',
      match_score: r.score,
      ai_explanation: r.explanation,
      ai_model: AI_MODEL,
    }).select().single()

    if (match) {
      await supabase.from('match_participants').insert(
        r.posts.map((pid: string, i: number) => ({
          match_id: match.id,
          user_id: r.users[i],
          post_id: pid,
          role: i < r.posts.length - 1 ? 'giver' : 'receiver',
        }))
      )
      savedMatches.push(match)
    }
  }

  // ── Log to ai_recommendation_log ─────────────────────────────────────────
  await supabase.from('ai_recommendation_log').insert({
    type: 'match',
    input_snapshot: { post_id, post_title: post.title, post_type: post.type, candidate_count: candidates.length },
    output_snapshot: { direct_count: directResults.length, loop_count: loopResults.length, saved: savedMatches.length },
    model: AI_MODEL,
  })

  return NextResponse.json({ matches: [...directResults.slice(0, 3), ...loopResults.slice(0, 1)] })
}
