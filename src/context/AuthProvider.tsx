import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../supabaseClient'
import type { Profile } from '../types/database'
import { AuthContext } from './auth-context'

type ProfileState = { userId: string; profile: Profile | null }

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [sessionLoading, setSessionLoading] = useState(true)
  const [profileState, setProfileState] = useState<ProfileState | null>(null)

  // 1. Restore any persisted session, then follow every auth change.
  useEffect(() => {
    let active = true

    void supabase.auth.getSession().then(({ data }) => {
      if (!active) return
      setSession(data.session)
      setSessionLoading(false)
    })

    // Keep this callback synchronous - awaiting Supabase calls inside it can
    // deadlock the auth client. Profile loading happens in the effect below.
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      setSessionLoading(false)
    })

    return () => {
      active = false
      subscription.subscription.unsubscribe()
    }
  }, [])

  const userId = session?.user.id ?? null

  // Derived, not stored: a profile fetched for a different user (or not yet
  // fetched) counts as "still loading" rather than "not an admin", so the
  // dashboard never flashes the access-denied screen right after sign-in.
  const profile = profileState?.userId === userId ? profileState.profile : null
  const profileLoading = userId !== null && profileState?.userId !== userId

  // 2. Load the matching profile row (this is where `is_admin` comes from).
  useEffect(() => {
    if (!userId) return

    let active = true

    void supabase
      .from('profiles')
      .select('id, username, is_admin, created_at')
      .eq('id', userId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!active) return
        if (error) console.error('Failed to load profile:', error.message)
        setProfileState({ userId, profile: data ?? null })
      })

    return () => {
      active = false
    }
  }, [userId])

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }, [])

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    setProfileState(null)
  }, [])

  const value = useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      profile,
      loading: sessionLoading || profileLoading,
      isAdmin: profile?.is_admin === true,
      signIn,
      signOut,
    }),
    [session, profile, sessionLoading, profileLoading, signIn, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
