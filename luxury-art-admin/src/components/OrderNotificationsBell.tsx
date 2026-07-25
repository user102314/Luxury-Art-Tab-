import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Bell } from 'lucide-react'
import type { AdminNotification } from '../types'
import { queryKeys } from '../lib/queryKeys'
import { api } from '../lib/api'
import { playNewOrderSound, unlockNotificationAudio } from '../lib/notificationSound'

const WS_PATH = '/ws/admin/orders'

function buildWsUrl(): string {
  const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  return `${proto}//${window.location.host}${WS_PATH}`
}

export default function OrderNotificationsBell() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [liveItems, setLiveItems] = useState<AdminNotification[]>([])
  const [connected, setConnected] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)
  const retryRef = useRef<number | null>(null)

  const { data: stored = [] } = useQuery({
    queryKey: queryKeys.notifications,
    queryFn: api.getNotifications,
    staleTime: 30_000,
  })

  const { data: unreadData } = useQuery({
    queryKey: queryKeys.notificationUnread,
    queryFn: api.getUnreadNotificationCount,
    staleTime: 15_000,
  })

  const unread = unreadData?.count ?? stored.filter((n) => !n.read).length

  useEffect(() => {
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
      }

      ws.onmessage = (ev) => {
        try {
          const data = JSON.parse(ev.data as string) as AdminNotification
          if (data.type === 'CONNECTED') return

          setLiveItems((prev) => [data, ...prev].slice(0, 10))
          qc.invalidateQueries({ queryKey: queryKeys.notifications })
          qc.invalidateQueries({ queryKey: queryKeys.notificationUnread })
          qc.invalidateQueries({ queryKey: queryKeys.orders })
          qc.invalidateQueries({ queryKey: queryKeys.orderChannelStats })

          if (data.type === 'NEW_ORDER' || data.type === 'COLISSIMO_ORDER') {
            playNewOrderSound()
            qc.invalidateQueries({ queryKey: queryKeys.stockAlerts })
            qc.invalidateQueries({ queryKey: queryKeys.products })
            qc.invalidateQueries({ queryKey: queryKeys.clients })
            if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
              new Notification(data.title, { body: data.message })
            }
          }
        } catch {
          /* ignore */
        }
      }

      ws.onclose = () => {
        setConnected(false)
        wsRef.current = null
        if (!stopped) {
          retryRef.current = window.setTimeout(connect, 2500)
        }
      }

      ws.onerror = () => {
        ws.close()
      }
    }

    connect()

    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => undefined)
    }

    return () => {
      stopped = true
      if (retryRef.current != null) window.clearTimeout(retryRef.current)
      wsRef.current?.close()
    }
  }, [qc])

  const preview = stored.length > 0 ? stored.slice(0, 8) : liveItems

  return (
    <div className="relative flex items-center gap-2">
      <button
        type="button"
        onClick={() => navigate('/notifications')}
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
        title={connected ? 'WebSocket connecté' : 'Reconnexion WebSocket…'}
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-xl border border-white/10 bg-ink-900 shadow-xl">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <p className="text-sm font-semibold text-white">Notifications</p>
            <span
              className={`h-2 w-2 rounded-full ${connected ? 'bg-emerald-400' : 'bg-zinc-600'}`}
              title={connected ? 'Connecté' : 'Déconnecté'}
            />
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
                      navigate('/notifications')
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
                navigate('/notifications')
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
