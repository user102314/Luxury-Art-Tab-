import { useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Building2,
  Eye,
  Package,
  RefreshCw,
  Truck,
  CheckCircle2,
  Clock,
  AlertCircle,
} from 'lucide-react'
import {
  api,
  formatDate,
  ORDER_CANAL_COLORS,
  ORDER_CANAL_LABELS,
  ORDER_STATUS_COLORS,
  ORDER_STATUS_LABELS,
} from '../lib/api'
import { queryKeys } from '../lib/queryKeys'
import { PageSkeleton, QueryStatusBar } from '../components/QueryStatusBar'
import OrderTrackingDetail from '../components/OrderTrackingDetail'
import { FilterChip, ListToolbar } from '../components/ListToolbar'
import { compareDates, compareStrings, inDateRange, matchesSearch, type SortDir } from '../lib/listUtils'
import type { ColissimoTrackingSummary } from '../types'

type FilterEtat = 'ALL' | 'EN_COURS' | 'LIVREE' | 'ATTENTE' | 'RETOUR'
type TrackingSortKey = 'date' | 'client' | 'etat' | 'agence'

function normalizeEtat(etat?: string) {
  return (etat ?? '').toLowerCase().replace(/é/g, 'e')
}

function etatCategory(etat?: string): FilterEtat {
  const e = normalizeEtat(etat)
  if (e.includes('livre')) return 'LIVREE'
  if (e.includes('retour')) return 'RETOUR'
  if (e.includes('attente')) return 'ATTENTE'
  return 'EN_COURS'
}

export default function ShipmentTrackingPage() {
  const qc = useQueryClient()
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState<FilterEtat>('ALL')
  const [sort, setSort] = useState<TrackingSortKey>('date')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [syncMessage, setSyncMessage] = useState<string | null>(null)

  const { data: items = [], isLoading, isFetching, refetch, isError, error } = useQuery({
    queryKey: queryKeys.colissimoTracking,
    queryFn: api.getColissimoTrackingList,
    retry: 1,
  })

  const { data: colissimoStatus } = useQuery({
    queryKey: ['colissimoStatus'],
    queryFn: api.getColissimoStatus,
  })

  const stats = useMemo(() => {
    const livrees = items.filter((i) => etatCategory(i.etat) === 'LIVREE').length
    const enCours = items.filter((i) => etatCategory(i.etat) === 'EN_COURS').length
    const attente = items.filter((i) => etatCategory(i.etat) === 'ATTENTE').length
    const retour = items.filter((i) => etatCategory(i.etat) === 'RETOUR').length
    return { total: items.length, livrees, enCours, attente, retour }
  }, [items])

  const filtered = useMemo(() => {
    let list = items.filter((item) => {
      if (filter !== 'ALL' && etatCategory(item.etat) !== filter) return false
      if (!inDateRange(item.dateCommande, dateFrom, dateTo)) return false
      if (
        !matchesSearch(q, [
          item.orderId,
          item.clientNom,
          item.codeBarre,
          item.etat,
          item.agenceActuelle,
          item.designation,
        ])
      ) {
        return false
      }
      return true
    })

    list = [...list].sort((a, b) => {
      switch (sort) {
        case 'client':
          return compareStrings(a.clientNom, b.clientNom, sortDir)
        case 'etat':
          return compareStrings(a.etatLabel ?? a.etat ?? '', b.etatLabel ?? b.etat ?? '', sortDir)
        case 'agence':
          return compareStrings(a.agenceActuelle ?? '', b.agenceActuelle ?? '', sortDir)
        case 'date':
        default:
          return compareDates(a.dateCommande, b.dateCommande, sortDir)
      }
    })

    return list
  }, [items, q, filter, sort, sortDir, dateFrom, dateTo])

  const handleSync = async () => {
    setSyncing(true)
    setSyncMessage(null)
    try {
      const result = await api.syncColissimo()
      setSyncMessage(result.message)
      await refetch()
      qc.invalidateQueries({ queryKey: queryKeys.orders })
      qc.invalidateQueries({ queryKey: queryKeys.notifications })
    } catch (err) {
      setSyncMessage(err instanceof Error ? err.message : 'Erreur de synchronisation')
    } finally {
      setSyncing(false)
    }
  }

  if (isLoading && items.length === 0) {
    return <PageSkeleton rows={8} />
  }

  return (
    <div className="space-y-6">
      <QueryStatusBar fetching={isFetching || syncing} />

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-semibold text-white">
            <Truck className="h-6 w-6 text-sky-400" />
            Suivi des livraisons
          </h2>
          <p className="text-sm text-zinc-500">
            État des colis Colissimo — transporteur, agence et progression
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => refetch()} className="btn-ghost">
            <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
            Actualiser
          </button>
          <button
            type="button"
            onClick={handleSync}
            disabled={syncing || !colissimoStatus?.configured}
            className="btn-primary"
            title={
              colissimoStatus?.configured
                ? 'Synchroniser avec Colissimo'
                : 'Colissimo non configuré'
            }
          >
            <Truck className="h-4 w-4" />
            {syncing ? 'Sync…' : 'Sync Colissimo'}
          </button>
        </div>
      </div>

      {isError && (
        <div className="flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-medium">Impossible de charger le suivi</p>
            <p className="mt-1 text-red-200/80">
              {error instanceof Error ? error.message : 'Erreur réseau — vérifiez que le backend est à jour et redémarré.'}
            </p>
          </div>
        </div>
      )}

      {!colissimoStatus?.configured && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            Colissimo n&apos;est pas configuré. Les données affichées proviennent du cache local.
            Configurez les identifiants API pour actualiser en temps réel.
          </p>
        </div>
      )}

      {syncMessage && (
        <p className="rounded-lg border border-sky-500/30 bg-sky-500/10 px-4 py-2 text-sm text-sky-200">
          {syncMessage}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard icon={Package} label="Colis suivis" value={stats.total} color="text-gold-400" />
        <StatCard icon={Clock} label="En attente" value={stats.attente} color="text-amber-400" />
        <StatCard icon={Truck} label="En cours" value={stats.enCours} color="text-sky-400" />
        <StatCard icon={CheckCircle2} label="Livrés" value={stats.livrees} color="text-emerald-400" />
        <StatCard icon={AlertCircle} label="Retours" value={stats.retour} color="text-red-400" />
      </div>

      <ListToolbar
        search={q}
        onSearchChange={setQ}
        searchPlaceholder="Rechercher commande, client, code colis, agence…"
        sort={sort}
        onSortChange={(v) => setSort(v as TrackingSortKey)}
        sortOptions={[
          { value: 'date', label: 'Date' },
          { value: 'client', label: 'Client' },
          { value: 'etat', label: 'État Colissimo' },
          { value: 'agence', label: 'Agence' },
        ]}
        sortDir={sortDir}
        onSortDirChange={setSortDir}
        showDateRange
        dateFrom={dateFrom}
        dateTo={dateTo}
        onDateFromChange={setDateFrom}
        onDateToChange={setDateTo}
        resultCount={filtered.length}
        totalCount={items.length}
        onReset={() => {
          setQ('')
          setFilter('ALL')
          setSort('date')
          setSortDir('desc')
          setDateFrom('')
          setDateTo('')
        }}
      />

      <div className="flex flex-wrap gap-2">
        {(
          [
            ['ALL', 'Tous'],
            ['ATTENTE', 'En attente'],
            ['EN_COURS', 'En cours'],
            ['LIVREE', 'Livrés'],
            ['RETOUR', 'Retours'],
          ] as const
        ).map(([key, label]) => (
          <FilterChip key={key} active={filter === key} onClick={() => setFilter(key)} label={label} />
        ))}
      </div>

      <div className="card overflow-hidden">
        {filtered.length === 0 ? (
          <p className="p-8 text-center text-zinc-500">
            Aucun colis à suivre. Les commandes avec un code Colissimo apparaîtront ici.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 text-xs uppercase tracking-wider text-zinc-500">
                  <th className="px-6 py-4">Commande</th>
                  <th className="px-6 py-4">Client</th>
                  <th className="px-6 py-4">Code colis</th>
                  <th className="px-6 py-4">État Colissimo</th>
                  <th className="px-6 py-4">Agence</th>
                  <th className="px-6 py-4">Canal</th>
                  <th className="px-6 py-4">Statut</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => (
                  <TrackingRow
                    key={item.orderId}
                    item={item}
                    onView={() => setSelectedOrderId(item.orderId)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedOrderId != null && (
        <OrderTrackingDetail
          orderId={selectedOrderId}
          onClose={() => setSelectedOrderId(null)}
          onRefreshed={() => {
            refetch()
            qc.invalidateQueries({ queryKey: queryKeys.orders })
          }}
        />
      )}
    </div>
  )
}

function TrackingRow({
  item,
  onView,
}: {
  item: ColissimoTrackingSummary
  onView: () => void
}) {
  const etat = item.etatLabel ?? item.etat ?? '—'
  const etatColor = etatCategory(item.etat)

  const etatBadge =
    etatColor === 'LIVREE'
      ? 'bg-emerald-500/20 text-emerald-300'
      : etatColor === 'RETOUR'
        ? 'bg-red-500/20 text-red-300'
        : etatColor === 'ATTENTE'
          ? 'bg-amber-500/20 text-amber-300'
          : 'bg-sky-500/20 text-sky-300'

  return (
    <tr className="border-b border-white/5 hover:bg-white/[0.02]">
      <td className="px-6 py-4 font-medium text-white">#{item.orderId}</td>
      <td className="px-6 py-4 text-zinc-300">{item.clientNom}</td>
      <td className="max-w-[120px] truncate px-6 py-4 font-mono text-xs text-sky-300">
        {item.codeBarre}
      </td>
      <td className="px-6 py-4">
        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${etatBadge}`}>{etat}</span>
      </td>
      <td className="max-w-[140px] truncate px-6 py-4 text-zinc-400">
        {item.agenceActuelle ? (
          <span className="inline-flex items-center gap-1">
            <Building2 className="h-3.5 w-3.5 shrink-0 text-violet-400" />
            {item.agenceActuelle}
          </span>
        ) : (
          '—'
        )}
      </td>
      <td className="px-6 py-4">
        {item.canal && (
          <span className={`rounded-full px-2 py-0.5 text-xs ${ORDER_CANAL_COLORS[item.canal]}`}>
            {ORDER_CANAL_LABELS[item.canal]}
          </span>
        )}
      </td>
      <td className="px-6 py-4">
        <span className={`rounded-full px-2 py-0.5 text-xs ${ORDER_STATUS_COLORS[item.orderStatut]}`}>
          {ORDER_STATUS_LABELS[item.orderStatut]}
        </span>
      </td>
      <td className="px-6 py-4 text-zinc-500">{formatDate(item.dateCommande)}</td>
      <td className="px-6 py-4">
        <button
          type="button"
          onClick={onView}
          className="inline-flex items-center gap-1.5 rounded-lg bg-sky-500/15 px-3 py-1.5 text-xs font-medium text-sky-300 transition hover:bg-sky-500/25"
        >
          <Eye className="h-3.5 w-3.5" />
          Suivi détaillé
        </button>
      </td>
    </tr>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: number
  color: string
}) {
  return (
    <div className="card flex items-center gap-4 p-4">
      <Icon className={`h-8 w-8 ${color}`} />
      <div>
        <p className={`text-2xl font-bold ${color}`}>{value}</p>
        <p className="text-sm text-zinc-500">{label}</p>
      </div>
    </div>
  )
}
