import { RefreshCw } from 'lucide-react'

/** Barre discrète pendant le rafraîchissement — pas de page blanche */
export function QueryStatusBar({ fetching }: { fetching: boolean }) {
  if (!fetching) return null
  return (
    <div className="mb-4 flex items-center gap-2 rounded-lg border border-gold-500/20 bg-gold-500/10 px-3 py-2 text-xs text-gold-300">
      <RefreshCw className="h-3 w-3 animate-spin" />
      Actualisation en arrière-plan…
    </div>
  )
}

export function PageSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3 animate-pulse">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-14 rounded-xl bg-ink-800/60" />
      ))}
    </div>
  )
}
