import { useCallback, useEffect, useState } from 'react'

type ImageGalleryProps = {
  images: string[]
  title: string
  /**
   * Thumbnails to render before collapsing the rest into a "+N" tile.
   * The detail page passes Infinity so nothing is hidden.
   */
  maxThumbnails?: number
}

const DEFAULT_MAX_THUMBNAILS = 5

export function ImageGallery({
  images,
  title,
  maxThumbnails = DEFAULT_MAX_THUMBNAILS,
}: ImageGalleryProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  const close = useCallback(() => setLightboxIndex(null), [])
  const step = useCallback(
    (delta: number) =>
      setLightboxIndex((current) =>
        current === null ? null : (current + delta + images.length) % images.length,
      ),
    [images.length],
  )

  useEffect(() => {
    if (lightboxIndex === null) return

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') close()
      if (event.key === 'ArrowRight') step(1)
      if (event.key === 'ArrowLeft') step(-1)
    }

    window.addEventListener('keydown', onKeyDown)
    // Stop the page behind the overlay from scrolling.
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      window.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [lightboxIndex, close, step])

  if (images.length === 0) return null

  const visible = images.slice(0, maxThumbnails)
  const hidden = images.length - visible.length

  return (
    <>
      <div
        className={
          images.length === 1
            ? 'grid grid-cols-1 gap-1.5'
            : 'grid grid-cols-2 gap-1.5 sm:grid-cols-3'
        }
      >
        {visible.map((url, index) => {
          // With 3+ photos the first one runs full width as a hero.
          const hero = images.length > 2 && index === 0
          const isLast = index === visible.length - 1

          return (
            <button
              key={url}
              type="button"
              onClick={() => setLightboxIndex(index)}
              className={`group relative overflow-hidden rounded-lg bg-slate-100 ${
                hero ? 'col-span-2 sm:col-span-3' : ''
              }`}
            >
              <img
                src={url}
                alt={`${title} - photo ${index + 1}`}
                loading="lazy"
                className={`w-full object-cover transition duration-300 group-hover:scale-[1.03] ${
                  hero ? 'aspect-16/9' : 'aspect-square'
                }`}
              />
              {isLast && hidden > 0 && (
                <span className="absolute inset-0 flex items-center justify-center bg-slate-900/55 text-lg font-semibold text-white">
                  +{hidden}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {lightboxIndex !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${title} photos`}
          onClick={close}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 p-4"
        >
          <img
            src={images[lightboxIndex]}
            alt={`${title} - photo ${lightboxIndex + 1}`}
            onClick={(event) => event.stopPropagation()}
            className="max-h-[85vh] max-w-full rounded-lg object-contain"
          />

          <button
            type="button"
            onClick={close}
            aria-label="Close"
            className="absolute right-4 top-4 rounded-full bg-white/10 px-3 py-1.5 text-xl leading-none text-white transition hover:bg-white/20"
          >
            &times;
          </button>

          {images.length > 1 && (
            <>
              <button
                type="button"
                aria-label="Previous photo"
                onClick={(event) => {
                  event.stopPropagation()
                  step(-1)
                }}
                className="absolute left-4 rounded-full bg-white/10 px-3 py-2 text-white transition hover:bg-white/20"
              >
                &#8249;
              </button>
              <button
                type="button"
                aria-label="Next photo"
                onClick={(event) => {
                  event.stopPropagation()
                  step(1)
                }}
                className="absolute right-4 rounded-full bg-white/10 px-3 py-2 text-white transition hover:bg-white/20"
              >
                &#8250;
              </button>
              <p className="absolute bottom-5 text-sm text-white/70">
                {lightboxIndex + 1} / {images.length}
              </p>
            </>
          )}
        </div>
      )}
    </>
  )
}
