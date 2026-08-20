import { Link } from 'react-router-dom'

// Placeholder until the public blog feed lands (Phase 4).
export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-3xl font-bold tracking-tight text-emerald-700">Kayv&nbsp;Go</h1>
      <p className="max-w-md text-sm text-slate-600">
        Travel stories, restaurant reviews and campsites. The public feed is coming next.
      </p>
      <Link
        to="/admin"
        className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
      >
        Go to admin
      </Link>
    </div>
  )
}
