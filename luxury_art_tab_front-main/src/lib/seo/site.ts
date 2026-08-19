/**
 * Configuration SEO centrale — marché Tunisie uniquement.
 * Domaine de référence : https://luxury-art.tn
 */

export const SITE = {
  url: 'https://luxury-art.tn',
  name: 'Luxury Art_Tab',
  fullName: 'Luxury Art_Tab By Insaf',
  tagline: 'Tableaux décoratifs muraux en Tunisie',
  locale: 'fr_TN',
  htmlLang: 'fr',
  country: 'TN',
  currency: 'TND',
  defaultDescription:
    'Boutique de tableaux décoratifs muraux en Tunisie. Formats et cadres au choix, livraison partout en Tunisie.',
  defaultOgImage: '/logo.png',
  email: 'contact@luxuryart.tn',
  organizationType: 'Organization' as const,
} as const

export type SiteConfig = typeof SITE

/** Construit une URL absolue sur le domaine SEO officiel. */
export function absoluteUrl(path = '/'): string {
  if (/^https?:\/\//i.test(path)) return path
  const normalized = path.startsWith('/') ? path : `/${path}`
  if (normalized === '/') return `${SITE.url}/`
  return `${SITE.url}${normalized.replace(/\/+$/, '')}`
}

/** Image OG absolue (chemin site ou URL API absolue déjà résolue). */
export function absoluteImageUrl(src?: string | null): string {
  if (!src) return absoluteUrl(SITE.defaultOgImage)
  if (/^https?:\/\//i.test(src)) return src
  return absoluteUrl(src)
}

export const SEO_PATHS = {
  home: '/',
  products: '/products',
  product: (id: number | string) => `/products/${id}`,
  category: (slug: string) => `/category/${slug}`,
  actualites: '/actualites',
  contact: '/contact',
  sitemap: '/sitemap.xml',
} as const

export const NOINDEX_PATH_PREFIXES = [
  '/admin',
  '/signin',
  '/signup',
  '/compte',
  '/checkout',
  '/maintenance',
] as const
