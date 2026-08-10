import { SITE, absoluteImageUrl, absoluteUrl } from './site'

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

/** Descriptions marketing (pages statiques). */
export const PAGE_COPY = {
  home: {
    title: 'Luxury Art_Tab | Tableaux et décoration murale en Tunisie',
    description:
      'Découvrez Luxury Art_Tab : tableaux décoratifs et art mural en Tunisie. Collections salon, cuisine et sur mesure, livraison soignée.',
    h1: 'Tableaux et décoration murale en Tunisie',
  },
  products: {
    title: 'Tableaux et décoration murale | Luxury Art_Tab',
    description:
      'Parcourez notre catalogue de tableaux et décorations murales. Filtrez par style, trouvez la toile idéale et commandez en Tunisie.',
    h1: 'Nos tableaux et décorations murales',
  },
  actualites: {
    title: 'Actualités décoration et tableaux | Luxury Art_Tab',
    description:
      'Promotions, nouvelles collections et annonces de la boutique Luxury Art_Tab. Suivez l’actualité déco en Tunisie.',
    h1: 'Actualités décoration et tableaux',
  },
  contact: {
    title: 'Contact | Luxury Art_Tab',
    description:
      'Contactez Luxury Art_Tab pour un projet sur mesure, une question produit ou une commande. Réponse rapide depuis la Tunisie.',
    h1: 'Contactez-nous',
  },
} as const

export function productSeoDescription(product: {
  nom: string
  description?: string
  categoryName?: string
}): string {
  if (product.description?.trim()) {
    const trimmed = product.description.trim().replace(/\s+/g, ' ')
    return trimmed.length > 155 ? `${trimmed.slice(0, 152)}…` : trimmed
  }
  const cat = product.categoryName ? ` pour ${product.categoryName}` : ''
  return `Achetez « ${product.nom} »${cat} chez Luxury Art_Tab. Tableau décoratif livré en Tunisie.`
}

export function categorySeoDescription(categoryName: string, productCount: number): string {
  if (productCount > 0) {
    return `Découvrez nos tableaux ${categoryName.toLowerCase()} (${productCount} œuvre${productCount > 1 ? 's' : ''}). Décoration murale Luxury Art_Tab, livraison en Tunisie.`
  }
  return `Collection ${categoryName} — Luxury Art_Tab, tableaux et décoration murale en Tunisie.`
}
