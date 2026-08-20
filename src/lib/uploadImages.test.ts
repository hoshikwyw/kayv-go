import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MAX_IMAGE_BYTES, uploadPostImages, validateImage } from './uploadImages'

const upload = vi.fn()
const getPublicUrl = vi.fn()

vi.mock('../supabaseClient', () => ({
  POST_IMAGE_BUCKET: 'post-images',
  supabase: {
    storage: {
      from: () => ({
        upload: (...args: unknown[]) => upload(...args),
        getPublicUrl: (...args: unknown[]) => getPublicUrl(...args),
      }),
    },
  },
}))

function makeFile(name: string, type: string, size = 1024) {
  const file = new File(['x'], name, { type })
  Object.defineProperty(file, 'size', { value: size })
  return file
}

describe('validateImage', () => {
  it('accepts a normal jpeg', () => {
    expect(validateImage(makeFile('beach.jpg', 'image/jpeg'))).toBeNull()
  })

  it('rejects a non-image', () => {
    expect(validateImage(makeFile('notes.pdf', 'application/pdf'))).toMatch(/unsupported type/)
  })

  it('rejects a file with no detectable type', () => {
    expect(validateImage(makeFile('mystery', ''))).toMatch(/unknown/)
  })

  it('rejects anything over the size cap', () => {
    const tooBig = makeFile('raw.png', 'image/png', MAX_IMAGE_BYTES + 1)
    expect(validateImage(tooBig)).toMatch(/larger than/)
  })

  it('accepts a file exactly at the cap', () => {
    expect(validateImage(makeFile('edge.png', 'image/png', MAX_IMAGE_BYTES))).toBeNull()
  })
})

describe('uploadPostImages', () => {
  beforeEach(() => {
    upload.mockReset().mockResolvedValue({ error: null })
    getPublicUrl.mockReset().mockImplementation((path: string) => ({
      data: { publicUrl: `https://cdn.test/${path}` },
    }))
  })

  it('scopes the upload path to the user and keeps the file extension', async () => {
    await uploadPostImages([makeFile('sunset.JPEG', 'image/jpeg')], 'user-42')

    const [path] = upload.mock.calls[0]
    expect(path).toMatch(/^user-42\/[\w-]+\.jpeg$/)
  })

  it('falls back to the mime type when the filename has no usable extension', async () => {
    await uploadPostImages([makeFile('screenshot', 'image/png')], 'user-42')

    const [path] = upload.mock.calls[0]
    expect(path).toMatch(/\.png$/)
  })

  it('returns public URLs in the same order as the files', async () => {
    const urls = await uploadPostImages(
      [makeFile('a.jpg', 'image/jpeg'), makeFile('b.png', 'image/png')],
      'user-1',
    )

    expect(urls).toHaveLength(2)
    expect(urls[0]).toMatch(/\.jpg$/)
    expect(urls[1]).toMatch(/\.png$/)
  })

  it('rejects the whole batch if any single upload fails', async () => {
    upload
      .mockResolvedValueOnce({ error: null })
      .mockResolvedValueOnce({ error: { message: 'quota exceeded' } })

    await expect(
      uploadPostImages([makeFile('a.jpg', 'image/jpeg'), makeFile('b.jpg', 'image/jpeg')], 'u'),
    ).rejects.toThrow(/quota exceeded/)
  })
})
