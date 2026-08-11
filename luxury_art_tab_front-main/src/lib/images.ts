import { getApiBase, getApiOrigin } from '@/lib/apiBase'

export { getApiBase, getApiOrigin } from '@/lib/apiBase'

/**
 * Résout une URL média backend (`/uploads/...`) vers l'origine API HTTPS.
 * Les blob:/data:/http(s): restent inchangées.
 */
export function resolveImageSrc(url?: string | null): string {
  if (!url) return '/placeholder-art.svg'
  if (
    url.startsWith('http://') ||
    url.startsWith('https://') ||
    url.startsWith('blob:') ||
    url.startsWith('data:')
  ) {
    return url
  }
  const path = url.startsWith('/') ? url : `/${url}`
  const origin = getApiOrigin()
  if (origin && (path.startsWith('/uploads') || path.startsWith('/api'))) {
    return `${origin}${path}`
  }
  // Dev local avec proxy Vite : garder le chemin relatif (/uploads → proxy)
  return path
}

export function getProductImages(product: {
  imageUrl?: string
  images?: { url: string; ordre?: number }[]
}): string[] {
  if (product.images?.length) {
    return [...product.images]
      .sort((a, b) => (a.ordre ?? 0) - (b.ordre ?? 0))
      .map((img) => resolveImageSrc(img.url))
      .filter(Boolean)
  }
  if (product.imageUrl) return [resolveImageSrc(product.imageUrl)]
  return ['/placeholder-art.svg']
}

export function getProductImage(product: {
  imageUrl?: string
  images?: { url: string; ordre?: number }[]
}): string {
  return getProductImages(product)[0]
}

/** Image 2 (ordre=1) — détourée pour la simulation AR sur le mur */
export function hasSimulationImage(product: {
  imageUrl?: string
  images?: { url: string; ordre?: number }[]
}): boolean {
  return getProductImages(product).length > 1
}

export function getSimulationImage(product: {
  imageUrl?: string
  images?: { url: string; ordre?: number }[]
}): string | null {
  const images = getProductImages(product)
  return images.length > 1 ? images[1] : null
}
