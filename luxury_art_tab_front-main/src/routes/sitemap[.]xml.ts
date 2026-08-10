import { createFileRoute } from '@tanstack/react-router'
import { api } from '@/lib/api'
import { buildSitemapXml, collectSitemapUrls } from '@/lib/seo'

async function buildSitemapResponse() {
  try {
    const [products, categories] = await Promise.all([
      api.getProducts(),
      api.getCategories(),
    ])

    const categoryProductCounts: Record<number, number> = {}
    for (const product of products) {
      if (product.statut === 'ARCHIVE') continue
      categoryProductCounts[product.categoryId] =
        (categoryProductCounts[product.categoryId] ?? 0) + 1
    }

    const urls = collectSitemapUrls({
      products,
      categories,
      categoryProductCounts,
    })

    return new Response(buildSitemapXml(urls), {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
      },
    })
  } catch {
    const urls = collectSitemapUrls({
      products: [],
      categories: [],
      categoryProductCounts: {},
    })
    return new Response(buildSitemapXml(urls), {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=300',
      },
    })
  }
}

const createSitemapRoute = createFileRoute('/sitemap.xml') as unknown as (
  options: Record<string, unknown>,
) => ReturnType<typeof createFileRoute>

/** Server route TanStack Start — GET /sitemap.xml (produits + pages publiques). */
export const Route = createSitemapRoute({
  server: {
    handlers: {
      GET: async () => buildSitemapResponse(),
    },
  },
})
