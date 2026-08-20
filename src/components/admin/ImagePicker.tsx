import { useEffect, useMemo } from 'react'
import type { ChangeEvent } from 'react'
import { ACCEPTED_IMAGE_TYPES, validateImage } from '../../lib/uploadImages'

type ImagePickerProps = {
  files: File[]
  onFilesChange: (files: File[]) => void
  onError: (message: string | null) => void
  disabled?: boolean
}

function formatSize(bytes: number) {
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export function ImagePicker({ files, onFilesChange, onError, disabled = false }: ImagePickerProps) {
  const previews = useMemo(() => files.map((file) => URL.createObjectURL(file)), [files])

  // Object URLs must be revoked or the browser holds each file in memory.
  useEffect(() => () => previews.forEach((url) => URL.revokeObjectURL(url)), [previews])

  function handleSelect(event: ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(event.target.files ?? [])
    // Reset so picking the same file twice in a row still fires onChange.
    event.target.value = ''
    if (picked.length === 0) return

    const rejected: string[] = []
    const accepted: File[] = []

    for (const file of picked) {
      const problem = validateImage(file)
      if (problem) {
        rejected.push(problem)
        continue
      }
      const duplicate = files.some(
        (existing) => existing.name === file.name && existing.size === file.size,
      )
      if (!duplicate) accepted.push(file)
    }

    onError(rejected.length > 0 ? rejected.join(' | ') : null)
    if (accepted.length > 0) onFilesChange([...files, ...accepted])
  }

  function removeAt(index: number) {
    onFilesChange(files.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-3">
      <input
        id="images"
        type="file"
        multiple
        accept={ACCEPTED_IMAGE_TYPES.join(',')}
        onChange={handleSelect}
        disabled={disabled}
        className="block w-full cursor-pointer rounded-lg border border-dashed border-slate-300 bg-slate-50 p-3 text-sm text-slate-600 transition file:mr-3 file:cursor-pointer file:rounded-md file:border-0 file:bg-emerald-600 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white hover:border-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
      />

      {files.length === 0 ? (
        <p className="text-xs text-slate-500">
          JPEG, PNG, WebP, AVIF or GIF &mdash; up to 5 MB each. Select several at once.
        </p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {files.map((file, index) => (
              <figure
                key={`${file.name}-${file.size}-${index}`}
                className="group relative overflow-hidden rounded-lg border border-slate-200 bg-slate-100"
              >
                <img
                  src={previews[index]}
                  alt={file.name}
                  className="aspect-square w-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => removeAt(index)}
                  disabled={disabled}
                  aria-label={`Remove ${file.name}`}
                  className="absolute right-1.5 top-1.5 rounded-full bg-slate-900/70 px-2 py-0.5 text-xs font-semibold text-white opacity-0 transition group-hover:opacity-100 focus:opacity-100 disabled:hidden"
                >
                  &times;
                </button>
                <figcaption className="truncate bg-white px-2 py-1 text-[11px] text-slate-500">
                  {formatSize(file.size)}
                </figcaption>
              </figure>
            ))}
          </div>
          <p className="text-xs text-slate-500">
            {files.length} image{files.length > 1 ? 's' : ''} ready to upload.
          </p>
        </>
      )}
    </div>
  )
}
