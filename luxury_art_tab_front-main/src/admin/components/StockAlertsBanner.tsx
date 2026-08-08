import { useState } from 'react'
import { AlertTriangle, PackagePlus, X } from 'lucide-react'
import { api } from '../lib/api'
import { useInvalidateAdmin, useStockAlerts } from '../hooks/useAdminQueries'
import type { StockAlert } from '../types'

export default function StockAlertsBanner() {
  const { data: alerts = [] } = useStockAlerts()
  const invalidate = useInvalidateAdmin()
  const [open, setOpen] = useState(false)
  const [restocking, setRestocking] = useState<StockAlert | null>(null)
  const [qty, setQty] = useState('10')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  if (alerts.length === 0) return null

  const handleRestock = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!restocking) return
    setError('')
    const quantite = parseInt(qty, 10)
    if (!Number.isFinite(quantite) || quantite < 1) {
      setError('Saisissez une quantité ≥ 1')
      return
    }
    setSaving(true)
    try {
      await api.restockProduct(restocking.productId, quantite)
      await invalidate.products()
      await invalidate.stockAlerts()
      setRestocking(null)
      setQty('10')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur réapprovisionnement')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
            <div>
              <p className="font-medium text-amber-200">
                {alerts.length} produit{alerts.length > 1 ? 's' : ''} en rupture de stock
              </p>
              <p className="text-sm text-amber-200/70">
                Ajoutez du stock pour remettre les articles en vente.
              </p>
            </div>
          </div>
          <button type="button" onClick={() => setOpen((v) => !v)} className="btn-ghost text-amber-200">
            {open ? 'Masquer' : 'Voir & réapprovisionner'}
          </button>
        </div>

        {open && (
          <ul className="mt-4 space-y-2 border-t border-amber-500/20 pt-4">
            {alerts.map((a) => (
              <li
                key={a.productId}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-ink-950/40 px-3 py-2"
              >
                <div>
                  <p className="text-sm text-white">{a.nom}</p>
                  <p className="text-xs text-zinc-500">
                    Stock : {a.stock} · {a.statut}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setRestocking(a)
                    setError('')
                    setQty('10')
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/15 px-3 py-1.5 text-xs font-medium text-emerald-300 hover:bg-emerald-500/25"
                >
                  <PackagePlus className="h-3.5 w-3.5" />
                  Ajouter du stock
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {restocking && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-4">
          <form onSubmit={handleRestock} className="card w-full max-w-md p-6">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold text-white">Réapprovisionner</h3>
                <p className="text-sm text-zinc-500">{restocking.nom}</p>
              </div>
              <button
                type="button"
                onClick={() => setRestocking(null)}
                className="text-zinc-500 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <label className="label">Quantité à ajouter *</label>
            <input
              className="input"
              type="number"
              min={1}
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              required
            />
            <p className="mt-2 text-xs text-zinc-500">
              Stock actuel : {restocking.stock} → après ajout :{' '}
              {restocking.stock + (parseInt(qty, 10) || 0)}
            </p>
            {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
            <div className="mt-5 flex justify-end gap-3">
              <button type="button" onClick={() => setRestocking(null)} className="btn-ghost">
                Annuler
              </button>
              <button type="submit" disabled={saving} className="btn-primary">
                {saving ? 'Enregistrement…' : 'Confirmer le stock'}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  )
}
