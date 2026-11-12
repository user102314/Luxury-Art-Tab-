import { playNewOrderSound, unlockNotificationAudio } from './notificationSound'

export type DeviceNotifPermission = NotificationPermission | 'unsupported'

let swRegPromise: Promise<ServiceWorkerRegistration | null> | null = null

export function getNotificationPermission(): DeviceNotifPermission {
  if (typeof window === 'undefined' || typeof Notification === 'undefined') {
    return 'unsupported'
  }
  return Notification.permission
}

export function ensureAdminServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return Promise.resolve(null)
  }
  if (!swRegPromise) {
    swRegPromise = navigator.serviceWorker
      .register('/sw-admin.js', { scope: '/' })
      .then(async (reg) => {
        try {
          await navigator.serviceWorker.ready
        } catch {
          /* ignore */
        }
        return reg
      })
      .catch(() => null)
  }
  return swRegPromise
}

export async function showDeviceNotification(options: {
  title: string
  body: string
  tag?: string
  url?: string
}): Promise<boolean> {
  if (typeof window === 'undefined' || typeof Notification === 'undefined') {
    return false
  }
  if (Notification.permission !== 'granted') {
    return false
  }

  const notifOptions: NotificationOptions & { vibrate?: number[] } = {
    body: options.body,
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    tag: options.tag ?? `luxury-art-${Date.now()}`,
    requireInteraction: true,
    vibrate: [200, 100, 200],
    data: { url: options.url ?? '/admin/orders' },
  }

  // Sur Android/Mobile, new Notification() lève TypeError : il faut passer par le Service Worker.
  try {
    const reg = await ensureAdminServiceWorker()
    if (reg && 'showNotification' in reg) {
      await reg.showNotification(options.title, notifOptions)
      return true
    }
  } catch {
    /* fallback desktop below */
  }

  try {
    const n = new Notification(options.title, notifOptions)
    n.onclick = () => {
      window.focus()
      if (options.url) {
        window.location.assign(options.url)
      }
      n.close()
    }
    return true
  } catch {
    return false
  }
}

export async function requestAdminNotificationPermission(): Promise<DeviceNotifPermission> {
  unlockNotificationAudio()
  if (typeof window === 'undefined' || typeof Notification === 'undefined') {
    return 'unsupported'
  }

  await ensureAdminServiceWorker()

  let perm = Notification.permission
  if (perm === 'default') {
    try {
      perm = await Notification.requestPermission()
    } catch {
      perm = Notification.permission
    }
  }

  if (perm === 'granted') {
    playNewOrderSound()
    await showDeviceNotification({
      title: 'Notifications Luxury Art activées',
      body: 'Vous recevrez désormais une alerte sur cet appareil à chaque nouvelle commande.',
      tag: 'luxury-art-welcome',
      url: '/admin/orders',
    })
  }

  return perm
}
