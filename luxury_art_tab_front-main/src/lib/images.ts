import { getApiOrigin } from '@/lib/apiBase'

export { getApiBase, getApiOrigin } from '@/lib/apiBase'

export const IMAGE_WIDTH = {
  thumb: 160,
  card: 540,
  hero: 480,
  news: 900,
  gallery: 1200,
  testimonial: 428,
  color: 360,
} as const

/**
 * Résout une URL média backend (`/uploads/...`) vers l'origine API HTTPS.
 * Les blob:/data:/http(s): restent inchangées.
 *
 * Les miniatures `/api/media/thumb` ne sont utilisées que si `VITE_IMAGE_THUMBS=true`
 * (le JAR production doit exposer cet endpoint, sinon toutes les images cassent).
 */
export function resolveImageSrc(url?: string | null, width?: number): string {
  if (!url) return '/placeholder-art.svg'
  if (url.startsWith('blob:') || url.startsWith('data:')) return url
  if (url.includes('placeholder-art')) return url

  let absolute = url
  if (
    !url.startsWith('http://') &&
    !url.startsWith('https://')
  ) {
    const path = url.startsWith('/') ? url : `/${url}`
    const origin = getApiOrigin()
    if (origin && (path.startsWith('/uploads') || path.startsWith('/api'))) {
      absolute = `${origin}${path}`
    } else {
      absolute = path
    }
  }

  if (!width || width <= 0) return absolute
  if (import.meta.env.VITE_IMAGE_THUMBS !== 'true') return absolute
  return withThumbWidth(absolute, width)
}

/** Si une miniature API échoue, revenir au fichier /uploads d’origine. */
export function originalUploadSrc(url: string): string {
  if (!url.includes('/api/media/thumb')) return url
  try {
    const parsed = new URL(url, 'https://luxury-art.tn')
    const src = parsed.searchParams.get('src')
    if (!src) return url
    return resolveImageSrc(src)
  } catch {
    return url
  }
}

export function fallbackFromBrokenImage(event: { currentTarget: HTMLImageElement }) {
  const img = event.currentTarget
  const original = originalUploadSrc(img.currentSrc || img.src)
  if (!original || original === img.src) return
  img.onerror = null
  img.src = original
}

function withThumbWidth(url: string, width: number): string {
  const uploadsIdx = url.indexOf('/uploads/')
  if (uploadsIdx < 0) return url
  const path = url.slice(uploadsIdx)
  if (path.includes('..')) return url
  let origin: string | undefined
  if (/^https?:\/\//i.test(url)) {
    try {
      origin = new URL(url).origin
    } catch {
      origin = getApiOrigin()
    }
  } else {
    origin = getApiOrigin()
  }
  if (!origin) return url
  const w = Math.min(1600, Math.max(80, Math.round(width)))
  return `${origin}/api/media/thumb?w=${w}&src=${encodeURIComponent(path)}`
}

export function getProductImages(
  product: {
    imageUrl?: string
    images?: { url: string; ordre?: number }[]
  },
  width?: number,
): string[] {
  if (product.images?.length) {
    return [...product.images]
      .sort((a, b) => (a.ordre ?? 0) - (b.ordre ?? 0))
      .map((img) => resolveImageSrc(img.url, width))
      .filter(Boolean)
  }
  if (product.imageUrl) return [resolveImageSrc(product.imageUrl, width)]
  return ['/placeholder-art.svg']
}

export function getProductImage(
  product: {
    imageUrl?: string
    images?: { url: string; ordre?: number }[]
  },
  width: number = IMAGE_WIDTH.card,
): string {
  return getProductImages(product, width)[0]
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
  const images = getProductImages(product, IMAGE_WIDTH.gallery)
  return images.length > 1 ? images[1] : null
}

/** Image hero catégorie : préfère l'image n°2 (simulation AR), sinon la vignette catalogue. */
export function getShowcaseHeroImage(
  product: {
    imageUrl?: string
    images?: { url: string; ordre?: number }[]
  },
  width: number = IMAGE_WIDTH.hero,
): string {
  return getSimulationImage(product) ?? getProductImage(product, width)
}
