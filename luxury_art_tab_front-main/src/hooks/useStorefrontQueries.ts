import {
  keepPreviousData,
  useQuery,
  type QueryClient,
} from '@tanstack/react-query'
import { api } from '@/lib/api'
import { REFETCH_INTERVAL, STALE_TIME } from '@/lib/queryClient'
import { queryKeys } from '@/lib/queryKeys'
import type { Category, CategoryShowcase, News, Product, Testimonial } from '@/types/api'

export function useProducts(options?: {
  initialData?: Product[]
  enabled?: boolean
  refetchInterval?: number | false
  staleTime?: number
}) {
  return useQuery({
    queryKey: queryKeys.products,
    queryFn: api.getProducts,
    enabled: options?.enabled ?? true,
    initialData: options?.initialData,
    staleTime: options?.staleTime ?? STALE_TIME,
    refetchInterval: options?.refetchInterval ?? REFETCH_INTERVAL,
    placeholderData: keepPreviousData,
  })
}

export function useCategories(options?: { initialData?: Category[]; enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.categories,
    queryFn: api.getCategories,
    staleTime: 5 * 60_000,
    enabled: options?.enabled ?? true,
    initialData: options?.initialData,
    placeholderData: keepPreviousData,
  })
}

export function useCatalogPricing() {
  return useQuery({
    queryKey: queryKeys.catalogPricing,
    queryFn: api.getCatalogPricing,
    staleTime: 60_000,
    placeholderData: keepPreviousData,
  })
}

export function useCategoryShowcase(options?: { initialData?: CategoryShowcase[] }) {
  return useQuery({
    queryKey: queryKeys.categoryShowcase,
    queryFn: api.getCategoryShowcase,
    refetchInterval: REFETCH_INTERVAL,
    initialData: options?.initialData,
    staleTime: 60_000,
    placeholderData: keepPreviousData,
  })
}

export function usePublishedNews(options?: { initialData?: News[] }) {
  return useQuery({
    queryKey: queryKeys.newsPublished,
    queryFn: api.getPublishedNews,
    refetchInterval: REFETCH_INTERVAL,
    initialData: options?.initialData,
    placeholderData: keepPreviousData,
  })
}

export function useProduct(id: number, options?: { initialData?: Product | null }) {
  return useQuery({
    queryKey: queryKeys.product(id),
    queryFn: () => api.getProduct(id),
    enabled: !Number.isNaN(id),
    initialData: options?.initialData ?? undefined,
    placeholderData: keepPreviousData,
  })
}

export function useSiteSettings() {
  return useQuery({
    queryKey: queryKeys.siteSettings,
    queryFn: api.getSiteSettings,
    staleTime: 5 * 60_000,
    placeholderData: keepPreviousData,
  })
}

export function useActiveTestimonials(options?: { initialData?: Testimonial[] }) {
  return useQuery({
    queryKey: queryKeys.testimonialsActive,
    queryFn: api.getActiveTestimonials,
    refetchInterval: REFETCH_INTERVAL,
    initialData: options?.initialData,
    placeholderData: keepPreviousData,
  })
}

/** Précharge les données au survol / intent des liens de navigation */
export function prefetchProductDetail(qc: QueryClient, productId: number) {
  const opts = { staleTime: 2 * 60_000 }
  void qc.prefetchQuery({
    queryKey: queryKeys.product(productId),
    queryFn: () => api.getProduct(productId),
    ...opts,
  })
  void qc.prefetchQuery({
    queryKey: queryKeys.catalogPricing,
    queryFn: api.getCatalogPricing,
    ...opts,
  })
}

export function prefetchStorefrontRoute(qc: QueryClient, path: string) {
  const opts = { staleTime: 2 * 60_000 }
  const productMatch = path.match(/^\/products\/(\d+)\/?$/)
  if (productMatch) {
    prefetchProductDetail(qc, Number(productMatch[1]))
    return
  }
  if (path === '/products' || path.startsWith('/products')) {
    void qc.prefetchQuery({ queryKey: queryKeys.products, queryFn: api.getProducts, ...opts })
    void qc.prefetchQuery({ queryKey: queryKeys.categories, queryFn: api.getCategories, ...opts })
    void qc.prefetchQuery({ queryKey: queryKeys.catalogPricing, queryFn: api.getCatalogPricing, ...opts })
  }
  if (path.startsWith('/category/')) {
    void qc.prefetchQuery({ queryKey: queryKeys.products, queryFn: api.getProducts, ...opts })
    void qc.prefetchQuery({ queryKey: queryKeys.categories, queryFn: api.getCategories, ...opts })
  }
  if (path === '/actualites') {
    void qc.prefetchQuery({ queryKey: queryKeys.newsPublished, queryFn: api.getPublishedNews, ...opts })
  }
  if (path === '/contact') {
    void qc.prefetchQuery({ queryKey: queryKeys.siteSettings, queryFn: api.getSiteSettings, ...opts })
  }
}
