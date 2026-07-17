import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { Bell } from 'lucide-react'
import type { AdminNotification } from '../types'
import { queryKeys } from '../lib/queryKeys'
import { api } from '../lib/api'
import { playNewOrderSound, unlockNotificationAudio } from '../lib/notificationSound'

const MAX = 20
const WS_PATH = '/ws/admin/orders'

function buildWsUrl(): string {
  const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  return `${proto}//${window.location.host}${WS_PATH}`
}

export default function OrderNotificationsBell() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<AdminNotification[]>([])
  const [unread, setUnread] = useState(0)
  const [connected, setConnected] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)
  const retryRef = useRef<number | null>(null)

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

          if (data.type === 'NEW_ORDER') {
            setItems((prev) => [data, ...prev].slice(0, MAX))
            setUnread((n) => n + 1)
            playNewOrderSound()
            qc.invalidateQueries({ queryKey: queryKeys.orders })
            qc.invalidateQueries({ queryKey: queryKeys.orderChannelStats })
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

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => {
          unlockNotificationAudio()
          setOpen((v) => !v)
          setUnread(0)
        }}
        className="relative rounded-xl bg-ink-800 p-2.5 text-zinc-400 transition hover:bg-white/5 hover:text-white"
        title={connected ? 'WebSocket connecté — nouvelles commandes sonnent' : 'Reconnexion WebSocket…'}
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-xl border border-white/10 bg-ink-900 shadow-xl">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <p className="text-sm font-semibold text-white">Commandes (temps réel)</p>
            <span
              className={`h-2 w-2 rounded-full ${connected ? 'bg-emerald-400' : 'bg-zinc-600'}`}
              title={connected ? 'Connecté' : 'Déconnecté'}
            />
          </div>
          <ul className="max-h-80 overflow-y-auto">
            {items.length === 0 ? (
              <li className="p-6 text-center text-sm text-zinc-500">
                Aucune notification — le point vert = WebSocket OK
              </li>
            ) : (
              items.map((n, i) => (
                <li key={`${n.orderId}-${n.createdAt}-${i}`}>
                  <button
                    type="button"
                    className="w-full border-b border-white/5 px-4 py-3 text-left hover:bg-white/[0.03]"
                    onClick={() => {
                      setOpen(false)
                      navigate('/orders')
                      void api.getOrders()
                    }}
                  >
                    <p className="text-sm font-medium text-white">{n.title}</p>
                    <p className="mt-0.5 text-xs text-zinc-500">{n.message}</p>
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  )
}
