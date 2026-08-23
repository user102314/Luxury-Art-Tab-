import { Fragment, useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  ImageIcon,
  Package,
  XCircle,
} from 'lucide-react'
import StatCard from '../components/StatCard'
import { ListToolbar } from '../components/ListToolbar'
import { PageSkeleton, QueryStatusBar } from '../components/QueryStatusBar'
import { useAuditLogs, useAuditStats } from '../hooks/useAdminQueries'
import { formatDate } from '../lib/api'
import type { AdminActionType, AdminAuditLog } from '../types'
import { resolveImageSrc } from '@/lib/images'
import { inDateRange, matchesSearch } from '../lib/listUtils'

type PeriodPreset = '7d' | '30d' | 'custom'

const ACTION_LABELS: Record<AdminActionType, string> = {
  PRODUCT_CREATE: 'Création produit',
  PRODUCT_UPDATE: 'Modification produit',
  PRODUCT_DELETE: 'Suppression produit',
  PRODUCT_IMAGE_UPLOAD: 'Upload image',
  PRODUCT_IMAGE_DELETE: 'Suppression image',
  CATEGORY_CREATE: 'Création catégorie',
  CATEGORY_UPDATE: 'Modification catégorie',
  CATEGORY_DELETE: 'Suppression catégorie',
}

const ACTION_OPTIONS: { value: AdminActionType | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'Toutes les actions' },
  ...Object.entries(ACTION_LABELS).map(([value, label]) => ({
    value: value as AdminActionType,
    label,
  })),
]

function toIsoDate(d: Date) {
  return d.toISOString().slice(0, 10)
}

function daysAgo(n: number) {
  const d = new Date()
  d.setHours(12, 0, 0, 0)
  d.setDate(d.getDate() - n)
  return d
}

function formatJson(raw?: string) {
  if (!raw) return '—'
  try {
    return JSON.stringify(JSON.parse(raw), null, 2)
  } catch {
    return raw
  }
}

function LogDetailPanel({ log }: { log: AdminAuditLog }) {
  return (
    <div className="grid gap-4 border-t border-white/10 bg-ink-950/60 p-4 md:grid-cols-2">
      <div className="space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-gold-400">Produit & image</h4>
        {log.imageUrl ? (
          <div className="flex gap-4">
            <img
              src={resolveImageSrc(log.imageUrl, 240)}
              alt={log.productRef ?? 'Produit'}
              className="h-32 w-24 rounded-lg border border-white/10 object-cover"
            />
            <div className="min-w-0 space-y-2 text-xs text-zinc-300">
              <p>
                <span className="text-zinc-500">URL publique :</span>
                <code className="mt-1 block break-all rounded bg-black/30 px-2 py-1">{log.imageUrl}</code>
              </p>
              <p>
                <span className="text-zinc-500">Chemin stockage :</span>
                <code className="mt-1 block break-all rounded bg-black/30 px-2 py-1">
                  {log.imageStoragePath ?? '—'}
                </code>
              </p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-zinc-500">Aucune image associée à cette action.</p>
        )}
        <div className="grid grid-cols-2 gap-2 text-xs text-zinc-400">
          <p>Réf. : {log.productRef ?? '—'}</p>
          <p>Catégorie : {log.categoryName ?? '—'}</p>
          <p>Entité : {log.entityType}{log.entityId != null ? ` #${log.entityId}` : ''}</p>
          <p>Route : {log.httpMethod} {log.requestPath}</p>
        </div>
      </div>

      <div className="space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-gold-400">Requête & réponse serveur</h4>
        {log.errorMessage && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
            {log.errorMessage}
          </div>
        )}
        <div>
          <p className="mb-1 text-xs text-zinc-500">Requête</p>
          <pre className="max-h-40 overflow-auto rounded-lg bg-black/40 p-3 text-[11px] text-zinc-300">
            {formatJson(log.requestPayload)}
          </pre>
        </div>
        <div>
          <p className="mb-1 text-xs text-zinc-500">Réponse ({log.httpStatus ?? '—'})</p>
          <pre className="max-h-40 overflow-auto rounded-lg bg-black/40 p-3 text-[11px] text-emerald-100/90">
            {formatJson(log.responsePayload)}
          </pre>
        </div>
      </div>
    </div>
  )
}

export default function AuditLogsPage() {
  const [preset, setPreset] = useState<PeriodPreset>('7d')
  const [customFrom, setCustomFrom] = useState(toIsoDate(daysAgo(6)))
  const [customTo, setCustomTo] = useState(toIsoDate(new Date()))
  const [actionFilter, setActionFilter] = useState<AdminActionType | 'ALL'>('ALL')
  const [search, setSearch] = useState('')
  const [expandedId, setExpandedId] = useState<number | null>(null)

  const { from, to } = useMemo(() => {
    if (preset === '7d') return { from: toIsoDate(daysAgo(6)), to: toIsoDate(new Date()) }
    if (preset === '30d') return { from: toIsoDate(daysAgo(29)), to: toIsoDate(new Date()) }
    return { from: customFrom, to: customTo }
  }, [preset, customFrom, customTo])

  const logsQ = useAuditLogs(from, to, actionFilter === 'ALL' ? undefined : actionFilter, search || undefined)
  const statsQ = useAuditStats(from, to)

  const stats = statsQ.data
  const chartData = useMemo(
    () =>
      Object.entries(stats?.byActionType ?? {}).map(([key, value]) => ({
        name: ACTION_LABELS[key as AdminActionType] ?? key,
        value,
      })),
    [stats?.byActionType],
  )

  const filtered = useMemo(() => {
    const list = logsQ.data ?? []
    return list.filter((log) => {
      if (!inDateRange(log.createdAt, from, to)) return false
      if (actionFilter !== 'ALL' && log.actionType !== actionFilter) return false
      return matchesSearch(search, [
        log.productRef,
        log.categoryName,
        log.imageUrl,
        log.imageStoragePath,
        log.requestPath,
        log.adminEmail,
        log.adminName,
        log.responsePayload,
        log.errorMessage,
      ])
    })
  }, [logsQ.data, from, to, actionFilter, search])

  const loading = (logsQ.isLoading && !logsQ.data) || (statsQ.isLoading && !statsQ.data)
  const fetching = logsQ.isFetching || statsQ.isFetching

  if (loading) return <PageSkeleton />

  const duplicateCount =
    (stats?.duplicateCreates.length ?? 0) + (stats?.duplicateUploads.length ?? 0)

  return (
    <div className="space-y-6">
      <QueryStatusBar fetching={fetching} />

      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-gold-400">Administration</p>
          <h2 className="font-display text-2xl font-bold text-white">Journal d&apos;audit</h2>
          <p className="mt-1 max-w-2xl text-sm text-zinc-400">
            Historique complet des actions admin sur les produits et images — dates exactes, chemins
            fichiers et réponses serveur pour diagnostiquer les doublons ou erreurs de publication.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {(['7d', '30d', 'custom'] as PeriodPreset[]).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPreset(p)}
              className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                preset === p
                  ? 'bg-gold-500 text-ink-950'
                  : 'border border-white/10 text-zinc-400 hover:text-white'
              }`}
            >
              {p === '7d' ? '7 jours' : p === '30d' ? '30 jours' : 'Personnalisé'}
            </button>
          ))}
        </div>
      </div>

      {preset === 'custom' && (
        <div className="flex flex-wrap gap-3">
          <input type="date" className="input" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} />
          <input type="date" className="input" value={customTo} onChange={(e) => setCustomTo(e.target.value)} />
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard title="Actions totales" value={String(stats?.totalLogs ?? 0)} icon={ClipboardList} />
        <StatCard title="Échecs" value={String(stats?.failureCount ?? 0)} icon={XCircle} accent="purple" />
        <StatCard
          title="Uploads images"
          value={String(stats?.byActionType.PRODUCT_IMAGE_UPLOAD ?? 0)}
          icon={ImageIcon}
        />
        <StatCard
          title="Créations produit"
          value={String(stats?.byActionType.PRODUCT_CREATE ?? 0)}
          icon={Package}
        />
        <StatCard title="Alertes doublons" value={String(duplicateCount)} icon={AlertTriangle} accent="emerald" />
      </div>

      {(stats?.duplicateCreates.length ?? 0) > 0 || (stats?.duplicateUploads.length ?? 0) > 0 ? (
        <div className="card border-amber-500/30 bg-amber-500/5 p-4">
          <h3 className="flex items-center gap-2 font-semibold text-amber-200">
            <AlertTriangle className="h-4 w-4" />
            Références suspectes (publications multiples)
          </h3>
          <div className="mt-3 grid gap-4 md:grid-cols-2">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase text-amber-300/80">Créations multiples</p>
              <ul className="space-y-1 text-sm text-zinc-300">
                {(stats?.duplicateCreates ?? []).map((d) => (
                  <li key={`c-${d.productRef}`}>
                    <strong>{d.productRef}</strong> — {d.count} créations
                  </li>
                ))}
                {(stats?.duplicateCreates.length ?? 0) === 0 && (
                  <li className="text-zinc-500">Aucune</li>
                )}
              </ul>
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold uppercase text-amber-300/80">Uploads multiples</p>
              <ul className="space-y-1 text-sm text-zinc-300">
                {(stats?.duplicateUploads ?? []).map((d) => (
                  <li key={`u-${d.productRef}`}>
                    <strong>{d.productRef}</strong> — {d.count} uploads
                  </li>
                ))}
                {(stats?.duplicateUploads.length ?? 0) === 0 && (
                  <li className="text-zinc-500">Aucune</li>
                )}
              </ul>
            </div>
          </div>
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card p-4">
          <h3 className="mb-4 text-sm font-semibold text-zinc-200">Actions par type</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                <XAxis dataKey="name" tick={{ fill: '#a1a1aa', fontSize: 10 }} interval={0} angle={-20} textAnchor="end" height={70} />
                <YAxis tick={{ fill: '#a1a1aa', fontSize: 11 }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ background: '#18181b', border: '1px solid #ffffff20' }}
                  labelStyle={{ color: '#fafafa' }}
                />
                <Bar dataKey="value" fill="#d4a017" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-4">
          <h3 className="mb-4 text-sm font-semibold text-zinc-200">Produits les plus actifs</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase text-zinc-500">
                <tr>
                  <th className="pb-2">Réf.</th>
                  <th className="pb-2">Créations</th>
                  <th className="pb-2">Modifs</th>
                  <th className="pb-2">Uploads</th>
                </tr>
              </thead>
              <tbody>
                {(stats?.topProductActivity ?? []).map((row) => (
                  <tr key={row.productRef} className="border-t border-white/5 text-zinc-300">
                    <td className="py-2 font-medium">{row.productRef}</td>
                    <td className="py-2">{row.createCount}</td>
                    <td className="py-2">{row.updateCount}</td>
                    <td className="py-2">{row.uploadCount}</td>
                  </tr>
                ))}
                {(stats?.topProductActivity.length ?? 0) === 0 && (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-zinc-500">
                      Aucune activité produit sur cette période.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <ListToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Réf., chemin image, admin, réponse…"
        showDateRange={false}
        resultCount={filtered.length}
        totalCount={logsQ.data?.length ?? 0}
        filters={[
          {
            id: 'action',
            label: 'Action',
            value: actionFilter,
            onChange: (v) => setActionFilter(v as AdminActionType | 'ALL'),
            options: ACTION_OPTIONS.map((o) => ({ value: o.value, label: o.label })),
          },
        ]}
        onReset={() => {
          setSearch('')
          setActionFilter('ALL')
        }}
      />

      <div className="card overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-ink-900/80 text-xs uppercase text-zinc-500">
            <tr>
              <th className="px-4 py-3">Date exacte</th>
              <th className="px-4 py-3">Action</th>
              <th className="px-4 py-3">Produit</th>
              <th className="px-4 py-3">Image</th>
              <th className="px-4 py-3">Admin</th>
              <th className="px-4 py-3">Statut</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {filtered.map((log) => (
              <Fragment key={log.id}>
                <tr className="border-t border-white/5 hover:bg-white/[0.02]">
                  <td className="px-4 py-3 whitespace-nowrap text-zinc-300">{formatDate(log.createdAt)}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-white/5 px-2 py-1 text-xs font-medium text-zinc-200">
                      {ACTION_LABELS[log.actionType]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-white">{log.productRef ?? '—'}</div>
                    <div className="text-xs text-zinc-500">{log.categoryName ?? log.entityType}</div>
                  </td>
                  <td className="px-4 py-3">
                    {log.imageUrl ? (
                      <img
                        src={resolveImageSrc(log.imageUrl, 120)}
                        alt=""
                        className="h-12 w-10 rounded object-cover border border-white/10"
                      />
                    ) : (
                      <span className="text-zinc-600">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-zinc-400">
                    <div>{log.adminName ?? '—'}</div>
                    <div>{log.adminEmail ?? ''}</div>
                  </td>
                  <td className="px-4 py-3">
                    {log.success ? (
                      <span className="inline-flex items-center gap-1 text-emerald-400">
                        <CheckCircle2 className="h-4 w-4" />
                        {log.httpStatus}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-red-400">
                        <XCircle className="h-4 w-4" />
                        {log.httpStatus ?? 'Err'}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                      className="text-xs font-semibold text-gold-400 hover:text-gold-300"
                    >
                      {expandedId === log.id ? 'Masquer' : 'Détails'}
                    </button>
                  </td>
                </tr>
                {expandedId === log.id && (
                  <tr>
                    <td colSpan={7} className="p-0">
                      <LogDetailPanel log={log} />
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-zinc-500">
                  Aucun log pour cette période. Les nouvelles actions admin seront enregistrées
                  automatiquement à partir de maintenant.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
