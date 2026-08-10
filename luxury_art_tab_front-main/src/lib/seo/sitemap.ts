import { SITE, SEO_PATHS, absoluteUrl } from './site'
import type { Category, Product } from '@/types/api'
import { preferredCategorySlug } from './categories'

export type SitemapUrl = {
  loc: string
  lastmod?: string
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never'
  priority?: number
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export function buildSitemapXml(urls: SitemapUrl[]): string {
  const body = urls
    .map((u) => {
      const parts = [
        `    <loc>${escapeXml(u.loc)}</loc>`,
        u.lastmod ? `    <lastmod>${escapeXml(u.lastmod)}</lastmod>` : null,
        u.changefreq ? `    <changefreq>${u.changefreq}</changefreq>` : null,
        u.priority != null ? `    <priority>${u.priority.toFixed(1)}</priority>` : null,
      ].filter(Boolean)
      return `  <url>\n${parts.join('\n')}\n  </url>`
    })
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>`
}

export function collectSitemapUrls(input: {
  products: Product[]
  categories: Category[]
  categoryProductCounts: Record<number, number>
}): SitemapUrl[] {
  const today = new Date().toISOString().slice(0, 10)
  const urls: SitemapUrl[] = [
    { loc: absoluteUrl(SEO_PATHS.home), changefreq: 'daily', priority: 1, lastmod: today },
    { loc: absoluteUrl(SEO_PATHS.products), changefreq: 'daily', priority: 0.9, lastmod: today },
    { loc: absoluteUrl(SEO_PATHS.actualites), changefreq: 'weekly', priority: 0.7, lastmod: today },
    { loc: absoluteUrl(SEO_PATHS.contact), changefreq: 'monthly', priority: 0.6, lastmod: today },
  ]

  const indexableProducts = input.products.filter((p) => p.statut !== 'ARCHIVE')
  for (const product of indexableProducts) {
    urls.push({
      loc: absoluteUrl(SEO_PATHS.product(product.id)),
      changefreq: 'weekly',
      priority: 0.8,
      lastmod: today,
    })
  }

  for (const category of input.categories) {
    const count = input.categoryProductCounts[category.id] ?? 0
    if (count < 1) continue
    const slug = preferredCategorySlug(category)
    urls.push({
      loc: absoluteUrl(SEO_PATHS.category(slug)),
      changefreq: 'weekly',
      priority: 0.7,
      lastmod: today,
    })
  }

  return urls
}

export function sitemapRobotsTxt(): string {
  return `User-agent: *
Allow: /

Disallow: /admin
Disallow: /checkout
Disallow: /compte
Disallow: /signin
Disallow: /signup
Disallow: /maintenance

Sitemap: ${SITE.url}/sitemap.xml
`
}
