type ExistingImagesProps = {
  urls: string[]
  onRemove: (url: string) => void
  disabled?: boolean
}

/** Photos already attached to a post being edited. */
export function ExistingImages({ urls, onRemove, disabled = false }: ExistingImagesProps) {
  if (urls.length === 0) return null

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-slate-500">
        Currently attached ({urls.length})
      </p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {urls.map((url) => (
          <div
            key={url}
            className="group relative overflow-hidden rounded-lg border border-slate-200 bg-slate-100"
          >
            <img src={url} alt="" loading="lazy" className="aspect-square w-full object-cover" />
            <button
              type="button"
              onClick={() => onRemove(url)}
              disabled={disabled}
              aria-label="Remove this photo"
              className="absolute right-1.5 top-1.5 rounded-full bg-slate-900/70 px-2 py-0.5 text-xs font-semibold text-white opacity-0 transition group-hover:opacity-100 focus:opacity-100 disabled:hidden"
            >
              &times;
            </button>
          </div>
        ))}
      </div>
      <p className="text-xs text-slate-500">
        Removed photos are deleted from storage when you save.
      </p>
    </div>
  )
}
