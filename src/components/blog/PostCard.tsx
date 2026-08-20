import { Link } from 'react-router-dom'
import { formatPostDate } from '../../lib/formatDate'
import type { Post } from '../../types/database'
import { CategoryBadge } from './CategoryBadge'
import { ImageGallery } from './ImageGallery'
import { StarRating } from './StarRating'

type PostCardProps = {
  post: Post
  /**
   * 'full' prints the whole post in the feed; 'excerpt' clamps it to a few
   * lines and leans on the detail page. Swap the prop in HomePage to switch.
   */
  variant?: 'full' | 'excerpt'
}

export function PostCard({ post, variant = 'full' }: PostCardProps) {
  const images = post.image_urls ?? []

  return (
    <article className="flex flex-col gap-4 overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
      <header className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <CategoryBadge category={post.category} />
          {post.rating ? <StarRating value={post.rating} /> : null}
        </div>

        <h2 className="text-xl font-bold tracking-tight text-slate-900">
          <Link to={`/post/${post.id}`} className="transition hover:text-emerald-700">
            {post.title}
          </Link>
        </h2>

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

      {images.length > 0 && <ImageGallery images={images} title={post.title} />}

      {/* Content is plain text in the DB, so keep the author's line breaks. */}
      <p
        className={`whitespace-pre-line text-[15px] leading-relaxed text-slate-700 ${
          variant === 'excerpt' ? 'line-clamp-4' : ''
        }`}
      >
        {post.content}
      </p>

      <footer className="mt-auto pt-1">
        <Link
          to={`/post/${post.id}`}
          className="text-sm font-semibold text-emerald-700 transition hover:underline"
        >
          Read the full post &rarr;
        </Link>
      </footer>
    </article>
  )
}
