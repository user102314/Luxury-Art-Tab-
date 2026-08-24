import { useMemo, useState } from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  ImageIcon,
  Package,
  XCircle,
} from 'lucide-react'
import StatCard from '../components/StatCard'
import { PageSkeleton, QueryStatusBar } from '../components/QueryStatusBar'
import { useAuditLogs, useAuditStats } from '../hooks/useAdminQueries'
import type { AdminActionType, AdminAuditLog } from '../types'
import { resolveImageSrc } from '@/lib/images'
import { matchesSearch } from '../lib/listUtils'

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
  PRODUCT_PRIORITY: 'Priorité affichage',
}

const ACTION_CHIPS: { value: AdminActionType | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'Toutes les actions' },
  { value: 'PRODUCT_IMAGE_UPLOAD', label: 'Upload image' },
  { value: 'PRODUCT_IMAGE_DELETE', label: 'Suppression image' },
  { value: 'PRODUCT_CREATE', label: 'Création produit' },
  { value: 'PRODUCT_UPDATE', label: 'Modification produit' },
  { value: 'PRODUCT_DELETE', label: 'Suppression produit' },
  { value: 'PRODUCT_PRIORITY', label: 'Priorité affichage' },
  { value: 'CATEGORY_CREATE', label: 'Création catégorie' },
  { value: 'CATEGORY_UPDATE', label: 'Modification catégorie' },
  { value: 'CATEGORY_DELETE', label: 'Suppression catégorie' },
]

function toIsoDate(d: Date) {
  const tz = new Date(d.getTime() - d.getTimezoneOffset() * 60_000)
  return tz.toISOString().slice(0, 10)
}

function daysAgo(n: number) {
  const d = new Date()
  d.setHours(12, 0, 0, 0)
  d.setDate(d.getDate() - n)
  return d
}

function formatExactDate(iso?: string) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return new Intl.DateTimeFormat('fr-FR', {
    weekday: 'short',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone: 'Africa/Tunis',
  }).format(d)
}

function formatJson(raw?: string) {
  if (!raw) return '—'
  try {
    return JSON.stringify(JSON.parse(raw), null, 2)
  } catch {
    return raw
  }
}

function LogCard({ log }: { log: AdminAuditLog }) {
  const [openPayload, setOpenPayload] = useState(false)
  const isUpload = log.actionType === 'PRODUCT_IMAGE_UPLOAD'

  return (
    <article className="rounded-2xl border border-white/10 bg-ink-900/50 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-mono text-sm font-semibold text-gold-300">{formatExactDate(log.createdAt)}</p>
          <p className="mt-1 text-xs text-zinc-500">{log.httpMethod} {log.requestPath}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-white/5 px-3 py-1 text-xs font-medium text-zinc-200">
            {ACTION_LABELS[log.actionType] ?? log.actionType}
          </span>
          {log.success ? (
            <span className="inline-flex items-center gap-1 text-sm text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
              {log.httpStatus}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-sm text-red-400">
              <XCircle className="h-4 w-4" />
              {log.httpStatus ?? 'Err'}
            </span>
          )}
        </div>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-[120px_1fr]">
        <div className="overflow-hidden rounded-xl border border-white/10 bg-ink-950">
          {log.imageUrl ? (
            <img
              src={resolveImageSrc(log.imageUrl, 320)}
              alt={log.productRef ?? 'Image'}
              className="h-32 w-full object-cover md:h-full"
            />
          ) : (
            <div className="flex h-32 items-center justify-center text-zinc-600 md:h-full">
              <ImageIcon className="h-8 w-8" />
            </div>
          )}
        </div>

        <div className="space-y-2 text-sm">
          <p className="text-white">
            <span className="text-zinc-500">Produit : </span>
            <span className="font-semibold">{log.productRef ?? '—'}</span>
            {log.entityId != null && <span className="text-zinc-500"> · id {log.entityId}</span>}
          </p>
          <p className="text-zinc-300">
            <span className="text-zinc-500">Catégorie : </span>
            {log.categoryName ?? '—'}
          </p>
          <p className="text-zinc-300">
            <span className="text-zinc-500">Admin : </span>
            {log.adminName ?? '—'} {log.adminEmail ? `(${log.adminEmail})` : ''}
          </p>

          <div className={`rounded-xl p-3 ${isUpload ? 'bg-gold-500/10 border border-gold-500/20' : 'bg-black/30'}`}>
            <p className="text-xs font-semibold uppercase tracking-wider text-gold-400">
              {isUpload ? 'Image uploadée' : 'Fichier image'}
            </p>
            <p className="mt-2 text-xs text-zinc-400">URL / path public</p>
            <code className="mt-1 block break-all rounded bg-black/40 px-2 py-1.5 text-[11px] text-zinc-200">
              {log.imageUrl ?? '—'}
            </code>
            <p className="mt-2 text-xs text-zinc-400">Chemin stockage serveur</p>
            <code className="mt-1 block break-all rounded bg-black/40 px-2 py-1.5 text-[11px] text-emerald-200">
              {log.imageStoragePath ?? '—'}
            </code>
          </div>

          {log.errorMessage && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
              {log.errorMessage}
            </div>
          )}

          <button
            type="button"
            onClick={() => setOpenPayload((v) => !v)}
            className="text-xs font-semibold text-gold-400 hover:text-gold-300"
          >
            {openPayload ? 'Masquer requête / réponse' : 'Voir requête et réponse serveur'}
          </button>

          {openPayload && (
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <p className="mb-1 text-xs text-zinc-500">Requête</p>
                <pre className="max-h-48 overflow-auto rounded-lg bg-black/40 p-3 text-[11px] text-zinc-300">
                  {formatJson(log.requestPayload)}
                </pre>
              </div>
              <div>
                <p className="mb-1 text-xs text-zinc-500">Réponse serveur ({log.httpStatus ?? '—'})</p>
                <pre className="max-h-48 overflow-auto rounded-lg bg-black/40 p-3 text-[11px] text-emerald-100/90">
                  {formatJson(log.responsePayload)}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </article>
  )
}

export default function AuditLogsPage() {
  const [preset, setPreset] = useState<PeriodPreset>('7d')
  const [customFrom, setCustomFrom] = useState(toIsoDate(daysAgo(6)))
  const [customTo, setCustomTo] = useState(toIsoDate(new Date()))
  const [actionFilter, setActionFilter] = useState<AdminActionType | 'ALL'>('ALL')
  const [search, setSearch] = useState('')

  const { from, to } = useMemo(() => {
    if (preset === '7d') return { from: toIsoDate(daysAgo(6)), to: toIsoDate(new Date()) }
    if (preset === '30d') return { from: toIsoDate(daysAgo(29)), to: toIsoDate(new Date()) }
    return { from: customFrom, to: customTo }
  }, [preset, customFrom, customTo])

  const logsQ = useAuditLogs(from, to, actionFilter === 'ALL' ? undefined : actionFilter)
  const statsQ = useAuditStats(from, to)
  const stats = statsQ.data

  const filtered = useMemo(() => {
    const list = logsQ.data ?? []
    return list.filter((log) =>
      matchesSearch(search, [
        log.productRef,
        log.categoryName,
        log.imageUrl,
        log.imageStoragePath,
        log.requestPath,
        log.adminEmail,
        log.adminName,
        log.responsePayload,
        log.errorMessage,
      ]),
    )
  }, [logsQ.data, search])

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
            Choisissez un type d&apos;action pour voir chaque événement en détail : date exacte,
            produit, chemin de l&apos;image uploadée et réponse du serveur.
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
            <ul className="space-y-1 text-sm text-zinc-300">
              {(stats?.duplicateCreates ?? []).map((d) => (
                <li key={`c-${d.productRef}`}>
                  <strong>{d.productRef}</strong> — {d.count} créations
                </li>
              ))}
              {(stats?.duplicateCreates.length ?? 0) === 0 && <li className="text-zinc-500">Aucune création multiple</li>}
            </ul>
            <ul className="space-y-1 text-sm text-zinc-300">
              {(stats?.duplicateUploads ?? []).map((d) => (
                <li key={`u-${d.productRef}`}>
                  <strong>{d.productRef}</strong> — {d.count} uploads
                </li>
              ))}
              {(stats?.duplicateUploads.length ?? 0) === 0 && <li className="text-zinc-500">Aucun upload multiple</li>}
            </ul>
          </div>
        </div>
      ) : null}

      <div className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-zinc-500">Type d&apos;action</p>
        <div className="flex flex-wrap gap-2">
          {ACTION_CHIPS.map((chip) => (
            <button
              key={chip.value}
              type="button"
              onClick={() => setActionFilter(chip.value)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                actionFilter === chip.value
                  ? 'bg-gold-500 text-ink-950'
                  : 'border border-white/10 text-zinc-400 hover:text-white'
              }`}
            >
              {chip.label}
              {chip.value !== 'ALL' && stats?.byActionType[chip.value] != null
                ? ` (${stats.byActionType[chip.value]})`
                : ''}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <input
          className="input max-w-md"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher réf., chemin image, admin…"
        />
        <span className="text-xs text-zinc-500">
          {filtered.length} action{filtered.length > 1 ? 's' : ''}
        </span>
      </div>

      <div className="space-y-4">
        {filtered.map((log) => (
          <LogCard key={log.id} log={log} />
        ))}
        {filtered.length === 0 && (
          <div className="card px-4 py-12 text-center text-zinc-500">
            Aucun log pour ce type d&apos;action sur la période choisie.
          </div>
        )}
      </div>
    </div>
  )
}
