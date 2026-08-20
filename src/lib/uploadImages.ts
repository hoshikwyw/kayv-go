import { POST_IMAGE_BUCKET, supabase } from '../supabaseClient'

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024 // 5 MB
export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif']

function fileExtension(file: File) {
  const fromName = file.name.split('.').pop()?.toLowerCase()
  if (fromName && /^[a-z0-9]{1,5}$/.test(fromName)) return fromName
  return file.type.split('/')[1] ?? 'jpg'
}

/** Rejects files that Storage (or the reader) would choke on later. */
export function validateImage(file: File): string | null {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    return `${file.name}: unsupported type (${file.type || 'unknown'})`
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return `${file.name}: larger than ${MAX_IMAGE_BYTES / 1024 / 1024} MB`
  }
  return null
}

/**
 * Uploads every file to `<bucket>/<userId>/<uuid>.<ext>` and returns the public
 * URLs in the same order. Uploads run in parallel; if any one fails the whole
 * batch rejects so the caller never writes a half-filled `image_urls` array.
 */
export async function uploadPostImages(files: File[], userId: string): Promise<string[]> {
  const uploads = files.map(async (file) => {
    const path = `${userId}/${crypto.randomUUID()}.${fileExtension(file)}`

    const { error } = await supabase.storage.from(POST_IMAGE_BUCKET).upload(path, file, {
      cacheControl: '3600',
      contentType: file.type,
      upsert: false,
    })

    if (error) throw new Error(`Upload failed for ${file.name}: ${error.message}`)

    const { data } = supabase.storage.from(POST_IMAGE_BUCKET).getPublicUrl(path)
    return data.publicUrl
  })

  return Promise.all(uploads)
}
