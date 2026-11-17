import { useEffect } from 'react'
import { useRouterState } from '@tanstack/react-router'
import { initMetaPixel, trackMeta } from '@/lib/metaPixel'

/** Charge le Pixel Meta et envoie un PageView à chaque navigation (storefront uniquement). */
export function MetaPixelTracker() {
  const href = useRouterState({ select: (s) => s.location.href })

  useEffect(() => {
    initMetaPixel()
  }, [])

  useEffect(() => {
    trackMeta('PageView')
  }, [href])

  return null
}
