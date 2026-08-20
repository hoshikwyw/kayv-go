import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import type { Post, PostCategory } from '../types/database'

export type CategoryFilter = PostCategory | 'all'

export function usePosts(category: CategoryFilter = 'all') {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPosts = useCallback(async () => {
    let query = supabase.from('posts').select('*').order('created_at', { ascending: false })
    if (category !== 'all') query = query.eq('category', category)

    const { data, error: queryError } = await query

    if (queryError) {
      setError(queryError.message)
      setPosts([])
    } else {
      setError(null)
      setPosts(data ?? [])
    }
    setLoading(false)
  }, [category])

  useEffect(() => {
    // Fetching on mount / on filter change is exactly the external-system sync
    // that effects exist for.
    // oxlint-disable-next-line react/set-state-in-effect
    setLoading(true)
    void fetchPosts()
  }, [fetchPosts])

  const refetch = useCallback(() => {
    setLoading(true)
    void fetchPosts()
  }, [fetchPosts])

  return { posts, loading, error, refetch }
}
