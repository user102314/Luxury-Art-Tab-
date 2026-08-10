import {
  keepPreviousData,
  useQuery,
  type QueryClient,
} from '@tanstack/react-query'
import { api } from '@/lib/api'
import { REFETCH_INTERVAL } from '@/lib/queryClient'
import { queryKeys } from '@/lib/queryKeys'
import type { Category, News, Product, Testimonial } from '@/types/api'

const listOptions = {
  refetchInterval: REFETCH_INTERVAL,
  placeholderData: keepPreviousData,
}

export function useProducts(options?: { initialData?: Product[]; enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.products,
    queryFn: api.getProducts,
    enabled: options?.enabled ?? true,
    initialData: options?.initialData,
    ...listOptions,
  })
}

export function useCategories(options?: { initialData?: Category[] }) {
  return useQuery({
    queryKey: queryKeys.categories,
    queryFn: api.getCategories,
    staleTime: 5 * 60_000,
    initialData: options?.initialData,
    placeholderData: keepPreviousData,
  })
}

export function useCategoryShowcase() {
  return useQuery({
    queryKey: queryKeys.categoryShowcase,
    queryFn: api.getCategoryShowcase,
    refetchInterval: REFETCH_INTERVAL,
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

/** Précharge les données au survol des liens de navigation */
export function prefetchStorefrontRoute(qc: QueryClient, path: string) {
  const opts = { staleTime: 2 * 60_000 }
  if (path === '/products' || path.startsWith('/products')) {
    qc.prefetchQuery({ queryKey: queryKeys.products, queryFn: api.getProducts, ...opts })
    qc.prefetchQuery({ queryKey: queryKeys.categories, queryFn: api.getCategories, ...opts })
  }
  if (path === '/actualites') {
    qc.prefetchQuery({ queryKey: queryKeys.newsPublished, queryFn: api.getPublishedNews, ...opts })
  }
}
