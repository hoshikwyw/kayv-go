export function PostCardSkeleton() {
  return (
    <div className="animate-pulse space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
      <div className="h-5 w-24 rounded-full bg-slate-200" />
      <div className="h-6 w-3/4 rounded bg-slate-200" />
      <div className="h-4 w-1/2 rounded bg-slate-100" />
      <div className="aspect-16/9 w-full rounded-lg bg-slate-200" />
      <div className="space-y-2">
        <div className="h-3 w-full rounded bg-slate-100" />
        <div className="h-3 w-full rounded bg-slate-100" />
        <div className="h-3 w-2/3 rounded bg-slate-100" />
      </div>
    </div>
  )
}
