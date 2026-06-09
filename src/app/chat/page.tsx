'use client'
import { useState, useEffect, useRef, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ChatMessage, Profile } from '@/types'

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
  const bottomRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  useEffect(() => {
    if (!matchId) return
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUserId(user.id)
      const { data: thread } = await supabase.from('chat_threads').select('*').eq('match_id', matchId).single()
      if (!thread) return
      setThreadId(thread.id)
      const { data: msgs } = await supabase.from('chat_messages').select('*, profile:profiles(*)').eq('thread_id', thread.id).order('created_at')
      setMessages(msgs as any || [])
      // Load exchange status
      const { data: exchange } = await supabase.from('exchanges').select('status').eq('match_id', matchId!).single()
      if (exchange) setExchangeStatus(exchange.status)
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

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  async function handleExchangeAction(action: 'completed' | 'abandoned') {
    if (!matchId || acting) return
    setActing(true)
    // Upsert exchange record
    await supabase.from('exchanges').upsert({
      match_id: matchId,
      status: action,
      completed_at: action === 'completed' ? new Date().toISOString() : null,
    }, { onConflict: 'match_id' })
    // Update match status
    await supabase.from('matches').update({ status: action }).eq('id', matchId)
    setExchangeStatus(action)
    setActing(false)
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!newMsg.trim() || !threadId || !userId) return
    setSending(true)
    await supabase.from('chat_messages').insert({ thread_id: threadId, user_id: userId, content: newMsg.trim() })
    setNewMsg('')
    setSending(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <nav className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.back()} className="text-gray-400">←</button>
        <span className="font-semibold text-gray-900">Exchange Chat</span>
      </nav>
      <div className="flex-1 overflow-y-auto px-4 py-4 max-w-2xl w-full mx-auto space-y-3">
        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.user_id === userId ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-xs px-4 py-3 rounded-2xl text-sm ${msg.user_id === userId ? 'bg-gradient-to-r from-teal-500 to-purple-600 text-white' : 'bg-white border border-gray-100 text-gray-800'}`}>
              {msg.user_id !== userId && <p className="text-xs font-semibold mb-1 text-gray-500">{(msg as any).profile?.display_name}</p>}
              {msg.content}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      {/* Exchange outcome actions */}
      {exchangeStatus === 'completed' && (
        <div className="bg-green-50 border-t border-green-100 px-4 py-3 text-center text-sm text-green-700 font-medium max-w-2xl w-full mx-auto">
          ✅ Exchange marked as completed!
        </div>
      )}
      {exchangeStatus === 'abandoned' && (
        <div className="bg-gray-50 border-t border-gray-100 px-4 py-3 text-center text-sm text-gray-500 max-w-2xl w-full mx-auto">
          This exchange was abandoned.
        </div>
      )}
      {!exchangeStatus || (exchangeStatus === 'in_progress') ? (
        <div className="bg-white border-t border-gray-100 px-4 py-2 flex gap-2 max-w-2xl w-full mx-auto">
          <button onClick={() => handleExchangeAction('completed')} disabled={acting}
            className="flex-1 py-2 bg-green-50 text-green-700 text-xs font-semibold rounded-xl hover:bg-green-100 transition disabled:opacity-50">
            ✅ Mark Complete
          </button>
          <button onClick={() => handleExchangeAction('abandoned')} disabled={acting}
            className="flex-1 py-2 bg-gray-50 text-gray-500 text-xs font-semibold rounded-xl hover:bg-gray-100 transition disabled:opacity-50">
            ✗ Abandon
          </button>
        </div>
      ) : null}
      <form onSubmit={sendMessage} className="bg-white border-t border-gray-100 px-4 py-3 flex gap-3 max-w-2xl w-full mx-auto">
        <input type="text" value={newMsg} onChange={e => setNewMsg(e.target.value)} placeholder="Type a message…"
          className="flex-1 px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
        <button type="submit" disabled={sending || !newMsg.trim()}
          className="px-4 py-2 bg-gradient-to-r from-teal-500 to-purple-600 text-white text-sm font-semibold rounded-xl disabled:opacity-50">
          Send
        </button>
      </form>
    </div>
  )
}

export default function ChatPage() {
  return <Suspense><ChatView /></Suspense>
}
