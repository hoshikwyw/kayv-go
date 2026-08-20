import { useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { SiteHeader } from '../components/SiteHeader'
import { Spinner } from '../components/Spinner'
import { CategoryBadge } from '../components/blog/CategoryBadge'
import { ImageGallery } from '../components/blog/ImageGallery'
import { StarRating } from '../components/blog/StarRating'
import { usePost } from '../hooks/usePost'
import { formatPostDate } from '../lib/formatDate'

export default function PostPage() {
  const { id } = useParams<{ id: string }>()
  const { post, loading, notFound, error, refetch } = usePost(id)

  // Arriving from the feed keeps the previous scroll offset otherwise.
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [id])

  useEffect(() => {
    if (post) document.title = `${post.title} - Kayv Go`
    return () => {
      document.title = 'Kayv Go'
    }
  }, [post])

  return (
    <div className="min-h-screen bg-slate-50">
      <SiteHeader />

      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <Link
          to="/"
          className="mb-6 inline-block text-sm font-medium text-emerald-700 transition hover:underline"
        >
          &larr; All posts
        </Link>

        {loading ? (
          <div className="flex justify-center py-20 text-emerald-600">
            <Spinner className="h-8 w-8" label="Loading post" />
          </div>
        ) : error ? (
          <div className="flex flex-wrap items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <span>Could not load this post: {error}</span>
            <button
              type="button"
              onClick={refetch}
              className="rounded-md border border-red-300 px-2.5 py-1 font-medium transition hover:bg-red-100"
            >
              Try again
            </button>
          </div>
        ) : notFound || !post ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <h1 className="text-xl font-semibold text-slate-900">Post not found</h1>
            <p className="mt-2 text-sm text-slate-500">
              This post may have been removed, or the link is wrong.
            </p>
            <Link
              to="/"
              className="mt-5 inline-block rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              Back to the feed
            </Link>
          </div>
        ) : (
          <article className="space-y-6">
            <header className="space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <CategoryBadge category={post.category} />
                {post.rating ? <StarRating value={post.rating} /> : null}
              </div>

              <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                {post.title}
              </h1>

              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate-500">
                {post.location_name && (
                  <span className="inline-flex items-center gap-1">
                    <span aria-hidden>&#128205;</span>
                    {post.location_name}
                  </span>
                )}
                {post.location_name && <span aria-hidden>&middot;</span>}
                <time dateTime={post.created_at}>{formatPostDate(post.created_at)}</time>
              </div>
            </header>

            {post.image_urls && post.image_urls.length > 0 && (
              <ImageGallery
                images={post.image_urls}
                title={post.title}
                maxThumbnails={Number.POSITIVE_INFINITY}
              />
            )}

            <div className="whitespace-pre-line text-base leading-relaxed text-slate-700">
              {post.content}
            </div>
          </article>
        )}
      </main>

      <footer className="border-t border-slate-200 py-8 text-center text-sm text-slate-400">
        Kayv Go
      </footer>
    </div>
  )
}
