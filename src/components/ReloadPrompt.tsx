import { useRegisterSW } from 'virtual:pwa-register/react'

/**
 * Shown when a new build has been installed by the service worker, and once
 * when the app first becomes available offline. Both dismissible.
 */
export function ReloadPrompt() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW()

  if (!offlineReady && !needRefresh) return null

  function dismiss() {
    setOfflineReady(false)
    setNeedRefresh(false)
  }

  return (
    <div
      role="status"
      className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-sm rounded-xl border border-slate-200 bg-white p-4 shadow-lg sm:left-auto sm:right-4"
    >
      <p className="text-sm text-slate-700">
        {needRefresh ? 'A new version of Kayv Go is ready.' : 'Kayv Go is ready to work offline.'}
      </p>

      <div className="mt-3 flex justify-end gap-2">
        <button
          type="button"
          onClick={dismiss}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          {needRefresh ? 'Later' : 'Got it'}
        </button>
        {needRefresh && (
          <button
            type="button"
            onClick={() => void updateServiceWorker(true)}
            className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
          >
            Reload
          </button>
        )}
      </div>
    </div>
  )
}
