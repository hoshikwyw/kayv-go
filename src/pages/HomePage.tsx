import { useState } from 'react'
import { SiteHeader } from '../components/SiteHeader'
import { PostCard } from '../components/blog/PostCard'
import { PostCardSkeleton } from '../components/blog/PostCardSkeleton'
import { usePosts } from '../hooks/usePosts'
import type { CategoryFilter } from '../hooks/usePosts'
import { CATEGORY_LABELS, POST_CATEGORIES } from '../types/database'

const FILTERS: { value: CategoryFilter; label: string }[] = [
  { value: 'all', label: 'Everything' },
  ...POST_CATEGORIES.map((value) => ({ value, label: CATEGORY_LABELS[value] })),
]

export default function HomePage() {
  const [filter, setFilter] = useState<CategoryFilter>('all')
  const { posts, loading, error, refetch } = usePosts(filter)

  return (
    <div className="min-h-screen bg-slate-50">
      <SiteHeader />

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="mb-8 max-w-2xl">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Travel stories, good food, and places to pitch a tent
          </h1>
          <p className="mt-3 text-slate-600">
            Notes from the road &mdash; restaurants worth the detour, campsites worth the drive,
            and the trips in between.
          </p>
        </div>

        <nav aria-label="Filter by category" className="mb-8 flex flex-wrap gap-2">
          {FILTERS.map(({ value, label }) => {
            const active = filter === value
            return (
              <button
                key={value}
                type="button"
                onClick={() => setFilter(value)}
                aria-pressed={active}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                  active
                    ? 'bg-slate-900 text-white'
                    : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
                }`}
              >
                {label}
              </button>
            )
          })}
        </nav>

        {error && (
          <div className="mb-6 flex flex-wrap items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <span>Could not load posts: {error}</span>
            <button
              type="button"
              onClick={refetch}
              className="rounded-md border border-red-300 px-2.5 py-1 font-medium transition hover:bg-red-100"
            >
              Try again
            </button>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-2">
            <PostCardSkeleton />
            <PostCardSkeleton />
          </div>
        ) : posts.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center text-slate-500">
            {filter === 'all'
              ? 'No posts yet. Check back soon.'
              : `Nothing filed under ${CATEGORY_LABELS[filter]} yet.`}
          </p>
        ) : (
          <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-2">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </main>

      <footer className="border-t border-slate-200 py-8 text-center text-sm text-slate-400">
        Kayv Go
      </footer>
    </div>
  )
}
