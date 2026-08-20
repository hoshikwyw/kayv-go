const STARS = [1, 2, 3, 4, 5]

export function StarRating({ value }: { value: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`Rated ${value} out of 5`}>
      {STARS.map((star) => (
        <span
          key={star}
          aria-hidden
          className={star <= value ? 'text-amber-400' : 'text-slate-300'}
        >
          &#9733;
        </span>
      ))}
    </span>
  )
}
