import { api } from '@/lib/api'
import { queryClient } from '@/lib/queryClient'
import { queryKeys } from '@/lib/queryKeys'
import type { CatalogPricing, Category, CategoryShowcase, Product } from '@/types/api'

const CATALOG_STALE = 5 * 60_000

const emptyCatalogPricing: CatalogPricing = {
  dimensions: [],
  cadres: [],
  tarifs: [],
}

/** Partage le cache React Query entre les loaders de routes (accueil → galerie instantanée). */
export async function ensureStorefrontCatalog(): Promise<{
  products: Product[]
  categories: Category[]
}> {
  const [products, categories] = await Promise.all([
    queryClient.ensureQueryData({
      queryKey: queryKeys.products,
      queryFn: () => api.getProducts().catch(() => [] as Product[]),
      staleTime: CATALOG_STALE,
    }),
    queryClient.ensureQueryData({
      queryKey: queryKeys.categories,
      queryFn: () => api.getCategories().catch(() => [] as Category[]),
      staleTime: CATALOG_STALE,
    }),
  ])
  return { products, categories }
}

/** Hero dynamique : préchargé avant le paint pour éviter le flash d'images statiques. */
export async function ensureCategoryShowcase(): Promise<CategoryShowcase[]> {
  return queryClient.ensureQueryData({
    queryKey: queryKeys.categoryShowcase,
    queryFn: () => api.getCategoryShowcase().catch(() => [] as CategoryShowcase[]),
    staleTime: 60_000,
  })
}

export function prefetchCatalogPricing() {
  void queryClient.prefetchQuery({
    queryKey: queryKeys.catalogPricing,
    queryFn: () => api.getCatalogPricing().catch(() => emptyCatalogPricing),
    staleTime: CATALOG_STALE,
  })
}

export async function ensureCatalogPricing(): Promise<CatalogPricing> {
  return queryClient.ensureQueryData({
    queryKey: queryKeys.catalogPricing,
    queryFn: () => api.getCatalogPricing().catch(() => emptyCatalogPricing),
    staleTime: CATALOG_STALE,
  })
}
