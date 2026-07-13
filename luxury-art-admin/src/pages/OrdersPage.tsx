import { useState } from 'react'
import { Eye, Trash2, RefreshCw, X } from 'lucide-react'
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
import type { Order, OrderStatut } from '../types'

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
  const [detail, setDetail] = useState<Order | null>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)

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
    if (detail?.id === id) {
      setDetail({ ...detail, statut })
    }
  }

  const remove = async (id: number) => {
    if (!confirm('Supprimer cette commande ?')) return
    await api.deleteOrder(id)
    if (detail?.id === id) setDetail(null)
    await invalidate.orders()
  }

  const openDetail = async (order: Order) => {
    setLoadingDetail(true)
    try {
      const full = await api.getOrder(order.id)
      setDetail(full)
    } catch {
      setDetail(order)
    } finally {
      setLoadingDetail(false)
    }
  }

  if (isLoading && orders.length === 0) {
    return <PageSkeleton rows={6} />
  }

  return (
    <div className="space-y-6">
      <QueryStatusBar fetching={isFetching || loadingDetail} />

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
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => openDetail(o)}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-gold-500/15 px-3 py-1.5 text-xs font-medium text-gold-300 transition hover:bg-gold-500/25"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          Voir détail
                        </button>
                        <button
                          type="button"
                          title="Supprimer"
                          onClick={() => remove(o.id)}
                          className="rounded-lg p-2 text-zinc-500 hover:bg-red-500/10 hover:text-red-400"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="card max-h-[90vh] w-full max-w-2xl overflow-y-auto p-6">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-white">Commande #{detail.id}</h3>
                <p className="text-sm text-zinc-500">{formatDate(detail.dateCommande)}</p>
              </div>
              <button type="button" onClick={() => setDetail(null)} className="text-zinc-500 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-6 grid gap-3 sm:grid-cols-2 text-sm">
              <Info label="Client" value={detail.clientNom ?? detail.userNom ?? `User #${detail.userId}`} />
              <Info label="Téléphone" value={detail.clientTelephone || '—'} />
              <Info label="Canal" value={ORDER_CANAL_LABELS[detail.canal ?? 'SITE_WEB']} />
              <Info label="Statut" value={ORDER_STATUS_LABELS[detail.statut]} />
              <Info label="Adresse" value={detail.adresseLivraison} />
              <Info label="Réf. Facebook" value={detail.referenceFacebook || '—'} />
              <Info label="Total" value={formatCurrency(Number(detail.total) || 0)} />
            </div>

            <h4 className="mb-3 font-semibold text-white">Articles</h4>
            {(detail.items?.length ?? 0) === 0 ? (
              <p className="text-sm text-zinc-500">Aucun article</p>
            ) : (
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-xs uppercase text-zinc-500">
                    <th className="py-2">Produit</th>
                    <th className="py-2">Qté</th>
                    <th className="py-2">Prix unit.</th>
                    <th className="py-2 text-right">Sous-total</th>
                  </tr>
                </thead>
                <tbody>
                  {detail.items!.map((item, i) => (
                    <tr key={item.id ?? i} className="border-b border-white/5">
                      <td className="py-3 text-white">{item.productNom ?? `Produit #${item.productId}`}</td>
                      <td className="py-3 text-zinc-300">{item.quantite}</td>
                      <td className="py-3 text-zinc-300">{formatCurrency(Number(item.prixUnitaire) || 0)}</td>
                      <td className="py-3 text-right text-gold-400">
                        {formatCurrency((Number(item.prixUnitaire) || 0) * item.quantite)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-ink-800/50 px-4 py-3">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="mt-0.5 text-zinc-200">{value}</p>
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
