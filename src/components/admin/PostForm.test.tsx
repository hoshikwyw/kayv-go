import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { callTo, createQuery, makePost } from '../../test/supabase'
import { PostForm } from './PostForm'

const from = vi.fn()
const uploadPostImages = vi.fn()
const removePostImages = vi.fn()

vi.mock('../../supabaseClient', () => ({
  POST_IMAGE_BUCKET: 'post-images',
  supabase: { from: (...args: unknown[]) => from(...args) },
}))

vi.mock('../../lib/uploadImages', async (importOriginal) => ({
  // ImagePicker still needs the real validation helpers.
  ...(await importOriginal<typeof import('../../lib/uploadImages')>()),
  uploadPostImages: (...args: unknown[]) => uploadPostImages(...args),
}))

vi.mock('../../lib/deleteImages', () => ({
  removePostImages: (...args: unknown[]) => removePostImages(...args),
  publicUrlToStoragePath: () => null,
}))

function jpeg(name: string) {
  return new File(['x'], name, { type: 'image/jpeg' })
}

beforeEach(() => {
  from.mockReset()
  uploadPostImages.mockReset().mockResolvedValue([])
  removePostImages.mockReset().mockResolvedValue(undefined)
})

describe('PostForm - creating', () => {
  it('inserts the trimmed fields with the author attached', async () => {
    const user = userEvent.setup({ delay: null })
    const query = createQuery({ data: makePost() })
    from.mockReturnValue(query)

    render(<PostForm userId="user-7" />)

    await user.type(screen.getByLabelText('Title'), '  Sunset ramen  ')
    await user.selectOptions(screen.getByLabelText('Category'), 'campsite')
    await user.type(screen.getByLabelText('Location name'), ' Busan ')
    await user.type(screen.getByLabelText('Content'), '  Worth the detour.  ')
    await user.click(screen.getByRole('radio', { name: '4 stars' }))
    await user.click(screen.getByRole('button', { name: 'Publish post' }))

    await waitFor(() => expect(callTo(query, 'insert')).toBeDefined())
    expect(callTo(query, 'insert')?.args[0]).toEqual({
      user_id: 'user-7',
      title: 'Sunset ramen',
      content: 'Worth the detour.',
      category: 'campsite',
      location_name: 'Busan',
      rating: 4,
      image_urls: [],
    })
  })

  it('stores a blank location as null rather than an empty string', async () => {
    const user = userEvent.setup({ delay: null })
    const query = createQuery({ data: makePost() })
    from.mockReturnValue(query)

    render(<PostForm userId="user-7" />)
    await user.type(screen.getByLabelText('Title'), 'A story')
    await user.type(screen.getByLabelText('Content'), 'Some words.')
    await user.click(screen.getByRole('button', { name: 'Publish post' }))

    await waitFor(() => expect(callTo(query, 'insert')).toBeDefined())
    const payload = callTo(query, 'insert')?.args[0] as Record<string, unknown>
    expect(payload.location_name).toBeNull()
    expect(payload.rating).toBeNull()
  })

  it('uploads photos before inserting, and saves the returned URLs', async () => {
    const user = userEvent.setup({ delay: null })
    const order: string[] = []

    uploadPostImages.mockImplementation(async () => {
      order.push('upload')
      return ['https://cdn.test/a.jpg']
    })
    const query = createQuery({ data: makePost() })
    from.mockImplementation(() => {
      order.push('from')
      return query
    })

    render(<PostForm userId="user-7" />)
    await user.type(screen.getByLabelText('Title'), 'With photos')
    await user.type(screen.getByLabelText('Content'), 'Some words.')
    await user.upload(screen.getByLabelText('Photos'), jpeg('a.jpg'))
    await user.click(screen.getByRole('button', { name: 'Publish post' }))

    await waitFor(() => expect(callTo(query, 'insert')).toBeDefined())
    expect(order).toEqual(['upload', 'from'])
    expect(uploadPostImages).toHaveBeenCalledWith([expect.any(File)], 'user-7')
    const payload = callTo(query, 'insert')?.args[0] as Record<string, unknown>
    expect(payload.image_urls).toEqual(['https://cdn.test/a.jpg'])
  })

  it('does not insert anything when the upload fails', async () => {
    const user = userEvent.setup({ delay: null })
    uploadPostImages.mockRejectedValue(new Error('Upload failed for a.jpg: quota exceeded'))

    render(<PostForm userId="user-7" />)
    await user.type(screen.getByLabelText('Title'), 'With photos')
    await user.type(screen.getByLabelText('Content'), 'Some words.')
    await user.upload(screen.getByLabelText('Photos'), jpeg('a.jpg'))
    await user.click(screen.getByRole('button', { name: 'Publish post' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('quota exceeded')
    expect(from).not.toHaveBeenCalled()
  })

  it('shows the database error instead of claiming success', async () => {
    const user = userEvent.setup({ delay: null })
    from.mockReturnValue(createQuery({ error: { message: 'new row violates row-level security' } }))

    render(<PostForm userId="user-7" />)
    await user.type(screen.getByLabelText('Title'), 'Blocked')
    await user.type(screen.getByLabelText('Content'), 'Some words.')
    await user.click(screen.getByRole('button', { name: 'Publish post' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('row-level security')
    expect(screen.queryByText('Post published.')).not.toBeInTheDocument()
  })

  it('clears the form after a successful publish', async () => {
    const user = userEvent.setup({ delay: null })
    from.mockReturnValue(createQuery({ data: makePost() }))

    render(<PostForm userId="user-7" />)
    const title = screen.getByLabelText('Title')
    await user.type(title, 'Sunset ramen')
    await user.type(screen.getByLabelText('Content'), 'Some words.')
    await user.click(screen.getByRole('button', { name: 'Publish post' }))

    await screen.findByText('Post published.')
    expect(title).toHaveValue('')
  })
})

describe('PostForm - editing', () => {
  const existing = makePost({
    id: 'post-abc',
    title: 'Old title',
    category: 'campsite',
    location_name: 'Jeju',
    rating: 3,
    content: 'Old content',
    image_urls: ['https://cdn.test/keep.jpg', 'https://cdn.test/drop.jpg'],
  })

  it('pre-fills every field from the post', () => {
    from.mockReturnValue(createQuery({ data: existing }))
    render(<PostForm userId="user-7" post={existing} />)

    expect(screen.getByLabelText('Title')).toHaveValue('Old title')
    expect(screen.getByLabelText('Category')).toHaveValue('campsite')
    expect(screen.getByLabelText('Location name')).toHaveValue('Jeju')
    expect(screen.getByLabelText('Content')).toHaveValue('Old content')
    expect(screen.getByRole('radio', { name: '3 stars' })).toBeChecked()
    expect(screen.getByText('Currently attached (2)')).toBeInTheDocument()
  })

  it('updates the right row and never reassigns ownership', async () => {
    const user = userEvent.setup({ delay: null })
    const query = createQuery({ data: existing })
    from.mockReturnValue(query)

    render(<PostForm userId="someone-else" post={existing} />)
    await user.clear(screen.getByLabelText('Title'))
    await user.type(screen.getByLabelText('Title'), 'New title')
    await user.click(screen.getByRole('button', { name: 'Save changes' }))

    await waitFor(() => expect(callTo(query, 'update')).toBeDefined())
    const payload = callTo(query, 'update')?.args[0] as Record<string, unknown>
    expect(payload.title).toBe('New title')
    expect(payload).not.toHaveProperty('user_id')
    expect(callTo(query, 'eq')?.args).toEqual(['id', 'post-abc'])
    expect(callTo(query, 'insert')).toBeUndefined()
  })

  it('deletes detached photos from storage only after the row is saved', async () => {
    const user = userEvent.setup({ delay: null })
    const saved = { ...existing, image_urls: ['https://cdn.test/keep.jpg'] }
    from.mockReturnValue(createQuery({ data: saved }))

    render(<PostForm userId="user-7" post={existing} />)
    const removeButtons = screen.getAllByRole('button', { name: 'Remove this photo' })
    await user.click(removeButtons[1])

    expect(removePostImages).not.toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: 'Save changes' }))

    await waitFor(() => expect(removePostImages).toHaveBeenCalledWith(['https://cdn.test/drop.jpg']))
  })

  it('leaves storage alone when no photos were detached', async () => {
    const user = userEvent.setup({ delay: null })
    from.mockReturnValue(createQuery({ data: existing }))

    render(<PostForm userId="user-7" post={existing} />)
    await user.click(screen.getByRole('button', { name: 'Save changes' }))

    await screen.findByText('Changes saved.')
    expect(removePostImages).not.toHaveBeenCalled()
  })
})
