import { SITE, absoluteImageUrl, absoluteUrl } from './site'
import { categorySeoCopy } from './copy'

export type SeoRobots = 'index, follow' | 'noindex, nofollow' | 'noindex, follow'


export type BuildSeoHeadInput = {
  title: string
  description: string
  path: string
  /** Canonical override (absolute or path). Defaults to path. */
  canonical?: string
  image?: string | null
  type?: 'website' | 'article' | 'product'
  robots?: SeoRobots
  jsonLd?: Record<string, unknown> | Record<string, unknown>[]
}

type MetaEntry =
  | { title: string }
  | { name: string; content: string }
  | { property: string; content: string }

/**
 * Construit l'objet `head` TanStack Start (meta + links + scripts JSON-LD).
 */
export function buildSeoHead(input: BuildSeoHeadInput) {
  const canonical = absoluteUrl(input.canonical ?? input.path)
  const image = absoluteImageUrl(input.image)
  const robots = input.robots ?? 'index, follow'
  const ogType = input.type ?? 'website'

  const meta: MetaEntry[] = [
    { title: input.title },
    { name: 'description', content: input.description },
    { name: 'robots', content: robots },
    { property: 'og:title', content: input.title },
    { property: 'og:description', content: input.description },
    { property: 'og:type', content: ogType },
    { property: 'og:url', content: canonical },
    { property: 'og:image', content: image },
    { property: 'og:locale', content: SITE.locale },
    { property: 'og:site_name', content: SITE.name },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: input.title },
    { name: 'twitter:description', content: input.description },
    { name: 'twitter:image', content: image },
  ]

  const links = [{ rel: 'canonical', href: canonical }]

  const schemas = input.jsonLd
    ? Array.isArray(input.jsonLd)
      ? input.jsonLd
      : [input.jsonLd]
    : []

  const scripts = schemas.map((schema) => ({
    type: 'application/ld+json' as const,
    children: JSON.stringify(schema),
  }))

  return { meta, links, scripts }
}

export function noIndexHead(title: string, description?: string) {
  return buildSeoHead({
    title,
    description: description ?? SITE.defaultDescription,
    path: '/',
    canonical: absoluteUrl('/'),
    robots: 'noindex, nofollow',
  })
}

export { PAGE_COPY } from './copy'

export function productSeoDescription(product: {
  ref: string
  description?: string
  categoryName?: string
}): string {
  if (product.description?.trim()) {
    const trimmed = product.description.trim().replace(/\s+/g, ' ')
    return trimmed.length > 155 ? `${trimmed.slice(0, 152)}…` : trimmed
  }
  const cat = product.categoryName?.trim()
  if (cat) {
    return `Tableau décoratif ${cat} ${product.ref} chez Luxury Art_Tab. Format et cadre au choix, livraison en Tunisie.`
  }
  return `Tableau décoratif ${product.ref} chez Luxury Art_Tab. Décoration murale, livraison en Tunisie.`
}

export function categorySeoDescription(
  categoryName: string,
  productCount: number,
  slug?: string,
): string {
  return categorySeoCopy(slug ?? categoryName, categoryName).description(productCount)
}
