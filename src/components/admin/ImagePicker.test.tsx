import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MAX_IMAGE_BYTES } from '../../lib/uploadImages'
import { ImagePicker } from './ImagePicker'

const isNativePlatform = vi.fn()
const takePhoto = vi.fn()
const pickPhotos = vi.fn()

vi.mock('../../lib/nativeCamera', () => ({
  isNativePlatform: () => isNativePlatform(),
  takePhoto: () => takePhoto(),
  pickPhotos: () => pickPhotos(),
  describeCameraError: (error: unknown) => {
    const message = error instanceof Error ? error.message : String(error)
    return /cancelled/i.test(message) ? null : message
  },
}))

function jpeg(name: string, size = 1024) {
  const file = new File(['x'], name, { type: 'image/jpeg' })
  Object.defineProperty(file, 'size', { value: size })
  return file
}

const noop = () => {}

/**
 * PostForm supplies the visible label, so the harness does too - otherwise
 * there is nothing to query the file input by.
 */
function renderPicker(props: Partial<Parameters<typeof ImagePicker>[0]> = {}) {
  return render(
    <>
      <label htmlFor="images">Photos</label>
      <ImagePicker files={[]} onFilesChange={noop} onError={noop} {...props} />
    </>,
  )
}

beforeEach(() => {
  isNativePlatform.mockReturnValue(false)
  takePhoto.mockReset()
  pickPhotos.mockReset()
})

describe('ImagePicker on the web', () => {
  it('uses a plain multi-file input', () => {
    renderPicker()

    expect(screen.getByLabelText<HTMLInputElement>('Photos', { selector: 'input' })).toHaveAttribute(
      'multiple',
    )
    expect(screen.queryByRole('button', { name: 'Take photo' })).not.toBeInTheDocument()
  })

  it('accepts a valid image', async () => {
    const user = userEvent.setup({ delay: null })
    const onFilesChange = vi.fn()

    renderPicker({ onFilesChange })
    await user.upload(screen.getByLabelText('Photos'), jpeg('a.jpg'))

    expect(onFilesChange).toHaveBeenCalledWith([expect.any(File)])
  })

  it('reports oversized files and does not add them', async () => {
    const user = userEvent.setup({ delay: null })
    const onFilesChange = vi.fn()
    const onError = vi.fn()

    renderPicker({ onFilesChange, onError })
    await user.upload(screen.getByLabelText('Photos'), jpeg('huge.jpg', MAX_IMAGE_BYTES + 1))

    expect(onError).toHaveBeenCalledWith(expect.stringMatching(/larger than/))
    expect(onFilesChange).not.toHaveBeenCalled()
  })

  it('ignores a file that is already selected', async () => {
    const user = userEvent.setup({ delay: null })
    const onFilesChange = vi.fn()
    const already = jpeg('a.jpg')

    renderPicker({ files: [already], onFilesChange })
    await user.upload(screen.getByLabelText('Photos'), jpeg('a.jpg'))

    expect(onFilesChange).not.toHaveBeenCalled()
  })
})

describe('ImagePicker inside the app shell', () => {
  beforeEach(() => {
    isNativePlatform.mockReturnValue(true)
  })

  it('swaps the file input for camera and gallery buttons', () => {
    renderPicker()

    expect(screen.getByRole('button', { name: 'Take photo' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Choose photos' })).toBeInTheDocument()
    expect(screen.queryByLabelText('Photos')).not.toBeInTheDocument()
  })

  it('adds a photo taken with the camera', async () => {
    const user = userEvent.setup({ delay: null })
    const onFilesChange = vi.fn()
    takePhoto.mockResolvedValue([jpeg('shot.jpg')])

    renderPicker({ onFilesChange })
    await user.click(screen.getByRole('button', { name: 'Take photo' }))

    await waitFor(() => expect(onFilesChange).toHaveBeenCalledWith([expect.any(File)]))
  })

  it('adds a multi-selection from the gallery', async () => {
    const user = userEvent.setup({ delay: null })
    const onFilesChange = vi.fn()
    pickPhotos.mockResolvedValue([jpeg('a.jpg'), jpeg('b.jpg')])

    renderPicker({ onFilesChange })
    await user.click(screen.getByRole('button', { name: 'Choose photos' }))

    await waitFor(() => expect(onFilesChange).toHaveBeenCalledWith([expect.any(File), expect.any(File)]))
  })

  it('stays quiet when the picker is cancelled', async () => {
    const user = userEvent.setup({ delay: null })
    const onError = vi.fn()
    takePhoto.mockRejectedValue(new Error('User cancelled photos app'))

    renderPicker({ onError })
    await user.click(screen.getByRole('button', { name: 'Take photo' }))

    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Take photo' })).not.toBeDisabled(),
    )
    expect(onError).not.toHaveBeenCalled()
  })

  it('reports a genuine camera failure', async () => {
    const user = userEvent.setup({ delay: null })
    const onError = vi.fn()
    takePhoto.mockRejectedValue(new Error('Camera permission was denied'))

    renderPicker({ onError })
    await user.click(screen.getByRole('button', { name: 'Take photo' }))

    await waitFor(() => expect(onError).toHaveBeenCalledWith('Camera permission was denied'))
  })
})
