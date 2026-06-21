export function resolveImageSrc(url?: string | null): string {
  if (!url) return '/placeholder-art.svg'
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  if (url.startsWith('/uploads')) return url
  return url.startsWith('/') ? url : `/${url}`
}

export function getProductImage(product: {
  imageUrl?: string
  images?: { url: string; ordre?: number }[]
}): string {
  if (product.images?.length) {
    const sorted = [...product.images].sort((a, b) => (a.ordre ?? 0) - (b.ordre ?? 0))
    return resolveImageSrc(sorted[0].url)
  }
  return resolveImageSrc(product.imageUrl)
}
