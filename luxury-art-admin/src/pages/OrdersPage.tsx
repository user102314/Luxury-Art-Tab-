import { useState } from 'react'
import { Trash2, RefreshCw } from 'lucide-react'
import {
  api,
  formatCurrency,
  formatDate,
  ORDER_CANAL_COLORS,
  ORDER_CANAL_LABELS,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_COLORS,
} from '../lib/api'
import { PageSkeleton, QueryStatusBar } from '../components/QueryStatusBar'
import { useInvalidateAdmin, useOrders } from '../hooks/useAdminQueries'
import type { OrderStatut } from '../types'

const STATUTS: OrderStatut[] = [
  'EN_ATTENTE',
  'CONFIRMEE',
  'EXPEDIEE',
  'LIVREE',
  'ANNULEE',
]

export default function OrdersPage() {
  const { data: orders = [], isLoading, isFetching } = useOrders()
  const invalidate = useInvalidateAdmin()
  const [filter, setFilter] = useState<string>('ALL')
  const [canalFilter, setCanalFilter] = useState<string>('ALL')

  const filtered = orders.filter((o) => {
    if (filter !== 'ALL' && o.statut !== filter) return false
    if (canalFilter !== 'ALL' && o.canal !== canalFilter) return false
    return true
  })

  const updateStatut = async (id: number, statut: OrderStatut) => {
    const order = orders.find((o) => o.id === id)
    if (!order) return
    await api.updateOrder(id, { ...order, statut })
    await invalidate.orders()
    await invalidate.orderChannelStats()
    if (statut === 'ANNULEE') await invalidate.products()
  }

  const remove = async (id: number) => {
    if (!confirm('Supprimer cette commande ?')) return
    await api.deleteOrder(id)
    await invalidate.orders()
  }

  if (isLoading && orders.length === 0) {
    return <PageSkeleton rows={6} />
  }

  return (
    <div className="space-y-6">
      <QueryStatusBar fetching={isFetching} />

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-white">Gestion des commandes</h2>
          <p className="text-sm text-zinc-500">{orders.length} commande(s) au total</p>
        </div>
        <button onClick={() => invalidate.orders()} className="btn-ghost">
          <RefreshCw className="h-4 w-4" />
          Actualiser
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        <FilterBtn active={canalFilter === 'ALL'} onClick={() => setCanalFilter('ALL')} label="Tous canaux" />
        <FilterBtn active={canalFilter === 'SITE_WEB'} onClick={() => setCanalFilter('SITE_WEB')} label="Site web" />
        <FilterBtn active={canalFilter === 'FACEBOOK'} onClick={() => setCanalFilter('FACEBOOK')} label="Facebook" />
      </div>

      <div className="flex flex-wrap gap-2">
        <FilterBtn active={filter === 'ALL'} onClick={() => setFilter('ALL')} label="Toutes" />
        {STATUTS.map((s) => (
          <FilterBtn
            key={s}
            active={filter === s}
            onClick={() => setFilter(s)}
            label={ORDER_STATUS_LABELS[s]}
          />
        ))}
      </div>

      <div className="card overflow-hidden">
        {filtered.length === 0 ? (
          <p className="p-8 text-center text-zinc-500">Aucune commande</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 text-xs uppercase tracking-wider text-zinc-500">
                  <th className="px-6 py-4">#</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Canal</th>
                  <th className="px-6 py-4">Client</th>
                  <th className="px-6 py-4">Total</th>
                  <th className="px-6 py-4">Statut</th>
                  <th className="px-6 py-4">Adresse</th>
                  <th className="px-6 py-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((o) => (
                  <tr key={o.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                    <td className="px-6 py-4 font-medium text-white">{o.id}</td>
                    <td className="px-6 py-4 text-zinc-400">{formatDate(o.dateCommande)}</td>
                    <td className="px-6 py-4">
                      <span className={`rounded-full px-2 py-0.5 text-xs ${ORDER_CANAL_COLORS[o.canal ?? 'SITE_WEB']}`}>
                        {ORDER_CANAL_LABELS[o.canal ?? 'SITE_WEB']}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-zinc-300">{o.clientNom ?? o.userNom ?? `User #${o.userId}`}</td>
                    <td className="px-6 py-4 font-semibold text-gold-400">
                      {formatCurrency(Number(o.total) || 0)}
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={o.statut}
                        onChange={(e) => updateStatut(o.id, e.target.value as OrderStatut)}
                        className={`rounded-lg border-0 px-3 py-1.5 text-xs font-medium ${ORDER_STATUS_COLORS[o.statut]}`}
                      >
                        {STATUTS.map((s) => (
                          <option key={s} value={s} className="bg-ink-800 text-white">
                            {ORDER_STATUS_LABELS[s]}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="max-w-[200px] truncate px-6 py-4 text-zinc-500">
                      {o.adresseLivraison}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => remove(o.id)}
                        className="rounded-lg p-2 text-zinc-500 hover:bg-red-500/10 hover:text-red-400"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

function FilterBtn({
  active,
  onClick,
  label,
}: {
  active: boolean
  onClick: () => void
  label: string
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
        active
          ? 'bg-gold-500/20 text-gold-300'
          : 'bg-ink-800 text-zinc-400 hover:text-white'
      }`}
    >
      {label}
    </button>
  )
}
