export type UserRole = 'member' | 'admin' | 'super_admin'
export type PostType = 'need' | 'offer'
export type PostStatus = 'active' | 'matched' | 'completed' | 'abandoned' | 'flagged'
export type MatchStatus = 'pending_review' | 'approved' | 'rejected' | 'completed' | 'abandoned'
export type MatchType = 'direct' | 'loop'
export type AiValueAction = 'accepted' | 'edited' | 'ignored' | 'flagged'
export type FlagType = 'spam' | 'suspicious_pricing' | 'repeated_failure' | 'invite_abuse' | 'poor_ai_match' | 'user_report' | 'unusual_activity'

export interface Profile {
  id: string
  display_name: string
  avatar_url: string | null
  bio: string | null
  location: string | null
  invite_code: string
  invited_by: string | null
  role: UserRole
  onboarding_complete: boolean
  trust_score: number
  created_at: string
}

export interface Post {
  id: string
  user_id: string
  type: PostType
  title: string
  description: string
  category: string
  tags: string[]
  location: string | null
  remote_ok: boolean
  estimated_value: number | null
  ai_value_min: number | null
  ai_value_max: number | null
  ai_value_accepted: AiValueAction | null
  cash_price: number | null
  stripe_link: string | null
  status: PostStatus
  created_at: string
  profile?: Profile
}

export interface Match {
  id: string
  type: MatchType
  status: MatchStatus
  match_score: number
  ai_explanation: string
  ai_model: string
  admin_notes: string | null
  reviewed_by: string | null
  reviewed_at: string | null
  created_at: string
  participants?: MatchParticipant[]
}

export interface MatchParticipant {
  id: string
  match_id: string
  user_id: string
  post_id: string
  role: 'giver' | 'receiver'
  profile?: Profile
  post?: Post
}

export interface ChatThread {
  id: string
  match_id: string
  status: 'active' | 'closed'
  created_at: string
}

export interface ChatMessage {
  id: string
  thread_id: string
  user_id: string
  content: string
  created_at: string
  profile?: Profile
}

export const CATEGORIES = [
  'Design & Creative',
  'Web & Tech',
  'Marketing',
  'Writing & Content',
  'Legal',
  'Finance & Accounting',
  'Tutoring & Education',
  'Health & Wellness',
  'Home & Garden',
  'Food & Cooking',
  'Transport & Moving',
  'Music & Audio',
  'Photography & Video',
  'Business & Consulting',
  'Other',
] as const
