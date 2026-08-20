import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { callTo, createQuery, makePost } from '../test/supabase'
import { usePosts } from './usePosts'

const from = vi.fn()

vi.mock('../supabaseClient', () => ({
  POST_IMAGE_BUCKET: 'post-images',
  supabase: { from: (...args: unknown[]) => from(...args) },
}))

beforeEach(() => {
  from.mockReset()
})

describe('usePosts', () => {
  it('loads the first page and reports the total', async () => {
    const posts = [makePost(), makePost()]
    from.mockReturnValue(createQuery({ data: posts, count: 7 }))

    const { result } = renderHook(() => usePosts('all', 2))

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.posts).toHaveLength(2)
    expect(result.current.total).toBe(7)
    expect(result.current.hasMore).toBe(true)
  })

  it('asks for exactly one page at a time', async () => {
    const query = createQuery({ data: [], count: 0 })
    from.mockReturnValue(query)

    renderHook(() => usePosts('all', 8))

    await waitFor(() => expect(callTo(query, 'range')).toBeDefined())
    expect(callTo(query, 'range')?.args).toEqual([0, 7])
  })

  it('does not filter by category when showing everything', async () => {
    const query = createQuery({ data: [], count: 0 })
    from.mockReturnValue(query)

    renderHook(() => usePosts('all'))

    await waitFor(() => expect(callTo(query, 'range')).toBeDefined())
    expect(callTo(query, 'eq')).toBeUndefined()
  })

  it('filters by category when one is selected', async () => {
    const query = createQuery({ data: [], count: 0 })
    from.mockReturnValue(query)

    renderHook(() => usePosts('campsite'))

    await waitFor(() => expect(callTo(query, 'eq')).toBeDefined())
    expect(callTo(query, 'eq')?.args).toEqual(['category', 'campsite'])
  })

  it('appends the next page and offsets by what it already has', async () => {
    const first = [makePost(), makePost()]
    const second = [makePost(), makePost()]
    const secondQuery = createQuery({ data: second, count: 4 })

    from
      .mockReturnValueOnce(createQuery({ data: first, count: 4 }))
      .mockReturnValueOnce(secondQuery)

    const { result } = renderHook(() => usePosts('all', 2))
    await waitFor(() => expect(result.current.posts).toHaveLength(2))

    act(() => result.current.loadMore())

    await waitFor(() => expect(result.current.posts).toHaveLength(4))
    expect(callTo(secondQuery, 'range')?.args).toEqual([2, 3])
    expect(result.current.hasMore).toBe(false)
  })

  it('drops a duplicate row when a new post shifts the window mid-scroll', async () => {
    const shared = makePost()
    const first = [makePost(), shared]

    from
      .mockReturnValueOnce(createQuery({ data: first, count: 3 }))
      // Page two overlaps because something was published in between.
      .mockReturnValueOnce(createQuery({ data: [shared, makePost()], count: 3 }))

    const { result } = renderHook(() => usePosts('all', 2))
    await waitFor(() => expect(result.current.posts).toHaveLength(2))

    act(() => result.current.loadMore())

    await waitFor(() => expect(result.current.loadingMore).toBe(false))
    expect(result.current.posts).toHaveLength(3)
    expect(new Set(result.current.posts.map((post) => post.id)).size).toBe(3)
  })

  it('starts over from page one when the filter changes', async () => {
    from
      .mockReturnValueOnce(createQuery({ data: [makePost(), makePost()], count: 9 }))
      .mockReturnValueOnce(createQuery({ data: [makePost(), makePost()], count: 9 }))

    const { result, rerender } = renderHook(({ category }) => usePosts(category, 2), {
      initialProps: { category: 'all' as const },
    })
    await waitFor(() => expect(result.current.posts).toHaveLength(2))

    act(() => result.current.loadMore())
    await waitFor(() => expect(result.current.posts).toHaveLength(4))

    const filtered = createQuery({ data: [makePost()], count: 1 })
    from.mockReturnValue(filtered)
    rerender({ category: 'restaurant' as never })

    await waitFor(() => expect(result.current.posts).toHaveLength(1))
    expect(callTo(filtered, 'range')?.args).toEqual([0, 1])
    expect(result.current.hasMore).toBe(false)
  })

  it('surfaces a query error and clears the list', async () => {
    from.mockReturnValue(createQuery({ error: { message: 'permission denied' } }))

    const { result } = renderHook(() => usePosts())

    await waitFor(() => expect(result.current.error).toBe('permission denied'))
    expect(result.current.posts).toEqual([])
    expect(result.current.loading).toBe(false)
  })
})
