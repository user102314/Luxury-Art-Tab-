import { useEffect, useRef } from 'react'
import { api, getTrackingSessionId } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'

export type TrackClickAction = 'CLICK' | 'ADD_TO_CART'

/**
 * Envoie les events de tracking produit en fire-and-forget (jamais bloquant pour l'UI).
 */
export function useProductTracking(productId: number | null | undefined) {
  const { client } = useAuth()
  const viewedRef = useRef<number | null>(null)

  useEffect(() => {
    if (productId == null || Number.isNaN(productId) || productId <= 0) return
    if (viewedRef.current === productId) return
    viewedRef.current = productId

    const sessionId = getTrackingSessionId()
    void api.trackProductView(productId, sessionId, client?.id).catch(() => {
      /* best-effort */
    })
  }, [productId, client?.id])

  const trackClick = (actionType: TrackClickAction = 'CLICK') => {
    if (productId == null || Number.isNaN(productId) || productId <= 0) return
    const sessionId = getTrackingSessionId()
    void api.trackProductClick(productId, sessionId, actionType, client?.id).catch(() => {
      /* best-effort */
    })
  }

  return { trackClick }
}
