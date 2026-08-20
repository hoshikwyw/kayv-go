import { CATEGORY_LABELS } from '../../types/database'
import type { PostCategory } from '../../types/database'

const STYLES: Record<PostCategory, string> = {
  restaurant: 'bg-rose-50 text-rose-700 ring-rose-200',
  campsite: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  trip_story: 'bg-sky-50 text-sky-700 ring-sky-200',
}

export function CategoryBadge({ category }: { category: PostCategory }) {
  const style = STYLES[category] ?? 'bg-slate-100 text-slate-700 ring-slate-200'

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${style}`}
    >
      {CATEGORY_LABELS[category] ?? category}
    </span>
  )
}
