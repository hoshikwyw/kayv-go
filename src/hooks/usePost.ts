import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import type { Post } from '../types/database'

type PostState = {
  post: Post | null
  loading: boolean
  /** True when the query succeeded but matched no row. */
  notFound: boolean
  error: string | null
}

export function usePost(id: string | undefined) {
  const [state, setState] = useState<PostState>({
    post: null,
    loading: true,
    notFound: false,
    error: null,
  })

  const fetchPost = useCallback(async () => {
    if (!id) {
      setState({ post: null, loading: false, notFound: true, error: null })
      return
    }

    const { data, error } = await supabase.from('posts').select('*').eq('id', id).maybeSingle()

    if (error) {
      setState({ post: null, loading: false, notFound: false, error: error.message })
      return
    }

    setState({ post: data ?? null, loading: false, notFound: !data, error: null })
  }, [id])

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect
    setState((current) => ({ ...current, loading: true }))
    void fetchPost()
  }, [fetchPost])

  const refetch = useCallback(() => {
    setState((current) => ({ ...current, loading: true }))
    void fetchPost()
  }, [fetchPost])

  return { ...state, refetch }
}
