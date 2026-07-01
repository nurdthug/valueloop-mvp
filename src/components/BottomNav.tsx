'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const tabs = [
  { href: '/dashboard', label: 'Home', icon: HomeIcon },
  { href: '/browse', label: 'Explore', icon: ExploreIcon },
  { href: '/post/new', label: 'Post', icon: PlusIcon, cta: true },
  { href: '/matches', label: 'Matches', icon: MatchIcon },
  { href: '/profile', label: 'Profile', icon: ProfileIcon },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="vl-tabbar safe-area-pb">
      <div className="max-w-lg mx-auto flex items-center">
        {tabs.map(tab => {
          const active = pathname === tab.href || (tab.href !== '/dashboard' && pathname.startsWith(tab.href))
          const Icon = tab.icon
          if (tab.cta) {
            return (
              <Link key={tab.href} href={tab.href}
                className="flex-1 flex flex-col items-center py-2">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-green-600 flex items-center justify-center shadow-lg -mt-5">
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <span className="text-[10px] text-gray-400 mt-1 font-medium">{tab.label}</span>
              </Link>
            )
          }
          return (
            <Link key={tab.href} href={tab.href}
              className="flex-1 flex flex-col items-center py-3 gap-1">
              <Icon className={`w-6 h-6 transition-colors ${active ? 'text-blue-500' : 'text-gray-400'}`} />
              <span className={`text-[10px] font-medium transition-colors ${active ? 'text-blue-500' : 'text-gray-400'}`}>
                {tab.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

function HomeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  )
}

function ExploreIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  )
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
  )
}

function MatchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  )
}

function ProfileIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  )
}
