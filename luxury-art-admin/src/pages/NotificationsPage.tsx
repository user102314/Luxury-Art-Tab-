import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { Bell, CheckCheck, MapPin, Package, Phone, RefreshCw, Truck } from 'lucide-react'
import { Link } from 'react-router-dom'
import { api, formatCurrency, formatDate, ORDER_CANAL_LABELS, ORDER_STATUS_LABELS } from '../lib/api'
import { queryKeys } from '../lib/queryKeys'
import { PageSkeleton } from '../components/QueryStatusBar'
import type { AdminNotification } from '../types'

function typeLabel(type: string): string {
  switch (type) {
    case 'NEW_ORDER':
      return 'Nouvelle commande'
    case 'COLISSIMO_ORDER':
      return 'Colis Colissimo'
    case 'COLISSIMO_ORDER_UPDATE':
      return 'Colis mis à jour'
    case 'COLISSIMO_SYNC_ERROR':
      return 'Erreur sync'
    default:
      return type
  }
}

function typeColor(type: string): string {
  switch (type) {
    case 'NEW_ORDER':
      return 'bg-emerald-500/15 text-emerald-300'
    case 'COLISSIMO_ORDER':
      return 'bg-sky-500/15 text-sky-300'
    case 'COLISSIMO_ORDER_UPDATE':
      return 'bg-violet-500/15 text-violet-300'
    case 'COLISSIMO_SYNC_ERROR':
      return 'bg-red-500/15 text-red-300'
    default:
      return 'bg-zinc-500/15 text-zinc-300'
  }
}

function isOrderNotification(type: string): boolean {
  return type === 'NEW_ORDER' || type === 'COLISSIMO_ORDER' || type === 'COLISSIMO_ORDER_UPDATE'
}

export default function NotificationsPage() {
  const qc = useQueryClient()
  const { data: items = [], isLoading, refetch, isFetching } = useQuery({
    queryKey: queryKeys.notifications,
    queryFn: api.getNotifications,
  })

  const markAll = useMutation({
    mutationFn: api.markAllNotificationsRead,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.notifications })
      qc.invalidateQueries({ queryKey: queryKeys.notificationUnread })
    },
  })

  const unread = items.filter((n) => !n.read).length

  if (isLoading) {
    return <PageSkeleton rows={8} />
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-white">Notifications</h2>
          <p className="text-sm text-zinc-500">
            {items.length} notification(s) — {unread} non lue(s)
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => refetch()} className="btn-ghost">
            <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
            Actualiser
          </button>
          {unread > 0 && (
            <button
              type="button"
              onClick={() => markAll.mutate()}
              disabled={markAll.isPending}
              className="btn-primary inline-flex items-center gap-2"
            >
              <CheckCheck className="h-4 w-4" />
              Tout marquer lu
            </button>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {items.length === 0 ? (
          <div className="card flex flex-col items-center gap-3 p-12 text-center">
            <Bell className="h-10 w-10 text-zinc-600" />
            <p className="text-zinc-500">Aucune notification enregistrée</p>
          </div>
        ) : (
          items.map((n) => (
            <NotificationCard key={n.id ?? `${n.type}-${n.createdAt}`} item={n} />
          ))
        )}
      </div>
    </div>
  )
}

function NotificationCard({ item }: { item: AdminNotification }) {
  const Icon = item.type.startsWith('COLISSIMO') ? Truck : Package
  const isOrder = isOrderNotification(item.type)

  return (
    <article
      className={`card overflow-hidden ${item.read ? 'opacity-75' : 'ring-1 ring-gold-500/20'}`}
    >
      <div className="flex items-start gap-4 p-5">
        <div
          className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${typeColor(item.type)}`}
        >
          <Icon className="h-5 w-5" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span
              className={`rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase ${typeColor(item.type)}`}
            >
              {typeLabel(item.type)}
            </span>
            {!item.read && (
              <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-[10px] font-medium text-red-300">
                Non lu
              </span>
            )}
            {item.createdAt && (
              <span className="text-xs text-zinc-500">{formatDate(item.createdAt)}</span>
            )}
          </div>

          <h3 className="text-base font-semibold text-white">{item.title}</h3>

          {isOrder ? (
            <div className="mt-3 grid gap-2 rounded-xl bg-ink-800/60 p-4 text-sm sm:grid-cols-2">
              <Detail label="Client" value={item.clientNom ?? '—'} />
              <Detail label="Téléphone" value={item.clientTelephone ?? '—'} icon={<Phone className="h-3.5 w-3.5" />} />
              <Detail
                label="Canal"
                value={
                  item.canal
                    ? (ORDER_CANAL_LABELS[item.canal as keyof typeof ORDER_CANAL_LABELS] ?? item.canal)
                    : '—'
                }
              />
              <Detail
                label="Statut commande"
                value={
                  item.statut
                    ? (ORDER_STATUS_LABELS[item.statut as keyof typeof ORDER_STATUS_LABELS] ?? item.statut)
                    : '—'
                }
              />
              <Detail label="N° colis" value={item.colissimoCodeBarre ?? '—'} highlight />
              <Detail label="État Colissimo" value={item.colissimoEtat ?? '—'} />
              <Detail
                label="Montant"
                value={item.total != null ? formatCurrency(Number(item.total)) : '—'}
                highlight
              />
              <Detail label="Référence" value={item.reference ?? '—'} />
              {item.colissimoDesignation && (
                <div className="sm:col-span-2">
                  <Detail label="Article" value={item.colissimoDesignation} />
                </div>
              )}
              {item.adresseLivraison && (
                <div className="sm:col-span-2">
                  <Detail
                    label="Adresse livraison"
                    value={item.adresseLivraison}
                    icon={<MapPin className="h-3.5 w-3.5" />}
                  />
                </div>
              )}
            </div>
          ) : (
            <p className="mt-2 whitespace-pre-line text-sm text-zinc-400">{item.message}</p>
          )}

          {item.orderId && (
            <Link
              to="/orders"
              className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-gold-400 hover:text-gold-300"
            >
              Voir commande #{item.orderId} →
            </Link>
          )}
        </div>
      </div>
    </article>
  )
}

function Detail({
  label,
  value,
  highlight,
  icon,
}: {
  label: string
  value: string
  highlight?: boolean
  icon?: ReactNode
}) {
  return (
    <div>
      <p className="mb-0.5 flex items-center gap-1 text-[10px] uppercase tracking-wider text-zinc-500">
        {icon}
        {label}
      </p>
      <p className={`${highlight ? 'font-semibold text-gold-300' : 'text-zinc-200'} break-words`}>
        {value}
      </p>
    </div>
  )
}
