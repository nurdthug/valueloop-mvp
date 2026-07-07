'use client'
import { useState } from 'react'

export default function CopyInvite({ inviteCode }: { inviteCode: string }) {
  const [copied, setCopied] = useState(false)
  const link = `${typeof window !== 'undefined' ? window.location.origin : 'https://valueloop.app'}/join/${inviteCode}`

  function copy() {
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    })
  }

  return (
    <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2.5 border border-gray-100">
      <span className="flex-1 text-xs text-gray-500 font-mono truncate">
        valueloop.app/join/{inviteCode}
      </span>
      <button onClick={copy}
        className={`flex-shrink-0 text-xs font-bold px-3 py-1.5 rounded-lg transition-all active:scale-95 ${
          copied
            ? 'bg-green-500 text-white'
            : 'bg-gradient-to-r from-blue-500 to-green-600 text-white'
        }`}>
        {copied ? '✓ Copied!' : 'Copy'}
      </button>
    </div>
  )
}
