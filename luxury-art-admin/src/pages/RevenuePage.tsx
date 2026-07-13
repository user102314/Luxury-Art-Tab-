import { Link } from 'react-router-dom'
import { useState } from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { FileBarChart, RefreshCw, Clock, CheckCircle, Facebook, Package } from 'lucide-react'
import StatCard, { TrendingUp, formatCurrency } from '../components/StatCard'
import { PageSkeleton, QueryStatusBar } from '../components/QueryStatusBar'
import {
  useDashboardStats,
  useInvalidateAdmin,
  useOrderChannelStats,
  useOrders,
  useProducts,
} from '../hooks/useAdminQueries'
import {
  api,
  computeRevenue,
  formatDate,
  isRevenueOrder,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_COLORS,
  revenueByDay,
} from '../lib/api'

const PIE_COLORS = ['#f59e0b', '#3b82f6', '#71717a']

export default function RevenuePage() {
  const { data: orders = [], isLoading: loadingOrders, isFetching: fetchingOrders } = useOrders()
  const { data: reports = [], isLoading: loadingReports, isFetching: fetchingReports } = useDashboardStats()
  const { data: products = [] } = useProducts()
  const { data: channelStats } = useOrderChannelStats()
  const invalidate = useInvalidateAdmin()
  const [generating, setGenerating] = useState(false)

  const stats = computeRevenue(orders)
  const chartData = revenueByDay(orders)
  const breakdownData = [
    { name: 'Livrées (CA)', montant: stats.total, count: stats.count },
    { name: 'Confirmées', montant: stats.confirmedAmount, count: stats.confirmed },
    { name: 'En attente', montant: stats.pendingAmount, count: stats.pending },
  ]
  const statusPie = [
    { name: 'Livrées (CA)', value: stats.total },
    { name: 'Confirmées', value: stats.confirmedOnlyAmount },
  ].filter((s) => s.value > 0)

  const recent = [...orders]
    .sort((a, b) => new Date(b.dateCommande).getTime() - new Date(a.dateCommande).getTime())
    .slice(0, 5)

  const handleGenerate = async () => {
    setGenerating(true)
    try {
      await api.genererRapport()
      await invalidate.dashboardStats()
      await invalidate.orders()
    } finally {
      setGenerating(false)
    }
  }

  const isLoading = (loadingOrders && orders.length === 0) || (loadingReports && reports.length === 0 && orders.length === 0)
  const isFetching = fetchingOrders || fetchingReports

  if (isLoading) {
    return <PageSkeleton rows={6} />
  }

  return (
    <div className="space-y-8">
      <QueryStatusBar fetching={isFetching} />

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-white">Revenus & vue d&apos;ensemble</h2>
          <p className="text-sm text-zinc-500">
            CA basé sur les commandes livrées · Confirmées = confirmées + livrées
          </p>
        </div>
        <button onClick={handleGenerate} disabled={generating} className="btn-primary">
          <FileBarChart className="h-4 w-4" />
          {generating ? 'Génération...' : 'Générer rapport'}
        </button>
      </div>

      <div className="rounded-xl border border-gold-500/20 bg-gold-500/5 px-4 py-3 text-sm text-gold-200/90">
        Le chiffre d&apos;affaires inclut uniquement les commandes <strong>livrées</strong>.
      </div>

      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="CA (livrées)" value={formatCurrency(stats.total)} subtitle={`${stats.count} commande${stats.count !== 1 ? 's' : ''}`} icon={TrendingUp} accent="gold" />
        <StatCard title="En attente" value={formatCurrency(stats.pendingAmount)} subtitle={`${stats.pending} commande${stats.pending !== 1 ? 's' : ''}`} icon={Clock} accent="blue" />
        <StatCard title="Confirmées" value={formatCurrency(stats.confirmedAmount)} subtitle={`${stats.confirmed} commande${stats.confirmed !== 1 ? 's' : ''} (confirmées + livrées)`} icon={CheckCircle} accent="emerald" />
        <StatCard title="Produits" value={String(products.length)} subtitle={`Profit net ~ ${formatCurrency(stats.profitNet)}`} icon={Package} accent="purple" />
      </div>

      {channelStats && (
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="card flex items-center gap-4 p-4">
            <Facebook className="h-8 w-8 text-indigo-400" />
            <div>
              <p className="text-xs text-zinc-500">CA Facebook (livré)</p>
              <p className="text-xl font-bold text-white">{formatCurrency(Number(channelStats.caFacebook) || 0)}</p>
              <p className="text-xs text-zinc-500">{channelStats.facebookLivrees} commande(s)</p>
            </div>
          </div>
          <div className="card flex items-center gap-4 p-4">
            <TrendingUp className="h-8 w-8 text-blue-400" />
            <div>
              <p className="text-xs text-zinc-500">CA Site web (livré)</p>
              <p className="text-xl font-bold text-white">{formatCurrency(Number(channelStats.caSiteWeb) || 0)}</p>
              <p className="text-xs text-zinc-500">{channelStats.siteWebLivrees} commande(s)</p>
            </div>
          </div>
          <div className="card flex items-center gap-4 p-4">
            <TrendingUp className="h-8 w-8 text-gold-400" />
            <div>
              <p className="text-xs text-zinc-500">CA total canaux</p>
              <p className="text-xl font-bold text-gold-400">{formatCurrency(Number(channelStats.caTotal) || 0)}</p>
              <p className="text-xs text-zinc-500">
                {channelStats.totalFacebook} FB · {channelStats.totalSiteWeb} web
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card p-6">
          <h3 className="mb-4 font-semibold text-white">Revenus par jour (CA réel)</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
              <XAxis dataKey="name" stroke="#71717a" fontSize={12} />
              <YAxis stroke="#71717a" fontSize={12} tickFormatter={(v) => `${v} DH`} />
              <Tooltip
                contentStyle={{ background: '#1a1a1f', border: '1px solid #ffffff20', borderRadius: '12px' }}
                formatter={(v: number, name: string) =>
                  name === 'revenu' ? [formatCurrency(v), 'CA'] : [v, 'Commandes']
                }
              />
              <Bar dataKey="revenu" fill="#b8873a" radius={[6, 6, 0, 0]} name="revenu" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="card p-6">
          <h3 className="mb-4 font-semibold text-white">Répartition livrées / confirmées</h3>
          {statusPie.length === 0 ? (
            <p className="py-12 text-center text-sm text-zinc-500">Aucun revenu en cours</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={statusPie}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={90}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {statusPie.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card p-6">
          <h3 className="mb-4 font-semibold text-white">Répartition du CA</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={breakdownData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
              <XAxis dataKey="name" stroke="#71717a" fontSize={12} />
              <YAxis stroke="#71717a" fontSize={12} tickFormatter={(v) => `${v} DH`} />
              <Tooltip contentStyle={{ background: '#1a1a1f', border: '1px solid #ffffff20', borderRadius: '12px' }} formatter={(v: number, name: string) => name === 'montant' ? [formatCurrency(v), 'Montant'] : [v, 'Commandes']} />
              <Bar dataKey="montant" fill="#b8873a" radius={[6, 6, 0, 0]} name="montant" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="card p-6">
          <h3 className="mb-4 font-semibold text-white">Projection profit (CA actif)</h3>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={[{ name: 'CA', value: stats.total }, { name: 'Profit brut', value: stats.profitBrut }, { name: 'Profit net', value: stats.profitNet }]}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
              <XAxis dataKey="name" stroke="#71717a" fontSize={12} />
              <YAxis stroke="#71717a" fontSize={12} />
              <Tooltip formatter={(v: number) => formatCurrency(v)} />
              <Area type="monotone" dataKey="value" stroke="#34d399" fill="#34d39933" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold text-white">Commandes récentes</h2>
          <Link to="/orders" className="text-sm text-gold-400 hover:text-gold-300">
            Voir tout →
          </Link>
        </div>
        <div className="space-y-3">
          {recent.length === 0 ? (
            <p className="text-sm text-zinc-500">Aucune commande pour le moment</p>
          ) : (
            recent.map((o) => (
              <div key={o.id} className="flex items-center justify-between rounded-xl bg-ink-800/50 px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-white">Commande #{o.id}</p>
                  <p className="text-xs text-zinc-500">{formatDate(o.dateCommande)}</p>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-semibold ${isRevenueOrder(o) ? 'text-gold-400' : 'text-zinc-500'}`}>
                    {formatCurrency(Number(o.total) || 0)}
                  </p>
                  <p className="text-xs text-zinc-500">{ORDER_STATUS_LABELS[o.statut]}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="border-b border-white/10 px-6 py-4">
          <h3 className="font-semibold text-white">Commandes livrées (CA)</h3>
        </div>
        {stats.revenueOrders.length === 0 ? (
          <p className="p-8 text-center text-zinc-500">Aucune commande livrée</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-xs uppercase text-zinc-500">
                <th className="px-6 py-3">#</th>
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3">Statut</th>
                <th className="px-6 py-3">Adresse</th>
                <th className="px-6 py-3 text-right">Montant</th>
              </tr>
            </thead>
            <tbody>
              {[...stats.revenueOrders]
                .sort((a, b) => new Date(b.dateCommande).getTime() - new Date(a.dateCommande).getTime())
                .map((o) => (
                  <tr key={o.id} className="border-b border-white/5">
                    <td className="px-6 py-3 text-white">{o.id}</td>
                    <td className="px-6 py-3 text-zinc-400">{formatDate(o.dateCommande)}</td>
                    <td className="px-6 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs ${ORDER_STATUS_COLORS[o.statut]}`}>
                        {ORDER_STATUS_LABELS[o.statut]}
                      </span>
                    </td>
                    <td className="max-w-xs truncate px-6 py-3 text-zinc-500">{o.adresseLivraison}</td>
                    <td className="px-6 py-3 text-right font-semibold text-gold-400">
                      {formatCurrency(Number(o.total) || 0)}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <h3 className="font-semibold text-white">Rapports enregistrés</h3>
          <button type="button" onClick={() => invalidate.dashboardStats()} className="btn-ghost text-xs">
            <RefreshCw className="h-3 w-3" />
            Actualiser
          </button>
        </div>
        {reports.length === 0 ? (
          <p className="p-8 text-center text-zinc-500">Aucun rapport — cliquez sur « Générer rapport »</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-xs uppercase text-zinc-500">
                <th className="px-6 py-3">#</th>
                <th className="px-6 py-3">Période</th>
                <th className="px-6 py-3">Commandes</th>
                <th className="px-6 py-3">CA</th>
                <th className="px-6 py-3">Profit net</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((r) => (
                <tr key={r.id} className="border-b border-white/5">
                  <td className="px-6 py-3 text-white">{r.id}</td>
                  <td className="px-6 py-3 text-zinc-400">
                    {r.dateDebut ?? '—'} → {r.dateFin ?? '—'}
                  </td>
                  <td className="px-6 py-3">{r.totalCommandes ?? 0}</td>
                  <td className="px-6 py-3 text-gold-400">{formatCurrency(Number(r.chiffreAffaires) || 0)}</td>
                  <td className="px-6 py-3 text-emerald-400">{formatCurrency(Number(r.profitNet) || 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
