type StarRatingInputProps = {
  value: number | null
  onChange: (value: number | null) => void
  disabled?: boolean
}

const STARS = [1, 2, 3, 4, 5]

export function StarRatingInput({ value, onChange, disabled = false }: StarRatingInputProps) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1" role="radiogroup" aria-label="Rating">
        {STARS.map((star) => {
          const active = value !== null && star <= value
          return (
            <button
              key={star}
              type="button"
              role="radio"
              aria-checked={value === star}
              aria-label={`${star} star${star > 1 ? 's' : ''}`}
              disabled={disabled}
              // Clicking the current rating clears it, so a post can have no score.
              onClick={() => onChange(value === star ? null : star)}
              className="rounded p-0.5 text-2xl leading-none transition hover:scale-110 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span className={active ? 'text-amber-400' : 'text-slate-300'}>&#9733;</span>
            </button>
          )
        })}
      </div>
      <span className="text-sm text-slate-500">
        {value ? `${value}/5` : 'No rating'}
      </span>
    </div>
  )
}
