import { redirect } from 'next/navigation'

// Explore has been consolidated into the public /browse marketplace
// (same listing + category filters, now with text search and public access).
export default function ExplorePage({
  searchParams,
}: {
  searchParams: { category?: string; type?: string; q?: string }
}) {
  const p = new URLSearchParams()
  if (searchParams.category) p.set('category', searchParams.category)
  if (searchParams.type) p.set('type', searchParams.type)
  if (searchParams.q) p.set('q', searchParams.q)
  const query = p.toString()
  redirect(`/browse${query ? `?${query}` : ''}`)
}
