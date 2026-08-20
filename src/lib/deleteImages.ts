import { POST_IMAGE_BUCKET, supabase } from '../supabaseClient'

/**
 * Turns a Storage public URL back into the object path we uploaded to.
 * Public URLs look like:
 *   https://<ref>.supabase.co/storage/v1/object/public/<bucket>/<user>/<uuid>.jpg
 * Returns null for anything that is not from our bucket (hand-typed URLs,
 * images from an older bucket, etc.) so we never try to delete a stranger.
 */
export function publicUrlToStoragePath(url: string): string | null {
  const marker = `/storage/v1/object/public/${POST_IMAGE_BUCKET}/`
  const index = url.indexOf(marker)
  if (index === -1) return null

  const path = url.slice(index + marker.length).split('?')[0]
  return path ? decodeURIComponent(path) : null
}

/**
 * Best-effort cleanup of orphaned images. Callers run this *after* the row is
 * already saved, so a Storage hiccup is logged rather than surfaced - a leftover
 * file is a much smaller problem than a post that failed to save.
 */
export async function removePostImages(urls: string[]): Promise<void> {
  const paths = urls.map(publicUrlToStoragePath).filter((path): path is string => path !== null)
  if (paths.length === 0) return

  const { error } = await supabase.storage.from(POST_IMAGE_BUCKET).remove(paths)
  if (error) console.warn('Could not remove old images from storage:', error.message)
}
