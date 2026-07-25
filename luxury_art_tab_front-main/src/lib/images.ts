export function resolveImageSrc(url?: string | null): string {
  if (!url) return '/placeholder-art.svg'
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  if (url.startsWith('/uploads')) return url
  return url.startsWith('/') ? url : `/${url}`
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
