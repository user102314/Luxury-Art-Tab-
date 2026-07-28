import {
  keepPreviousData,
  useQuery,
  type QueryClient,
} from '@tanstack/react-query'
import { api } from '@/lib/api'
import { REFETCH_INTERVAL } from '@/lib/queryClient'
import { queryKeys } from '@/lib/queryKeys'

const listOptions = {
  refetchInterval: REFETCH_INTERVAL,
  placeholderData: keepPreviousData,
}

export function useProducts(enabled = true) {
  return useQuery({
    queryKey: queryKeys.products,
    queryFn: api.getProducts,
    enabled,
    ...listOptions,
  })
}

export function useCategories() {
  return useQuery({
    queryKey: queryKeys.categories,
    queryFn: api.getCategories,
    staleTime: 5 * 60_000,
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

export function usePublishedNews() {
  return useQuery({
    queryKey: queryKeys.newsPublished,
    queryFn: api.getPublishedNews,
    refetchInterval: REFETCH_INTERVAL,
    placeholderData: keepPreviousData,
  })
}

export function useProduct(id: number) {
  return useQuery({
    queryKey: queryKeys.product(id),
    queryFn: () => api.getProduct(id),
    enabled: !Number.isNaN(id),
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
