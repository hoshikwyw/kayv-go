import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '../supabaseClient'
import type { Post, PostCategory } from '../types/database'

export type CategoryFilter = PostCategory | 'all'

export const POSTS_PER_PAGE = 8

export function usePosts(category: CategoryFilter = 'all', pageSize = POSTS_PER_PAGE) {
  const [posts, setPosts] = useState<Post[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Bumped on every new request so a slow reply for an abandoned filter can be
  // dropped instead of overwriting the results the reader is actually looking at.
  const requestId = useRef(0)

  const fetchPage = useCallback(
    async (offset: number, append: boolean) => {
      const thisRequest = ++requestId.current

      // PostgREST returns the total in the same response as the rows, so the
      // exact count costs no extra round trip.
      let query = supabase
        .from('posts')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + pageSize - 1)

      if (category !== 'all') query = query.eq('category', category)

      const { data, count, error: queryError } = await query
      if (thisRequest !== requestId.current) return

      if (queryError) {
        setError(queryError.message)
        if (!append) {
          setPosts([])
          setTotal(0)
        }
      } else {
        setError(null)
        setTotal(count ?? 0)
        setPosts((current) => {
          if (!append) return data ?? []
          // A post published between two page loads shifts the window, so guard
          // against the same row arriving twice.
          const seen = new Set(current.map((post) => post.id))
          return [...current, ...(data ?? []).filter((post) => !seen.has(post.id))]
        })
      }

      setLoading(false)
      setLoadingMore(false)
    },
    [category, pageSize],
  )

  useEffect(() => {
    // Fetching on mount / on filter change is exactly the external-system sync
    // that effects exist for.
    // oxlint-disable-next-line react/set-state-in-effect
    setLoading(true)
    void fetchPage(0, false)
  }, [fetchPage])

  const loadMore = useCallback(() => {
    setLoadingMore(true)
    void fetchPage(posts.length, true)
  }, [fetchPage, posts.length])

  const refetch = useCallback(() => {
    setLoading(true)
    void fetchPage(0, false)
  }, [fetchPage])

  return {
    posts,
    total,
    loading,
    loadingMore,
    error,
    hasMore: posts.length < total,
    loadMore,
    refetch,
  }
}
