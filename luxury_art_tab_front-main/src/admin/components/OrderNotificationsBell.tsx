import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Bell, BellRing, CheckCircle2, Volume2 } from 'lucide-react'
import { toast } from 'sonner'
import type { AdminNotification } from '../types'
import { queryKeys } from '../lib/queryKeys'
import { api } from '../lib/api'
import { playNewOrderSound, unlockNotificationAudio } from '../lib/notificationSound'
import {
  ensureAdminServiceWorker,
  getNotificationPermission,
  requestAdminNotificationPermission,
  showDeviceNotification,
  type DeviceNotifPermission,
} from '../lib/browserNotifications'
import { getApiBase } from '@/lib/apiBase'

const WS_PATH = '/ws/admin/orders'

function buildWsUrl(): string {
  const apiBase = getApiBase()
  if (/^https?:\/\//i.test(apiBase)) {
    try {
      const origin = new URL(apiBase).origin
      const proto = origin.startsWith('https') ? 'wss:' : 'ws:'
      return `${proto}//${origin.replace(/^https?:\/\//, '')}${WS_PATH}`
    } catch {
      /* fallthrough */
    }
  }
  const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  return `${proto}//${window.location.host}${WS_PATH}`
}

function notifKey(n: AdminNotification): string {
  if (n.id != null) return `id:${n.id}`
  if (n.orderId != null) return `order:${n.type}:${n.orderId}`
  return `ts:${n.type}:${n.createdAt}:${n.title}`
}

function isAlertType(type: string): boolean {
  return type === 'NEW_ORDER' || type === 'COLISSIMO_ORDER'
}

export default function OrderNotificationsBell() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [liveItems, setLiveItems] = useState<AdminNotification[]>([])
  const [connected, setConnected] = useState(false)
  const [permission, setPermission] = useState<DeviceNotifPermission>(() =>
    getNotificationPermission(),
  )
  const wsRef = useRef<WebSocket | null>(null)
  const retryRef = useRef<number | null>(null)
  const pingRef = useRef<number | null>(null)
  const initializedRef = useRef(false)
  const seenKeysRef = useRef<Set<string>>(new Set())

  const triggerOrderAlert = useCallback(
    (data: AdminNotification) => {
      const key = notifKey(data)
      if (seenKeysRef.current.has(key)) return
      seenKeysRef.current.add(key)

      setLiveItems((prev) => [data, ...prev].slice(0, 10))
      qc.invalidateQueries({ queryKey: queryKeys.notifications })
      qc.invalidateQueries({ queryKey: queryKeys.notificationUnread })
      qc.invalidateQueries({ queryKey: queryKeys.orders })
      qc.invalidateQueries({ queryKey: queryKeys.orderChannelStats })

      if (isAlertType(data.type)) {
        playNewOrderSound()
        if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
          try {
            navigator.vibrate([200, 100, 200])
          } catch {
            /* ignore */
          }
        }
        qc.invalidateQueries({ queryKey: queryKeys.stockAlerts })
        qc.invalidateQueries({ queryKey: queryKeys.products })
        qc.invalidateQueries({ queryKey: queryKeys.clients })

        toast.success(data.title, {
          description: data.message,
          duration: 8000,
          action: {
            label: 'Voir',
            onClick: () => navigate({ to: '/admin/orders' }),
          },
        })

        void showDeviceNotification({
          title: data.title,
          body: data.message,
          tag: data.orderId != null ? `order-${data.orderId}` : key,
          url: '/admin/orders',
        })
      }
    },
    [navigate, qc],
  )

  const { data: stored = [] } = useQuery({
    queryKey: queryKeys.notifications,
    queryFn: api.getNotifications,
    staleTime: 10_000,
    refetchInterval: 12_000,
    refetchIntervalInBackground: true,
  })

  const { data: unreadData } = useQuery({
    queryKey: queryKeys.notificationUnread,
    queryFn: api.getUnreadNotificationCount,
    staleTime: 10_000,
    refetchInterval: 12_000,
    refetchIntervalInBackground: true,
  })

  // Détecte les nouvelles notifications arrivées via polling (si WebSocket coupé sur mobile/PC)
  useEffect(() => {
    if (!initializedRef.current) {
      if (stored.length > 0) {
        for (const n of stored) {
          seenKeysRef.current.add(notifKey(n))
        }
        initializedRef.current = true
      }
      return
    }

    const freshUnread = stored.filter(
      (n) => !n.read && isAlertType(n.type) && !seenKeysRef.current.has(notifKey(n)),
    )
    for (const n of freshUnread) {
      triggerOrderAlert(n)
    }
    for (const n of stored) {
      seenKeysRef.current.add(notifKey(n))
    }
  }, [stored, triggerOrderAlert])

  const unread = unreadData?.count ?? stored.filter((n) => !n.read).length

  useEffect(() => {
    void ensureAdminServiceWorker()
    setPermission(getNotificationPermission())

    const unlockOnce = () => {
      unlockNotificationAudio()
    }
    window.addEventListener('pointerdown', unlockOnce, { once: true })

    let stopped = false

    const connect = () => {
      if (stopped) return
      const ws = new WebSocket(buildWsUrl())
      wsRef.current = ws

      ws.onopen = () => {
        setConnected(true)
        if (retryRef.current != null) {
          window.clearTimeout(retryRef.current)
          retryRef.current = null
        }
        if (pingRef.current != null) {
          window.clearInterval(pingRef.current)
        }
        pingRef.current = window.setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send('ping')
          }
        }, 25_000)
      }

      ws.onmessage = (ev) => {
        try {
          const data = JSON.parse(ev.data as string) as AdminNotification
          if (data.type === 'CONNECTED' || data.type === 'PONG') return
          initializedRef.current = true
          triggerOrderAlert(data)
        } catch {
          /* ignore */
        }
      }

      ws.onclose = () => {
        setConnected(false)
        wsRef.current = null
        if (pingRef.current != null) {
          window.clearInterval(pingRef.current)
          pingRef.current = null
        }
        if (!stopped) {
          retryRef.current = window.setTimeout(connect, 2500)
        }
      }

      ws.onerror = () => {
        ws.close()
      }
    }

    connect()

    return () => {
      stopped = true
      window.removeEventListener('pointerdown', unlockOnce)
      if (retryRef.current != null) window.clearTimeout(retryRef.current)
      if (pingRef.current != null) window.clearInterval(pingRef.current)
      wsRef.current?.close()
    }
  }, [triggerOrderAlert])

  const handleEnableNotifications = async () => {
    const res = await requestAdminNotificationPermission()
    setPermission(res)
    if (res === 'granted') {
      toast.success('Notifications activées sur cet appareil (PC / Téléphone)')
    } else if (res === 'denied') {
      toast.error(
        'Notifications bloquées par le navigateur. Autorisez-les dans les paramètres du site.',
      )
    }
  }

  const handleTestNotification = async () => {
    unlockNotificationAudio()
    playNewOrderSound()
    if (permission === 'default') {
      const res = await requestAdminNotificationPermission()
      setPermission(res)
      if (res === 'granted') return
    }
    const ok = await showDeviceNotification({
      title: 'Test notification — Luxury Art',
      body: 'Nouvelle commande exemple : 150 TND (PC & Téléphone)',
      tag: `test-${Date.now()}`,
      url: '/admin/orders',
    })
    if (!ok) {
      toast.info('Alerte sonore jouée. Activez les notifications navigateur pour les popups OS.')
    }
  }

  const preview = stored.length > 0 ? stored.slice(0, 8) : liveItems

  return (
    <div className="relative flex items-center gap-2">
      {permission === 'default' && (
        <button
          type="button"
          onClick={handleEnableNotifications}
          className="inline-flex items-center gap-1.5 rounded-xl border border-gold-500/40 bg-gold-500/15 px-3 py-2 text-xs font-medium text-gold-300 transition hover:bg-gold-500/25"
          title="Recevoir une notification sur ce PC ou téléphone à chaque commande"
        >
          <BellRing className="h-3.5 w-3.5 animate-pulse" />
          <span className="hidden md:inline">Activer alertes</span>
        </button>
      )}
      <button
        type="button"
        onClick={() => navigate({ to: '/admin/notifications' })}
        className="hidden rounded-xl bg-ink-800 px-3 py-2 text-xs text-zinc-400 hover:bg-white/5 hover:text-white sm:inline-flex"
      >
        Voir tout
      </button>
      <button
        type="button"
        onClick={() => {
          unlockNotificationAudio()
          setOpen((v) => !v)
        }}
        className="relative rounded-xl bg-ink-800 p-2.5 text-zinc-400 transition hover:bg-white/5 hover:text-white"
        title={connected ? 'Temps réel connecté (WebSocket)' : 'Reconnexion WebSocket (polling actif)…'}
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-xl border border-white/10 bg-ink-950 shadow-2xl ring-1 ring-black/40">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-white">Notifications</p>
              <span
                className={`h-2 w-2 rounded-full ${connected ? 'bg-emerald-400' : 'bg-amber-400'}`}
                title={connected ? 'WebSocket connecté' : 'Mode secours polling (12s)'}
              />
            </div>
            <button
              type="button"
              onClick={handleTestNotification}
              className="inline-flex items-center gap-1 rounded-lg bg-white/5 px-2 py-1 text-[11px] font-medium text-zinc-300 hover:bg-white/10 hover:text-white"
              title="Tester la sonnerie et la notification sur cet appareil"
            >
              <Volume2 className="h-3 w-3 text-gold-400" />
              Tester
            </button>
          </div>

          <div className="border-b border-white/10 bg-white/[0.02] px-4 py-2 text-xs">
            {permission === 'granted' ? (
              <span className="inline-flex items-center gap-1.5 text-emerald-400">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Alertes PC / Téléphone actives
              </span>
            ) : permission === 'denied' ? (
              <span className="text-red-400">
                Notifications bloquées dans les réglages du navigateur
              </span>
            ) : permission === 'unsupported' ? (
              <span className="text-zinc-500">Alertes sonores &amp; toast actives</span>
            ) : (
              <button
                type="button"
                onClick={handleEnableNotifications}
                className="font-medium text-gold-400 hover:underline"
              >
                + Activer les notifications sur cet appareil
              </button>
            )}
          </div>

          <ul className="max-h-80 overflow-y-auto">
            {preview.length === 0 ? (
              <li className="p-6 text-center text-sm text-zinc-500">Aucune notification</li>
            ) : (
              preview.map((n, i) => (
                <li key={n.id ?? `${n.type}-${n.createdAt}-${i}`}>
                  <button
                    type="button"
                    className="w-full border-b border-white/5 px-4 py-3 text-left hover:bg-white/[0.03]"
                    onClick={() => {
                      setOpen(false)
                      navigate({ to: '/admin/notifications' })
                    }}
                  >
                    <p className="text-sm font-medium text-white">{n.title}</p>
                    <p className="mt-0.5 text-xs text-zinc-500">
                      {n.clientNom ? `${n.clientNom} · ` : ''}
                      {n.colissimoCodeBarre ? `Colis ${n.colissimoCodeBarre}` : n.message}
                    </p>
                  </button>
                </li>
              ))
            )}
          </ul>
          <div className="border-t border-white/10 p-2">
            <button
              type="button"
              onClick={() => {
                setOpen(false)
                navigate({ to: '/admin/notifications' })
              }}
              className="w-full rounded-lg py-2 text-center text-xs font-medium text-gold-400 hover:bg-white/5"
            >
              Ouvrir la page notifications
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
