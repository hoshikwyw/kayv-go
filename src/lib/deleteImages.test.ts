import { beforeEach, describe, expect, it, vi } from 'vitest'
import { publicUrlToStoragePath, removePostImages } from './deleteImages'

const remove = vi.fn()

vi.mock('../supabaseClient', () => ({
  POST_IMAGE_BUCKET: 'post-images',
  supabase: {
    storage: { from: () => ({ remove: (...args: unknown[]) => remove(...args) }) },
  },
}))

const BASE = 'https://test-project.supabase.co/storage/v1/object/public/post-images'

describe('publicUrlToStoragePath', () => {
  it('recovers the object path from a public URL', () => {
    expect(publicUrlToStoragePath(`${BASE}/user-1/abc.jpg`)).toBe('user-1/abc.jpg')
  })

  it('drops a query string', () => {
    expect(publicUrlToStoragePath(`${BASE}/user-1/abc.jpg?width=200`)).toBe('user-1/abc.jpg')
  })

  it('decodes percent-encoded segments', () => {
    expect(publicUrlToStoragePath(`${BASE}/user-1/my%20photo.jpg`)).toBe('user-1/my photo.jpg')
  })

  it('refuses a URL from another bucket', () => {
    const other = BASE.replace('post-images', 'avatars')
    expect(publicUrlToStoragePath(`${other}/user-1/abc.jpg`)).toBeNull()
  })

  it('refuses a URL that is not from Supabase storage at all', () => {
    expect(publicUrlToStoragePath('https://example.com/photo.jpg')).toBeNull()
  })
})

describe('removePostImages', () => {
  beforeEach(() => {
    remove.mockReset().mockResolvedValue({ error: null })
    vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  it('does not call storage when nothing maps to our bucket', async () => {
    await removePostImages(['https://example.com/a.jpg'])
    expect(remove).not.toHaveBeenCalled()
  })

  it('removes only the paths it could resolve', async () => {
    await removePostImages([`${BASE}/user-1/a.jpg`, 'https://example.com/b.jpg'])
    expect(remove).toHaveBeenCalledWith(['user-1/a.jpg'])
  })

  it('warns instead of throwing when storage fails', async () => {
    remove.mockResolvedValue({ error: { message: 'network down' } })

    // The caller has already saved the row - a cleanup failure must not surface.
    await expect(removePostImages([`${BASE}/user-1/a.jpg`])).resolves.toBeUndefined()
    expect(console.warn).toHaveBeenCalled()
  })
})
