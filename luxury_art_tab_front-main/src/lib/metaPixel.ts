import { getApiBase } from '@/lib/apiBase'

/** Pixel ID (public). Surchargeable via VITE_META_PIXEL_ID. */
export const META_PIXEL_ID =
  (import.meta.env.VITE_META_PIXEL_ID as string | undefined)?.trim() || '1169653052791772'

export const META_CURRENCY =
  (import.meta.env.VITE_META_CURRENCY as string | undefined)?.trim() || 'TND'

type MetaEventName = 'PageView' | 'ViewContent' | 'AddToCart' | 'InitiateCheckout' | 'Purchase'

interface MetaEventData {
  value?: number
  contentIds?: string[]
  contentName?: string
  numItems?: number
  email?: string
  phone?: string
  firstName?: string
  lastName?: string
}

declare global {
  interface Window {
    fbq?: ((...args: unknown[]) => void) & { queue?: unknown[]; loaded?: boolean; callMethod?: unknown }
    _fbq?: unknown
  }
}

let initialized = false

/** Charge le script Pixel une seule fois (navigateur uniquement). */
export function initMetaPixel(): void {
  if (typeof window === 'undefined' || initialized) return
  initialized = true

  if (!window.fbq) {
    const fbq = function (...args: unknown[]) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const f = fbq as any
      if (f.callMethod) f.callMethod(...args)
      else f.queue.push(args)
    } as unknown as NonNullable<Window['fbq']>
    ;(fbq as unknown as { queue: unknown[] }).queue = []
    ;(fbq as unknown as { loaded: boolean }).loaded = true
    window.fbq = fbq
    window._fbq = fbq
    const s = document.createElement('script')
    s.async = true
    s.src = 'https://connect.facebook.net/en_US/fbevents.js'
    document.head.appendChild(s)
  }
  window.fbq?.('init', META_PIXEL_ID)
}

function readCookie(name: string): string | undefined {
  if (typeof document === 'undefined') return undefined
  const m = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`))
  return m ? decodeURIComponent(m[1]) : undefined
}

/** _fbc : cookie Meta, ou reconstruit depuis ?fbclid= si le cookie n'existe pas encore. */
export function getFbc(): string | undefined {
  const c = readCookie('_fbc')
  if (c) return c
  try {
    const fbclid = new URLSearchParams(window.location.search).get('fbclid')
    if (fbclid) return `fb.1.${Date.now()}.${fbclid}`
  } catch {
    /* ignore */
  }
  return undefined
}

export function getFbp(): string | undefined {
  return readCookie('_fbp')
}

export function newMetaEventId(): string {
  return crypto.randomUUID()
}

/** Identifiants de correspondance à joindre aux appels serveur. */
export function getMetaIdentifiers() {
  return {
    fbp: getFbp(),
    fbc: getFbc(),
    eventSourceUrl: typeof window !== 'undefined' ? window.location.href : undefined,
  }
}

/**
 * Déclenche l'événement côté navigateur (Pixel) ET le relaie au serveur (CAPI)
 * avec le même event_id pour que Meta dédoublonne. Jamais bloquant.
 * `Purchase` n'est pas relayé ici : le serveur l'émet à la création de la commande.
 */
export function trackMeta(
  name: MetaEventName,
  data: MetaEventData = {},
  eventId: string = newMetaEventId(),
): string {
  if (typeof window === 'undefined') return eventId
  try {
    const params: Record<string, unknown> = {}
    if (data.value != null) {
      params.value = data.value
      params.currency = META_CURRENCY
    }
    if (data.contentIds?.length) {
      params.content_ids = data.contentIds
      params.content_type = 'product'
    }
    if (data.contentName) params.content_name = data.contentName
    if (data.numItems != null) params.num_items = data.numItems
    window.fbq?.('track', name, params, { eventID: eventId })
  } catch {
    /* ignore */
  }

  if (name !== 'Purchase') {
    try {
      void fetch(`${getApiBase()}/meta/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        keepalive: true,
        body: JSON.stringify({
          eventName: name,
          eventId,
          ...getMetaIdentifiers(),
          visitorKey: localStorage.getItem('luxart_visitor_key') ?? undefined,
          value: data.value,
          currency: META_CURRENCY,
          contentIds: data.contentIds,
          contentName: data.contentName,
          numItems: data.numItems,
          email: data.email,
          phone: data.phone,
          firstName: data.firstName,
          lastName: data.lastName,
        }),
      }).catch(() => {})
    } catch {
      /* ignore */
    }
  }
  return eventId
}
