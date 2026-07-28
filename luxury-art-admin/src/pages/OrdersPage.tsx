import { useMemo, useState, type ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Eye, FileText, Trash2, RefreshCw, X, Truck, ShoppingBag, Clock, CheckCircle2, Package, RotateCcw, Ban } from 'lucide-react'
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
import StatCard from '../components/StatCard'
import InvoiceModal from '../components/InvoiceModal'
import OrderTrackingDetail from '../components/OrderTrackingDetail'
import { FilterChip, ListToolbar } from '../components/ListToolbar'
import { useInvalidateAdmin, useOrders } from '../hooks/useAdminQueries'
import { queryKeys } from '../lib/queryKeys'
import {
  filterSortOrders,
  ORDER_SORT_OPTIONS,
  ORDER_STATUT_FILTER,
  ORDER_STATUTS,
} from '../lib/orderListFilters'
import type { SortDir } from '../lib/listUtils'
import type { Order, OrderStatut } from '../types'
import type { OrderSortKey } from '../lib/orderListFilters'

export default function OrdersPage() {
  const { data: orders = [], isLoading, isFetching } = useOrders()
  const invalidate = useInvalidateAdmin()
  const qc = useQueryClient()
  const [filter, setFilter] = useState<string>('ALL')
  const [canalFilter, setCanalFilter] = useState<string>('ALL')
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<OrderSortKey>('date')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [detail, setDetail] = useState<Order | null>(null)
  const [invoiceOrder, setInvoiceOrder] = useState<Order | null>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [loadingInvoice, setLoadingInvoice] = useState(false)
  const [syncingColissimo, setSyncingColissimo] = useState(false)
  const [syncMessage, setSyncMessage] = useState<string | null>(null)
  const [trackingOrderId, setTrackingOrderId] = useState<number | null>(null)

  const filtered = useMemo(() => {
    const list = filterSortOrders(orders, {
      search,
      statut: filter,
      sort,
      sortDir,
      dateFrom,
      dateTo,
    })
    if (canalFilter === 'ALL') return list
    return list.filter((o) => o.canal === canalFilter)
  }, [orders, search, filter, sort, sortDir, dateFrom, dateTo, canalFilter])

  const resetFilters = () => {
    setSearch('')
    setFilter('ALL')
    setCanalFilter('ALL')
    setSort('date')
    setSortDir('desc')
    setDateFrom('')
    setDateTo('')
  }

  const stats = useMemo(() => {
    const scoped = filterSortOrders(orders, {
      search,
      statut: 'ALL',
      sort: 'date',
      sortDir: 'desc',
      dateFrom,
      dateTo,
    }).filter((o) => canalFilter === 'ALL' || o.canal === canalFilter)

    const count = (statut: OrderStatut) => scoped.filter((o) => o.statut === statut).length
    const retours = scoped.filter((o) =>
      (o.colissimoEtat ?? '').toLowerCase().includes('retour'),
    )
    const livrees = scoped.filter((o) => o.statut === 'LIVREE')
    const caLivre = livrees.reduce((sum, o) => sum + (Number(o.total) || 0), 0)

    return {
      total: scoped.length,
      enAttente: count('EN_ATTENTE'),
      confirmees: count('CONFIRMEE'),
      expediees: count('EXPEDIEE'),
      livrees: livrees.length,
      annulees: count('ANNULEE'),
      retours: retours.length,
      caLivre,
    }
  }, [orders, search, dateFrom, dateTo, canalFilter])

  const updateStatut = async (id: number, statut: OrderStatut) => {
    const order = orders.find((o) => o.id === id)
    if (!order) return
    const updated = await api.updateOrder(id, { ...order, statut })
    await invalidate.orders()
    await invalidate.orderChannelStats()
    if (statut === 'ANNULEE') {
      await invalidate.products()
      await invalidate.stockAlerts()
    }
    if (detail?.id === id) {
      setDetail(updated)
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

  const openInvoice = async (order: Order) => {
    setLoadingInvoice(true)
    try {
      const full = await api.getOrder(order.id)
      setInvoiceOrder(full)
    } catch {
      setInvoiceOrder(order)
    } finally {
      setLoadingInvoice(false)
    }
  }

  const syncColissimo = async () => {
    setSyncingColissimo(true)
    setSyncMessage(null)
    try {
      const result = await api.syncColissimo()
      setSyncMessage(result.message)
      await invalidate.orders()
      await invalidate.orderChannelStats()
      qc.invalidateQueries({ queryKey: queryKeys.notifications })
    } catch (err) {
      setSyncMessage(err instanceof Error ? err.message : 'Erreur sync Colissimo')
    } finally {
      setSyncingColissimo(false)
    }
  }

  if (isLoading && orders.length === 0) {
    return <PageSkeleton rows={6} />
  }

  return (
    <div className="space-y-6">
      <QueryStatusBar fetching={isFetching || loadingDetail || loadingInvoice} />

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-white">Gestion des commandes</h2>
          <p className="text-sm text-zinc-500">{orders.length} commande(s) au total</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={syncColissimo}
            disabled={syncingColissimo}
            className="btn-primary"
            title="Importer les colis depuis Colissimo (Facebook, Instagram, etc.)"
          >
            <Truck className="h-4 w-4" />
            {syncingColissimo ? 'Sync Colissimo…' : 'Sync Colissimo'}
          </button>
          <button onClick={() => invalidate.orders()} className="btn-ghost">
            <RefreshCw className="h-4 w-4" />
            Actualiser
          </button>
        </div>
      </div>

      {syncMessage && (
        <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-sm text-amber-200">
          {syncMessage}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-7">
        <StatCardButton active={filter === 'ALL'} onClick={() => setFilter('ALL')}>
          <StatCard
            title="Total commandes"
            value={String(stats.total)}
            subtitle="Tous statuts"
            icon={ShoppingBag}
            accent="gold"
          />
        </StatCardButton>
        <StatCardButton active={filter === 'EN_ATTENTE'} onClick={() => setFilter('EN_ATTENTE')}>
          <StatCard
            title="En attente"
            value={String(stats.enAttente)}
            subtitle="À confirmer"
            icon={Clock}
            accent="purple"
          />
        </StatCardButton>
        <StatCardButton active={filter === 'CONFIRMEE'} onClick={() => setFilter('CONFIRMEE')}>
          <StatCard
            title="Confirmées"
            value={String(stats.confirmees)}
            subtitle="Prêtes à expédier"
            icon={CheckCircle2}
            accent="blue"
          />
        </StatCardButton>
        <StatCardButton active={filter === 'EXPEDIEE'} onClick={() => setFilter('EXPEDIEE')}>
          <StatCard
            title="Expédiées"
            value={String(stats.expediees)}
            subtitle="En cours de livraison"
            icon={Truck}
            accent="blue"
          />
        </StatCardButton>
        <StatCardButton active={filter === 'LIVREE'} onClick={() => setFilter('LIVREE')}>
          <StatCard
            title="Livrées"
            value={String(stats.livrees)}
            subtitle={`CA : ${formatCurrency(stats.caLivre)}`}
            icon={Package}
            accent="emerald"
          />
        </StatCardButton>
        <StatCardButton active={filter === 'ANNULEE'} onClick={() => setFilter('ANNULEE')}>
          <StatCard
            title="Annulées"
            value={String(stats.annulees)}
            subtitle={stats.retours > 0 ? `${stats.retours} retour(s) Colissimo` : 'Commandes annulées'}
            icon={Ban}
            accent="purple"
          />
        </StatCardButton>
        <div className="card p-6 border border-red-500/20 bg-red-500/5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Retours Colissimo</p>
              <p className="mt-2 font-display text-3xl font-bold text-red-300">{stats.retours}</p>
              <p className="mt-1 text-sm text-zinc-500">Colis retournés au dépôt</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500/20 to-red-600/5 text-red-400">
              <RotateCcw className="h-6 w-6" />
            </div>
          </div>
        </div>
      </div>

      <ListToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Rechercher client, n° commande, colis, adresse…"
        sort={sort}
        onSortChange={(v) => setSort(v as OrderSortKey)}
        sortOptions={ORDER_SORT_OPTIONS}
        sortDir={sortDir}
        onSortDirChange={setSortDir}
        showDateRange
        dateFrom={dateFrom}
        dateTo={dateTo}
        onDateFromChange={setDateFrom}
        onDateToChange={setDateTo}
        resultCount={filtered.length}
        totalCount={orders.length}
        onReset={resetFilters}
        filters={[
          {
            id: 'statut',
            label: 'Statut',
            value: filter,
            onChange: setFilter,
            options: ORDER_STATUT_FILTER,
          },
        ]}
      />

      <div className="flex flex-wrap gap-2">
        <FilterChip active={canalFilter === 'ALL'} onClick={() => setCanalFilter('ALL')} label="Tous canaux" />
        <FilterChip active={canalFilter === 'SITE_WEB'} onClick={() => setCanalFilter('SITE_WEB')} label="Site web" />
        <FilterChip active={canalFilter === 'FACEBOOK'} onClick={() => setCanalFilter('FACEBOOK')} label="Facebook" />
        <FilterChip active={canalFilter === 'INSTAGRAM'} onClick={() => setCanalFilter('INSTAGRAM')} label="Instagram" />
        <FilterChip active={canalFilter === 'WHATSAPP'} onClick={() => setCanalFilter('WHATSAPP')} label="WhatsApp" />
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
                  <th className="px-6 py-4">Colis</th>
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
                    <td className="max-w-[140px] truncate px-6 py-4 text-xs text-emerald-300/90">
                      {o.numeroColis ?? '—'}
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={o.statut}
                        onChange={(e) => updateStatut(o.id, e.target.value as OrderStatut)}
                        className={`rounded-lg border-0 px-3 py-1.5 text-xs font-medium ${ORDER_STATUS_COLORS[o.statut]}`}
                      >
                        {ORDER_STATUTS.map((s) => (
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
                          onClick={() => openInvoice(o)}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/15 px-3 py-1.5 text-xs font-medium text-emerald-300 transition hover:bg-emerald-500/25"
                        >
                          <FileText className="h-3.5 w-3.5" />
                          Facture
                        </button>
                        {(o.colissimoCodeBarre || o.numeroColis) && (
                          <button
                            type="button"
                            onClick={() => setTrackingOrderId(o.id)}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-sky-500/15 px-3 py-1.5 text-xs font-medium text-sky-300 transition hover:bg-sky-500/25"
                          >
                            <Truck className="h-3.5 w-3.5" />
                            Suivi
                          </button>
                        )}
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
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setInvoiceOrder(detail)
                    setDetail(null)
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/15 px-3 py-1.5 text-xs font-medium text-emerald-300 transition hover:bg-emerald-500/25"
                >
                  <FileText className="h-3.5 w-3.5" />
                  Créer une facture
                </button>
                <button type="button" onClick={() => setDetail(null)} className="text-zinc-500 hover:text-white">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="mb-6 grid gap-3 sm:grid-cols-2 text-sm">
              <Info label="Client" value={detail.clientNom ?? detail.userNom ?? `User #${detail.userId}`} />
              <Info label="Téléphone" value={detail.clientTelephone || '—'} />
              <Info label="Canal" value={ORDER_CANAL_LABELS[detail.canal ?? 'SITE_WEB']} />
              <Info label="Statut" value={ORDER_STATUS_LABELS[detail.statut]} />
              <Info label="Adresse" value={detail.adresseLivraison} />
              <Info label="Réf. Facebook" value={detail.referenceFacebook || '—'} />
              <Info label="Réf. Instagram" value={detail.referenceInstagram || '—'} />
              <Info label="Réf. WhatsApp" value={detail.referenceWhatsapp || '—'} />
              <Info label="N° colis" value={detail.numeroColis || '—'} />
              {detail.colissimoCodeBarre && (
                <Info label="Code Colissimo" value={detail.colissimoCodeBarre} />
              )}
              {detail.colissimoEtat && (
                <Info label="État Colissimo" value={detail.colissimoEtat} />
              )}
              {detail.colissimoDesignation && (
                <Info label="Article Colissimo" value={detail.colissimoDesignation} />
              )}
              {detail.colissimoAgence && (
                <Info label="Agence Colissimo" value={detail.colissimoAgence} />
              )}
              {detail.colissimoManifeste && (
                <Info label="N° manifeste" value={detail.colissimoManifeste} />
              )}
              <Info label="Total" value={formatCurrency(Number(detail.total) || 0)} />
            </div>

            {(detail.colissimoCodeBarre || detail.numeroColis) && (
              <button
                type="button"
                onClick={() => {
                  setTrackingOrderId(detail.id)
                  setDetail(null)
                }}
                className="mb-6 inline-flex items-center gap-2 rounded-xl bg-sky-500/15 px-4 py-2.5 text-sm font-medium text-sky-300 transition hover:bg-sky-500/25"
              >
                <Truck className="h-4 w-4" />
                Voir le suivi Colissimo détaillé
              </button>
            )}

            <h4 className="mb-3 font-semibold text-white">Articles</h4>
            {(detail.items?.length ?? 0) === 0 ? (
              <p className="text-sm text-zinc-500">
                {detail.colissimoDesignation
                  ? `Colis importé Colissimo — ${detail.colissimoDesignation}`
                  : 'Aucun article (import Colissimo)'}
              </p>
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

      {invoiceOrder && (
        <InvoiceModal order={invoiceOrder} onClose={() => setInvoiceOrder(null)} />
      )}

      {trackingOrderId != null && (
        <OrderTrackingDetail
          orderId={trackingOrderId}
          onClose={() => setTrackingOrderId(null)}
          onRefreshed={() => {
            invalidate.orders()
            invalidate.colissimoTracking()
          }}
        />
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

function StatCardButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-left transition ${active ? 'ring-2 ring-gold-500/50 rounded-2xl' : 'hover:opacity-90'}`}
    >
      {children}
    </button>
  )
}
