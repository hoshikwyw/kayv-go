import { useState } from 'react'
import type { FormEvent } from 'react'
import { supabase } from '../../supabaseClient'
import { removePostImages } from '../../lib/deleteImages'
import { uploadPostImages } from '../../lib/uploadImages'
import { CATEGORY_LABELS, POST_CATEGORIES } from '../../types/database'
import type { NewPost, Post, PostCategory } from '../../types/database'
import { Spinner } from '../Spinner'
import { ExistingImages } from './ExistingImages'
import { ImagePicker } from './ImagePicker'
import { StarRatingInput } from './StarRatingInput'

type Status = 'idle' | 'uploading' | 'saving'

type PostFormProps = {
  userId: string
  /** When provided the form edits this post instead of creating a new one. */
  post?: Post | null
  onSaved?: (post: Post, mode: 'created' | 'updated') => void
  onCancelEdit?: () => void
}

const inputClass =
  'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 disabled:cursor-not-allowed disabled:bg-slate-50'

/**
 * Mount this with a key of the post id (or 'new') so switching between posts,
 * or back to create mode, resets every field instead of leaking the last one.
 */
export function PostForm({ userId, post = null, onSaved, onCancelEdit }: PostFormProps) {
  const isEditing = post !== null

  const [title, setTitle] = useState(post?.title ?? '')
  const [category, setCategory] = useState<PostCategory>(post?.category ?? 'restaurant')
  const [locationName, setLocationName] = useState(post?.location_name ?? '')
  const [rating, setRating] = useState<number | null>(post?.rating ?? null)
  const [content, setContent] = useState(post?.content ?? '')
  const [existingUrls, setExistingUrls] = useState<string[]>(post?.image_urls ?? [])
  const [files, setFiles] = useState<File[]>([])

  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState<string | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const busy = status !== 'idle'

  function resetForm() {
    setTitle(post?.title ?? '')
    setCategory(post?.category ?? 'restaurant')
    setLocationName(post?.location_name ?? '')
    setRating(post?.rating ?? null)
    setContent(post?.content ?? '')
    setExistingUrls(post?.image_urls ?? [])
    setFiles([])
    setFileError(null)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setSuccess(null)

    try {
      // 1. Push new images to Storage first, so a failed upload never leaves a
      //    row pointing at URLs that do not exist.
      let uploadedUrls: string[] = []
      if (files.length > 0) {
        setStatus('uploading')
        uploadedUrls = await uploadPostImages(files, userId)
      }

      setStatus('saving')
      // `user_id` is deliberately not part of an update - editing a post must
      // never quietly transfer its ownership to whoever is signed in.
      const fields: Omit<NewPost, 'user_id'> = {
        title: title.trim(),
        content: content.trim(),
        category,
        location_name: locationName.trim() || null,
        rating,
        image_urls: [...existingUrls, ...uploadedUrls],
      }

      const query = isEditing
        ? supabase.from('posts').update(fields).eq('id', post.id)
        : supabase.from('posts').insert({ ...fields, user_id: userId })

      const { data, error: saveError } = await query.select().single()
      if (saveError) throw new Error(saveError.message)

      // 2. Only once the row is safely saved, clean up photos the author
      //    dropped during this edit. Best-effort: failures are logged, not shown.
      if (isEditing) {
        const dropped = (post.image_urls ?? []).filter((url) => !existingUrls.includes(url))
        if (dropped.length > 0) void removePostImages(dropped)
      }

      setFiles([])
      setFileError(null)
      if (!isEditing) resetForm()
      setSuccess(isEditing ? 'Changes saved.' : 'Post published.')

      if (data) {
        const saved = data as Post
        setExistingUrls(saved.image_urls ?? [])
        onSaved?.(saved, isEditing ? 'updated' : 'created')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong while saving.')
    } finally {
      setStatus('idle')
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            {isEditing ? 'Edit post' : 'New post'}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {isEditing
              ? 'Update the details below and save your changes.'
              : 'Share a restaurant, a campsite, or a story from the road.'}
          </p>
        </div>
        {isEditing && (
          <button
            type="button"
            onClick={onCancelEdit}
            disabled={busy}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
          >
            Cancel edit
          </button>
        )}
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

      <div className="space-y-3">
        <label htmlFor="images" className="block text-sm font-medium text-slate-700">
          Photos
        </label>

        <ExistingImages
          urls={existingUrls}
          onRemove={(url) => setExistingUrls((current) => current.filter((it) => it !== url))}
          disabled={busy}
        />

        {fileError && (
          <p role="alert" className="text-sm text-amber-700">
            {fileError}
          </p>
        )}
        <ImagePicker files={files} onFilesChange={setFiles} onError={setFileError} disabled={busy} />
      </div>

      <div className="flex items-center gap-3 border-t border-slate-100 pt-5">
        <button
          type="submit"
          disabled={busy}
          className="flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy && <Spinner className="h-4 w-4" label="Saving" />}
          {status === 'uploading'
            ? 'Uploading photos...'
            : status === 'saving'
              ? 'Saving...'
              : isEditing
                ? 'Save changes'
                : 'Publish post'}
        </button>
        <button
          type="button"
          onClick={resetForm}
          disabled={busy}
          className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isEditing ? 'Revert' : 'Clear'}
        </button>
      </div>
    </form>
  )
}
