'use client'
import { useState, useEffect, useRef, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ChatMessage, Profile } from '@/types'

function formatTime(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  const diffH = (now.getTime() - d.getTime()) / 3600000
  if (diffH < 24) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  if (diffH < 168) return d.toLocaleDateString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' })
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

function ChatView() {
  const params = useSearchParams()
  const router = useRouter()
  const matchId = params.get('match')
  const [messages, setMessages] = useState<(ChatMessage & { profile: Profile })[]>([])
  const [newMsg, setNewMsg] = useState('')
  const [threadId, setThreadId] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const [exchangeStatus, setExchangeStatus] = useState<string | null>(null)
  const [acting, setActing] = useState(false)
  const [matchInfo, setMatchInfo] = useState<any>(null)
  const [myRatings, setMyRatings] = useState<Record<string, number>>({})
  const [ratingBusy, setRatingBusy] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  useEffect(() => {
    if (!matchId) return
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUserId(user.id)

      const { data: match } = await supabase.from('matches').select('*, match_participants(*, profiles(*), posts(*))').eq('id', matchId).single()
      if (match) setMatchInfo(match)

      const { data: thread } = await supabase.from('chat_threads').select('*').eq('match_id', matchId).single()
      if (!thread) return
      setThreadId(thread.id)

      const { data: msgs } = await supabase.from('chat_messages').select('*, profile:profiles(*)').eq('thread_id', thread.id).order('created_at')
      setMessages(msgs as any || [])

      const { data: exchange } = await supabase.from('exchanges').select('status').eq('match_id', matchId!).single()
      if (exchange) setExchangeStatus(exchange.status)

      const { data: mine } = await supabase.from('ratings')
        .select('ratee_id, stars').eq('match_id', matchId!).eq('rater_id', user.id)
      if (mine?.length) {
        setMyRatings(Object.fromEntries(mine.map((r: any) => [r.ratee_id, r.stars])))
      }
    }
    load()
  }, [matchId])

  useEffect(() => {
    if (!threadId) return
    const channel = supabase.channel(`chat:${threadId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `thread_id=eq.${threadId}` },
        async (payload) => {
          const { data } = await supabase.from('chat_messages').select('*, profile:profiles(*)').eq('id', payload.new.id).single()
          if (data) setMessages(m => [...m, data as any])
        })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [threadId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleExchangeAction(action: 'completed' | 'abandoned') {
    if (!matchId || acting) return
    setActing(true)
    await supabase.from('exchanges').upsert({
      match_id: matchId,
      status: action,
      completed_at: action === 'completed' ? new Date().toISOString() : null,
    }, { onConflict: 'match_id' })
    await supabase.from('matches').update({ status: action }).eq('id', matchId)
    setExchangeStatus(action)
    setActing(false)
  }

  async function submitRating(rateeId: string, stars: number) {
    if (!matchId || !userId || ratingBusy) return
    setRatingBusy(rateeId)
    const { error } = await supabase.from('ratings').upsert({
      match_id: matchId, rater_id: userId, ratee_id: rateeId, stars,
    }, { onConflict: 'match_id,rater_id,ratee_id' })
    if (!error) setMyRatings(r => ({ ...r, [rateeId]: stars }))
    setRatingBusy(null)
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!newMsg.trim() || !threadId || !userId) return
    setSending(true)
    const text = newMsg.trim()
    setNewMsg('')
    const { error } = await supabase.from('chat_messages').insert({ thread_id: threadId, user_id: userId, content: text })
    if (error) setNewMsg(text) // restore so the message isn't lost
    setSending(false)
    inputRef.current?.focus()
  }

  const otherParticipants = matchInfo?.match_participants?.filter((p: any) => p.user_id !== userId) || []
  const chatTitle = otherParticipants.length > 0
    ? otherParticipants.map((p: any) => p.profiles?.display_name).filter(Boolean).join(', ')
    : 'Exchange Chat'

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Nav */}
      <div className="px-4 pb-3 flex items-center gap-3 flex-shrink-0 border-b border-gray-100"
        style={{ paddingTop: 'calc(env(safe-area-inset-top,0px) + 12px)', background: 'rgba(255,255,255,.85)', backdropFilter: 'saturate(180%) blur(20px)', WebkitBackdropFilter: 'saturate(180%) blur(20px)' }}>
        <button onClick={() => router.back()} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 transition text-gray-500">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-gray-900 text-sm truncate">{chatTitle}</p>
          {matchInfo && (
            <p className="text-xs text-gray-400">
              {matchInfo.type === 'direct' ? '⚡ Direct Match' : '🔄 Loop Match'} · {matchInfo.match_score}% match
            </p>
          )}
        </div>
        {exchangeStatus === 'completed' && (
          <span className="text-xs bg-green-50 text-green-600 font-semibold px-2.5 py-1 rounded-full">✅ Done</span>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <div className="text-4xl mb-3">👋</div>
            <p className="text-sm font-medium">Start the conversation</p>
            <p className="text-xs mt-1">Introduce yourself and discuss the exchange</p>
          </div>
        )}
        {messages.map((msg, i) => {
          const isMe = msg.user_id === userId
          const prevMsg = messages[i - 1]
          const showSender = !isMe && (!prevMsg || prevMsg.user_id !== msg.user_id)
          return (
            <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
              {showSender && (
                <p className="text-xs text-gray-400 font-semibold mb-1 ml-1">
                  {(msg as any).profile?.display_name}
                </p>
              )}
              <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                isMe
                  ? 'bg-gradient-to-r from-blue-500 to-green-600 text-white rounded-br-md'
                  : 'bg-white border border-gray-100 text-gray-800 rounded-bl-md shadow-sm'
              }`}>
                {msg.content}
              </div>
              <p className="text-[10px] text-gray-300 mt-1 mx-1">{formatTime(msg.created_at)}</p>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Exchange outcome + trust rating */}
      {exchangeStatus === 'completed' && (
        <div className="bg-green-50 border-t border-green-100 px-4 py-3 flex-shrink-0">
          <p className="text-sm text-green-700 font-semibold text-center">✅ Exchange completed!</p>
          {otherParticipants.length > 0 && (
            <div className="mt-3 space-y-2">
              <p className="text-xs text-gray-500 text-center">Rate your exchange partner{otherParticipants.length > 1 ? 's' : ''}</p>
              {otherParticipants.map((p: any) => {
                const name = p.profiles?.display_name || 'Partner'
                const given = myRatings[p.user_id]
                return (
                  <div key={p.user_id} className="flex items-center justify-between bg-white rounded-xl px-3 py-2 border border-green-100">
                    <span className="text-xs font-semibold text-gray-700 truncate mr-2">{name}</span>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map(star => (
                        <button key={star}
                          onClick={() => submitRating(p.user_id, star)}
                          disabled={ratingBusy === p.user_id}
                          className={`text-lg leading-none transition ${given && star <= given ? 'text-yellow-400' : 'text-gray-300 hover:text-yellow-300'} disabled:opacity-50`}
                          aria-label={`${star} star${star > 1 ? 's' : ''}`}>
                          ★
                        </button>
                      ))}
                    </div>
                  </div>
                )
              })}
              {Object.keys(myRatings).length > 0 && (
                <p className="text-[11px] text-green-600 text-center">Thanks! Your rating updates their trust score.</p>
              )}
            </div>
          )}
        </div>
      )}
      {exchangeStatus === 'abandoned' && (
        <div className="bg-gray-50 border-t border-gray-100 px-4 py-3 text-center flex-shrink-0">
          <p className="text-sm text-gray-500">This exchange was abandoned.</p>
        </div>
      )}

      {(!exchangeStatus || exchangeStatus === 'in_progress') && (
        <div className="bg-white border-t border-gray-100 px-4 py-2 flex gap-2 flex-shrink-0">
          <button onClick={() => handleExchangeAction('completed')} disabled={acting}
            className="flex-1 py-2 bg-green-50 text-green-700 text-xs font-bold rounded-xl hover:bg-green-100 transition disabled:opacity-50 active:scale-[0.98]">
            ✅ Mark Complete
          </button>
          <button onClick={() => handleExchangeAction('abandoned')} disabled={acting}
            className="flex-1 py-2 bg-gray-50 text-gray-500 text-xs font-semibold rounded-xl hover:bg-gray-100 transition disabled:opacity-50 active:scale-[0.98]">
            ✗ Abandon
          </button>
        </div>
      )}

      {/* Message input */}
      <form onSubmit={sendMessage}
        className="bg-white border-t border-gray-100 px-4 py-3 flex gap-2.5 flex-shrink-0 safe-area-pb">
        <input
          ref={inputRef}
          type="text"
          value={newMsg}
          onChange={e => setNewMsg(e.target.value)}
          placeholder="Message…"
          className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white transition"
        />
        <button type="submit" disabled={sending || !newMsg.trim()}
          className="w-10 h-10 bg-gradient-to-r from-blue-500 to-green-600 text-white rounded-2xl flex items-center justify-center disabled:opacity-40 active:scale-95 transition flex-shrink-0">
          <svg className="w-4 h-4 rotate-90" fill="currentColor" viewBox="0 0 24 24">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
          </svg>
        </button>
      </form>
    </div>
  )
}

export default function ChatPage() {
  return <Suspense><ChatView /></Suspense>
}
