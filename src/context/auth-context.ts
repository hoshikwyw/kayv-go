import { createContext } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import type { Profile } from '../types/database'

export type AuthContextValue = {
  session: Session | null
  user: User | null
  profile: Profile | null
  /** True until the initial session + profile lookup has settled. */
  loading: boolean
  isAdmin: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)
