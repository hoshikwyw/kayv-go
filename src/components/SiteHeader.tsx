import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export function SiteHeader() {
  const { session, isAdmin } = useAuth()

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link to="/" className="text-lg font-bold tracking-tight text-emerald-700">
          Kayv&nbsp;Go
        </Link>

        {session && isAdmin ? (
          <Link
            to="/admin"
            className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
          >
            Dashboard
          </Link>
        ) : (
          <Link
            to="/login"
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Sign in
          </Link>
        )}
      </div>
    </header>
  )
}
