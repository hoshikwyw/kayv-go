type SpinnerProps = {
  className?: string
  label?: string
}

export function Spinner({ className = 'h-5 w-5', label = 'Loading' }: SpinnerProps) {
  return (
    <span
      role="status"
      aria-label={label}
      className={`inline-block animate-spin rounded-full border-2 border-current border-t-transparent ${className}`}
    />
  )
}

export function FullPageSpinner({ label = 'Loading' }: { label?: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center text-emerald-600">
      <Spinner className="h-8 w-8" label={label} />
    </div>
  )
}
