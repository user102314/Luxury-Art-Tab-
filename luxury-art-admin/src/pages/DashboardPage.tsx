import { Link } from 'react-router-dom'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import StatCard, { Package, TrendingUp, formatCurrency } from '../components/StatCard'
import { PageSkeleton, QueryStatusBar } from '../components/QueryStatusBar'
import { useOrders, useProducts, useOrderChannelStats } from '../hooks/useAdminQueries'
import { computeRevenue, formatDate, isRevenueOrder, ORDER_STATUS_LABELS, revenueByDay } from '../lib/api'
import { Clock, CheckCircle, Facebook } from 'lucide-react'

const PIE_COLORS = ['#f59e0b', '#3b82f6', '#71717a']

export default function DashboardPage() {
  const { data: orders = [], isLoading, isFetching } = useOrders()
  const { data: products = [] } = useProducts()
  const { data: channelStats } = useOrderChannelStats()

  const stats = computeRevenue(orders)
  const chartData = revenueByDay(orders)
  const statusPie = [
    { name: 'Livrées (CA)', value: stats.total },
    { name: 'Confirmées', value: stats.confirmedOnlyAmount },
  ].filter((s) => s.value > 0)

  const recent = [...orders]
    .sort((a, b) => new Date(b.dateCommande).getTime() - new Date(a.dateCommande).getTime())
    .slice(0, 5)

  if (isLoading) {
    return <PageSkeleton rows={6} />
  }

  return (
    <div className="space-y-8">
      <QueryStatusBar fetching={isFetching} />

      <div className="rounded-xl border border-gold-500/20 bg-gold-500/5 px-4 py-3 text-sm text-gold-200/90">
        Le chiffre d&apos;affaires inclut uniquement les commandes{' '}
        <strong>livrées</strong>. Le total confirmé inclut les commandes{' '}
        <strong>confirmées</strong> et <strong>livrées</strong>.
      </div>

      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Chiffre d'affaires"
          value={formatCurrency(stats.total)}
          subtitle={`${stats.count} commande${stats.count !== 1 ? 's' : ''} livrée${stats.count !== 1 ? 's' : ''}`}
          icon={TrendingUp}
          accent="gold"
        />
        <StatCard
          title="En attente"
          value={formatCurrency(stats.pendingAmount)}
          subtitle={`${stats.pending} commande${stats.pending !== 1 ? 's' : ''}`}
          icon={Clock}
          accent="blue"
        />
        <StatCard
          title="Confirmées"
          value={formatCurrency(stats.confirmedAmount)}
          subtitle={`${stats.confirmed} commande${stats.confirmed !== 1 ? 's' : ''} (confirmées + livrées)`}
          icon={CheckCircle}
          accent="emerald"
        />
        <StatCard
          title="Produits"
          value={String(products.length)}
          subtitle="Catalogue actif"
          icon={Package}
          accent="purple"
        />
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
          <h2 className="mb-4 font-semibold text-white">Revenus par jour (CA réel)</h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
              <XAxis dataKey="name" stroke="#71717a" fontSize={12} />
              <YAxis stroke="#71717a" fontSize={12} tickFormatter={(v) => `${v} DH`} />
              <Tooltip
                contentStyle={{
                  background: '#1a1a1f',
                  border: '1px solid #ffffff20',
                  borderRadius: '12px',
                }}
                formatter={(v: number, name: string) =>
                  name === 'revenu' ? [formatCurrency(v), 'CA'] : [v, 'Commandes']
                }
              />
              <Bar dataKey="revenu" fill="#b8873a" radius={[6, 6, 0, 0]} name="revenu" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-6">
          <h2 className="mb-4 font-semibold text-white">Répartition livrées / confirmées</h2>
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
              <div
                key={o.id}
                className="flex items-center justify-between rounded-xl bg-ink-800/50 px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-white">Commande #{o.id}</p>
                  <p className="text-xs text-zinc-500">{formatDate(o.dateCommande)}</p>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-semibold ${isRevenueOrder(o) ? 'text-gold-400' : 'text-zinc-500'}`}>
                    {formatCurrency(Number(o.total) || 0)}
                    {!isRevenueOrder(o) && (
                      <span className="ml-1 text-xs text-zinc-600">(hors CA)</span>
                    )}
                  </p>
                  <p className="text-xs text-zinc-500">{ORDER_STATUS_LABELS[o.statut]}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
