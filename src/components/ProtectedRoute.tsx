import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { FullPageSpinner } from './Spinner'

type ProtectedRouteProps = {
  children: ReactNode
  /** When true the visitor must additionally have `profiles.is_admin === true`. */
  requireAdmin?: boolean
}

export function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const { session, isAdmin, loading, signOut } = useAuth()
  const location = useLocation()

  if (loading) return <FullPageSpinner label="Checking your session" />

  if (!session) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }

  if (requireAdmin && !isAdmin) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
        <h1 className="text-2xl font-semibold text-slate-900">Admins only</h1>
        <p className="max-w-md text-sm text-slate-600">
          You are signed in, but this account does not have admin rights. Set
          <code className="mx-1 rounded bg-slate-100 px-1.5 py-0.5 text-xs">is_admin</code>
          to <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">true</code> on your
          profiles row to unlock the dashboard.
        </p>
        <div className="flex gap-3">
          <a
            href="/"
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
          >
            Back to the blog
          </a>
          <button
            type="button"
            onClick={() => void signOut()}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
          >
            Sign out
          </button>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
