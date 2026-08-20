import { useState } from 'react'
import type { FormEvent } from 'react'
import { supabase } from '../../supabaseClient'
import { uploadPostImages } from '../../lib/uploadImages'
import { CATEGORY_LABELS, POST_CATEGORIES } from '../../types/database'
import type { NewPost, Post, PostCategory } from '../../types/database'
import { Spinner } from '../Spinner'
import { ImagePicker } from './ImagePicker'
import { StarRatingInput } from './StarRatingInput'

type Status = 'idle' | 'uploading' | 'saving'

type PostFormProps = {
  userId: string
  onCreated?: (post: Post) => void
}

const inputClass =
  'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 disabled:cursor-not-allowed disabled:bg-slate-50'

export function PostForm({ userId, onCreated }: PostFormProps) {
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState<PostCategory>('restaurant')
  const [locationName, setLocationName] = useState('')
  const [rating, setRating] = useState<number | null>(null)
  const [content, setContent] = useState('')
  const [files, setFiles] = useState<File[]>([])

  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState<string | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const busy = status !== 'idle'

  function resetForm() {
    setTitle('')
    setCategory('restaurant')
    setLocationName('')
    setRating(null)
    setContent('')
    setFiles([])
    setFileError(null)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setSuccess(null)

    try {
      // 1. Push the images to Storage first, so a failed upload never leaves a
      //    post row pointing at URLs that do not exist.
      let imageUrls: string[] = []
      if (files.length > 0) {
        setStatus('uploading')
        imageUrls = await uploadPostImages(files, userId)
      }

      // 2. Insert the row with the public URLs in the text[] column.
      setStatus('saving')
      const payload: NewPost = {
        user_id: userId,
        title: title.trim(),
        content: content.trim(),
        category,
        location_name: locationName.trim() || null,
        rating,
        image_urls: imageUrls,
      }

      const { data, error: insertError } = await supabase
        .from('posts')
        .insert(payload)
        .select()
        .single()

      if (insertError) throw new Error(insertError.message)

      resetForm()
      setSuccess('Post published.')
      if (data) onCreated?.(data as Post)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong while publishing.')
    } finally {
      setStatus('idle')
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
    >
      <div>
        <h2 className="text-lg font-semibold text-slate-900">New post</h2>
        <p className="mt-1 text-sm text-slate-500">
          Share a restaurant, a campsite, or a story from the road.
        </p>
      </div>

      {error && (
        <p
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {error}
        </p>
      )}
      {success && (
        <p
          role="status"
          className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700"
        >
          {success}
        </p>
      )}

      <div className="space-y-1.5">
        <label htmlFor="title" className="block text-sm font-medium text-slate-700">
          Title
        </label>
        <input
          id="title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          required
          maxLength={140}
          disabled={busy}
          placeholder="Sunset ramen at the harbour"
          className={inputClass}
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="category" className="block text-sm font-medium text-slate-700">
            Category
          </label>
          <select
            id="category"
            value={category}
            onChange={(event) => setCategory(event.target.value as PostCategory)}
            disabled={busy}
            className={inputClass}
          >
            {POST_CATEGORIES.map((value) => (
              <option key={value} value={value}>
                {CATEGORY_LABELS[value]}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="location" className="block text-sm font-medium text-slate-700">
            Location name
          </label>
          <input
            id="location"
            value={locationName}
            onChange={(event) => setLocationName(event.target.value)}
            disabled={busy}
            placeholder="Busan, South Korea"
            className={inputClass}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <span className="block text-sm font-medium text-slate-700">Rating</span>
        <StarRatingInput value={rating} onChange={setRating} disabled={busy} />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="content" className="block text-sm font-medium text-slate-700">
          Content
        </label>
        <textarea
          id="content"
          value={content}
          onChange={(event) => setContent(event.target.value)}
          required
          rows={8}
          disabled={busy}
          placeholder="What made this place worth the detour?"
          className={`${inputClass} resize-y`}
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="images" className="block text-sm font-medium text-slate-700">
          Photos
        </label>
        {fileError && (
          <p role="alert" className="text-sm text-amber-700">
            {fileError}
          </p>
        )}
        <ImagePicker
          files={files}
          onFilesChange={setFiles}
          onError={setFileError}
          disabled={busy}
        />
      </div>

      <div className="flex items-center gap-3 border-t border-slate-100 pt-5">
        <button
          type="submit"
          disabled={busy}
          className="flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy && <Spinner className="h-4 w-4" label="Publishing" />}
          {status === 'uploading' ? 'Uploading photos...' : status === 'saving' ? 'Publishing...' : 'Publish post'}
        </button>
        <button
          type="button"
          onClick={resetForm}
          disabled={busy}
          className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Clear
        </button>
      </div>
    </form>
  )
}
