/** Base API (ex. http://57.129.42.159:8081/api ou /api en proxy local). */
export function getApiBase(): string {
  return import.meta.env.VITE_API_URL ?? '/api'
}

/** Origine du backend (scheme + host + port), utile pour /uploads et WebSocket. */
export function getApiOrigin(): string | undefined {
  const base = getApiBase()
  if (!/^https?:\/\//i.test(base)) return undefined
  try {
    return new URL(base).origin
  } catch {
    return undefined
  }
}

export function resolveImageSrc(url?: string | null): string {
  if (!url) return '/placeholder-art.svg'
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:') || url.startsWith('data:')) {
    return url
  }
  const path = url.startsWith('/') ? url : `/${url}`
  const origin = getApiOrigin()
  if (origin && (path.startsWith('/uploads') || path.startsWith('/api'))) {
    return `${origin}${path}`
  }
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
