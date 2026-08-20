import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useAuth } from '../hooks/useAuth'
import { PostForm } from '../components/admin/PostForm'
import { Spinner } from '../components/Spinner'
import { CATEGORY_LABELS } from '../types/database'
import type { Post } from '../types/database'

export default function AdminDashboard() {
  const { user, profile, signOut } = useAuth()
  const [posts, setPosts] = useState<Post[]>([])
  const [loadingPosts, setLoadingPosts] = useState(true)
  const [listError, setListError] = useState<string | null>(null)

  const loadPosts = useCallback(async () => {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10)

    if (error) setListError(error.message)
    else {
      setListError(null)
      setPosts(data ?? [])
    }
    setLoadingPosts(false)
  }, [])

  useEffect(() => {
    // Fetching on mount is exactly the external-system sync effects are for.
    // oxlint-disable-next-line react/set-state-in-effect
    void loadPosts()
  }, [loadPosts])

  if (!user) return null

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div>
            <Link to="/" className="text-lg font-bold tracking-tight text-emerald-700">
              Kayv&nbsp;Go
            </Link>
            <p className="text-xs text-slate-500">
              Signed in as {profile?.username ?? user.email}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/"
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              View blog
            </Link>
            <button
              type="button"
              onClick={() => void signOut()}
              className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-slate-700"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-8 px-4 py-8 sm:px-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Admin dashboard</h1>

        <PostForm
          userId={user.id}
          onCreated={(post) => setPosts((current) => [post, ...current].slice(0, 10))}
        />

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Recent posts</h2>
            <button
              type="button"
              onClick={() => {
                setLoadingPosts(true)
                void loadPosts()
              }}
              className="text-sm font-medium text-emerald-700 hover:underline"
            >
              Refresh
            </button>
          </div>

          {listError && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {listError}
            </p>
          )}

          {loadingPosts ? (
            <div className="flex justify-center py-8 text-emerald-600">
              <Spinner className="h-6 w-6" label="Loading posts" />
            </div>
          ) : posts.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-10 text-center text-sm text-slate-500">
              No posts yet. Publish your first one above.
            </p>
          ) : (
            <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white">
              {posts.map((post) => (
                <li key={post.id} className="flex items-center gap-4 px-4 py-3">
                  {post.image_urls?.[0] ? (
                    <img
                      src={post.image_urls[0]}
                      alt=""
                      className="h-12 w-12 shrink-0 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="h-12 w-12 shrink-0 rounded-lg bg-slate-100" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-900">{post.title}</p>
                    <p className="truncate text-xs text-slate-500">
                      {CATEGORY_LABELS[post.category] ?? post.category}
                      {post.location_name ? ` - ${post.location_name}` : ''}
                      {post.image_urls?.length ? ` - ${post.image_urls.length} photo(s)` : ''}
                    </p>
                  </div>
                  {post.rating ? (
                    <span className="shrink-0 text-sm text-amber-500">
                      {'\u2605'.repeat(post.rating)}
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  )
}
