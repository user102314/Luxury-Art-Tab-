import { SITE, absoluteUrl, absoluteImageUrl } from './site'

export function organizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE.fullName,
    url: SITE.url,
    logo: absoluteImageUrl(SITE.defaultOgImage),
    email: SITE.email,
    areaServed: {
      '@type': 'Country',
      name: 'Tunisie',
    },
  }
}

export function websiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE.name,
    url: SITE.url,
    inLanguage: 'fr-TN',
    publisher: {
      '@type': 'Organization',
      name: SITE.fullName,
    },
  }
}

export function productSchema(input: {
  id: number
  ref: string
  description: string
  image?: string | null
  prix: number
  available?: boolean
  sku?: string
}) {
  const url = absoluteUrl(`/products/${input.id}`)
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: input.ref,
    description: input.description,
    image: input.image ? [absoluteImageUrl(input.image)] : undefined,
    sku: input.sku ?? input.ref ?? String(input.id),
    brand: {
      '@type': 'Brand',
      name: SITE.name,
    },
    offers: {
      '@type': 'Offer',
      url,
      priceCurrency: SITE.currency,
      price: Number(input.prix),
      availability:
        input.available === false
          ? 'https://schema.org/OutOfStock'
          : 'https://schema.org/InStock',
    },
  }
}

export function breadcrumbSchema(
  items: { name: string; path: string }[],
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  }
}
