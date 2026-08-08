import { useMemo, useState } from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import StatCard, { Package, ShoppingBag, TrendingUp, formatCurrency } from '../components/StatCard'
import { PageSkeleton, QueryStatusBar } from '../components/QueryStatusBar'
import {
  useAllProductStats,
  useDashboardSummary,
  useOrders,
  useSalesOverTime,
  useTopProductsAnalytics,
} from '../hooks/useAdminQueries'
import type { SalesGranularity, TopProductCriteria } from '../types'
import { formatDate, ORDER_STATUS_LABELS } from '../lib/api'
import { Clock } from 'lucide-react'

type PeriodPreset = '7d' | '30d' | 'custom'
type SortKey =
  | 'productName'
  | 'totalViews'
  | 'totalClicks'
  | 'totalAddToCart'
  | 'totalSales'
  | 'revenue'
  | 'conversionRate'

function toIsoDate(d: Date) {
  return d.toISOString().slice(0, 10)
}

function daysAgo(n: number) {
  const d = new Date()
  d.setHours(12, 0, 0, 0)
  d.setDate(d.getDate() - n)
  return d
}

function formatPct(rate: number) {
  return `${(rate * 100).toFixed(1)} %`
}

function formatChartDate(iso: string) {
  return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short' }).format(new Date(iso))
}

export default function AnalyticsPage() {
  const [preset, setPreset] = useState<PeriodPreset>('30d')
  const [customFrom, setCustomFrom] = useState(toIsoDate(daysAgo(30)))
  const [customTo, setCustomTo] = useState(toIsoDate(new Date()))
  const [granularity, setGranularity] = useState<SalesGranularity>('DAY')
  const [criteria, setCriteria] = useState<TopProductCriteria>('SALES')
  const [sortKey, setSortKey] = useState<SortKey>('totalSales')
  const [sortAsc, setSortAsc] = useState(false)

  const { from, to } = useMemo(() => {
    if (preset === '7d') return { from: toIsoDate(daysAgo(6)), to: toIsoDate(new Date()) }
    if (preset === '30d') return { from: toIsoDate(daysAgo(29)), to: toIsoDate(new Date()) }
    return { from: customFrom, to: customTo }
  }, [preset, customFrom, customTo])

  const summaryQ = useDashboardSummary(from, to)
  const seriesQ = useSalesOverTime(from, to, granularity)
  const topQ = useTopProductsAnalytics(criteria, 8, from, to)
  const topViewsQ = useTopProductsAnalytics('VIEWS', 5, from, to)
  const topClicksQ = useTopProductsAnalytics('CLICKS', 5, from, to)
  const topSalesQ = useTopProductsAnalytics('SALES', 5, from, to)
  const topCartQ = useTopProductsAnalytics('ADD_TO_CART', 5, from, to)
  const tableQ = useAllProductStats(from, to)
  const { data: orders = [] } = useOrders()

  const unconfirmed = orders.filter((o) => o.statut === 'EN_ATTENTE')

  const summary = summaryQ.data
  const chartData = (seriesQ.data ?? []).map((p) => ({
    label: formatChartDate(p.date),
    value: Number(p.value) || 0,
  }))
  const topData = (topQ.data ?? []).map((p) => ({
    name: p.productName.length > 18 ? `${p.productName.slice(0, 16)}…` : p.productName,
    value:
      criteria === 'VIEWS'
        ? p.totalViews
        : criteria === 'CLICKS'
          ? p.totalClicks
          : criteria === 'ADD_TO_CART'
            ? Number(p.totalAddToCart) || 0
            : p.totalSales,
  }))

  const rows = useMemo(() => {
    const list = [...(tableQ.data ?? [])].map((r) => ({
      ...r,
      totalAddToCart: Number(r.totalAddToCart) || 0,
    }))
    list.sort((a, b) => {
      const av = a[sortKey]
      const bv = b[sortKey]
      if (typeof av === 'string' && typeof bv === 'string') {
        return sortAsc ? av.localeCompare(bv) : bv.localeCompare(av)
      }
      return sortAsc ? Number(av) - Number(bv) : Number(bv) - Number(av)
    })
    return list
  }, [tableQ.data, sortKey, sortAsc])

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc((v) => !v)
    else {
      setSortKey(key)
      setSortAsc(false)
    }
  }

  const loading = summaryQ.isLoading || seriesQ.isLoading
  const fetching =
    summaryQ.isFetching || seriesQ.isFetching || topQ.isFetching || tableQ.isFetching

  if (loading) return <PageSkeleton rows={8} />

  return (
    <div className="space-y-8">
      <QueryStatusBar fetching={fetching} />

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-xl font-semibold text-white">Analytics e-commerce</h2>
          <p className="text-sm text-zinc-500">
            Vues, clics, ventes et conversion — période {from} → {to}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {(
            [
              ['7d', '7 jours'],
              ['30d', '30 jours'],
              ['custom', 'Personnalisé'],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setPreset(key)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                preset === key
                  ? 'bg-gold-500/20 text-gold-300'
                  : 'bg-white/5 text-zinc-400 hover:text-white'
              }`}
            >
              {label}
            </button>
          ))}
          {preset === 'custom' && (
            <>
              <input
                type="date"
                className="input"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
              />
              <input
                type="date"
                className="input"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
              />
            </>
          )}
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          title="Chiffre d'affaires"
          value={formatCurrency(Number(summary?.totalRevenue) || 0)}
          subtitle="Commandes livrées"
          icon={TrendingUp}
          accent="gold"
        />
        <StatCard
          title="Commandes"
          value={String(summary?.totalOrders ?? 0)}
          subtitle="Hors annulées"
          icon={ShoppingBag}
          accent="blue"
        />
        <StatCard
          title="Non confirmées"
          value={String(unconfirmed.length)}
          subtitle="Statut EN_ATTENTE"
          icon={Clock}
          accent="purple"
        />
        <StatCard
          title="Panier moyen"
          value={formatCurrency(Number(summary?.averageOrderValue) || 0)}
          subtitle={`${summary?.totalActiveProducts ?? 0} produits actifs`}
          icon={Package}
          accent="emerald"
        />
        <StatCard
          title="Taux de conversion"
          value={formatPct(Number(summary?.conversionRate) || 0)}
          subtitle="Commandes / vues produit"
          icon={TrendingUp}
          accent="gold"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
        <MiniTopCard title="Plus visités (vues)" rows={topViewsQ.data ?? []} metric={(p) => p.totalViews} />
        <MiniTopCard title="Plus touchés (clics)" rows={topClicksQ.data ?? []} metric={(p) => p.totalClicks} />
        <MiniTopCard
          title="Ajouts panier"
          rows={topCartQ.data ?? []}
          metric={(p) => Number(p.totalAddToCart) || 0}
        />
        <MiniTopCard title="Plus vendus" rows={topSalesQ.data ?? []} metric={(p) => p.totalSales} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h3 className="font-semibold text-white">CA dans le temps</h3>
            <div className="flex gap-1">
              {(
                [
                  ['DAY', 'Jour'],
                  ['WEEK', 'Semaine'],
                  ['MONTH', 'Mois'],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setGranularity(key)}
                  className={`rounded-lg px-2.5 py-1 text-xs ${
                    granularity === key
                      ? 'bg-gold-500/20 text-gold-300'
                      : 'text-zinc-500 hover:text-white'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="caFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
              <XAxis dataKey="label" stroke="#71717a" fontSize={11} />
              <YAxis stroke="#71717a" fontSize={11} />
              <Tooltip
                contentStyle={{ background: '#1a1a1f', border: '1px solid #333', borderRadius: 8 }}
                formatter={(v: number) => [formatCurrency(v), 'CA']}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#f59e0b"
                fill="url(#caFill)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h3 className="font-semibold text-white">Top produits</h3>
            <div className="flex gap-1">
              {(
                [
                  ['VIEWS', 'Vues'],
                  ['CLICKS', 'Clics'],
                  ['ADD_TO_CART', 'Paniers'],
                  ['SALES', 'Ventes'],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setCriteria(key)}
                  className={`rounded-lg px-2.5 py-1 text-xs ${
                    criteria === key
                      ? 'bg-gold-500/20 text-gold-300'
                      : 'text-zinc-500 hover:text-white'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={topData} layout="vertical" margin={{ left: 8, right: 16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
              <XAxis type="number" stroke="#71717a" fontSize={11} />
              <YAxis type="category" dataKey="name" width={110} stroke="#71717a" fontSize={11} />
              <Tooltip
                contentStyle={{ background: '#1a1a1f', border: '1px solid #333', borderRadius: 8 }}
              />
              <Bar dataKey="value" fill="#f59e0b" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="border-b border-white/10 px-6 py-4">
          <h3 className="font-semibold text-white">Stats détaillées par produit</h3>
          <p className="text-xs text-zinc-500">Cliquez une colonne pour trier</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-900/80 text-xs uppercase tracking-wider text-zinc-500">
              <tr>
                {(
                  [
                    ['productName', 'Produit'],
                    ['totalViews', 'Vues'],
                    ['totalClicks', 'Clics'],
                    ['totalAddToCart', 'Paniers'],
                    ['totalSales', 'Ventes'],
                    ['revenue', 'CA'],
                    ['conversionRate', 'Conversion'],
                  ] as const
                ).map(([key, label]) => (
                  <th key={key} className="px-4 py-3 font-medium">
                    <button type="button" onClick={() => toggleSort(key)} className="hover:text-gold-300">
                      {label}
                      {sortKey === key ? (sortAsc ? ' ↑' : ' ↓') : ''}
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-zinc-500">
                    Aucune donnée sur cette période
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.productId} className="border-t border-white/5 hover:bg-white/[0.02]">
                    <td className="px-4 py-3 font-medium text-white">{row.productName}</td>
                    <td className="px-4 py-3 text-zinc-300">{row.totalViews}</td>
                    <td className="px-4 py-3 text-zinc-300">{row.totalClicks}</td>
                    <td className="px-4 py-3 text-zinc-300">{row.totalAddToCart}</td>
                    <td className="px-4 py-3 text-zinc-300">{row.totalSales}</td>
                    <td className="px-4 py-3 text-gold-300">
                      {formatCurrency(Number(row.revenue) || 0)}
                    </td>
                    <td className="px-4 py-3 text-emerald-300">{formatPct(Number(row.conversionRate) || 0)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="border-b border-white/10 px-6 py-4">
          <h3 className="font-semibold text-white">Commandes non confirmées (EN_ATTENTE)</h3>
          <p className="text-xs text-zinc-500">{unconfirmed.length} commande(s) en attente de confirmation</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-900/80 text-xs uppercase tracking-wider text-zinc-500">
              <tr>
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Statut</th>
              </tr>
            </thead>
            <tbody>
              {unconfirmed.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-zinc-500">
                    Aucune commande en attente
                  </td>
                </tr>
              ) : (
                unconfirmed
                  .slice()
                  .sort((a, b) => new Date(b.dateCommande).getTime() - new Date(a.dateCommande).getTime())
                  .map((o) => (
                    <tr key={o.id} className="border-t border-white/5">
                      <td className="px-4 py-3 text-white">{o.id}</td>
                      <td className="px-4 py-3 text-zinc-400">{formatDate(o.dateCommande)}</td>
                      <td className="px-4 py-3 text-zinc-300">{o.clientNom ?? o.userNom ?? `#${o.userId}`}</td>
                      <td className="px-4 py-3 text-gold-300">{formatCurrency(Number(o.total) || 0)}</td>
                      <td className="px-4 py-3 text-amber-300">{ORDER_STATUS_LABELS[o.statut]}</td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function MiniTopCard({
  title,
  rows,
  metric,
}: {
  title: string
  rows: import('../types').ProductStats[]
  metric: (p: import('../types').ProductStats) => number
}) {
  return (
    <div className="card p-4">
      <h3 className="mb-3 text-sm font-semibold text-white">{title}</h3>
      {rows.length === 0 ? (
        <p className="text-xs text-zinc-500">Pas encore de données</p>
      ) : (
        <ul className="space-y-2">
          {rows.map((p, i) => (
            <li key={p.productId} className="flex items-center justify-between gap-2 text-sm">
              <span className="truncate text-zinc-300">
                <span className="mr-1 text-zinc-500">#{i + 1}</span>
                {p.productName}
              </span>
              <span className="shrink-0 font-medium text-gold-300">{metric(p)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
