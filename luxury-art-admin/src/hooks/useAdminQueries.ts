import {
  useQuery,
  useQueryClient,
  keepPreviousData,
  type QueryClient,
} from '@tanstack/react-query'
import { api } from '../lib/api'
import { queryKeys } from '../lib/queryKeys'
import { REFETCH_INTERVAL } from '../lib/queryClient'

export function useOrders() {
  return useQuery({
    queryKey: queryKeys.orders,
    queryFn: api.getOrders,
    refetchInterval: REFETCH_INTERVAL,
    placeholderData: keepPreviousData,
  })
}

export function useOrderChannelStats() {
  return useQuery({
    queryKey: queryKeys.orderChannelStats,
    queryFn: api.getOrderChannelStats,
    refetchInterval: REFETCH_INTERVAL,
    placeholderData: keepPreviousData,
  })
}

export function useProducts() {
  return useQuery({
    queryKey: queryKeys.products,
    queryFn: api.getProducts,
    refetchInterval: REFETCH_INTERVAL,
    placeholderData: keepPreviousData,
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

export function useBestSellers() {
  return useQuery({
    queryKey: queryKeys.bestSellers,
    queryFn: api.getBestSellers,
    placeholderData: keepPreviousData,
  })
}

export function useDashboardStats() {
  return useQuery({
    queryKey: queryKeys.dashboardStats,
    queryFn: api.getDashboardStats,
    placeholderData: keepPreviousData,
  })
}

export function useNews() {
  return useQuery({
    queryKey: queryKeys.news,
    queryFn: api.getNews,
    refetchInterval: REFETCH_INTERVAL,
    placeholderData: keepPreviousData,
  })
}

export function useReviews() {
  return useQuery({
    queryKey: queryKeys.reviews,
    queryFn: api.getReviews,
    refetchInterval: REFETCH_INTERVAL,
    placeholderData: keepPreviousData,
  })
}

export function useProductComments() {
  return useQuery({
    queryKey: queryKeys.comments,
    queryFn: api.getProductComments,
    refetchInterval: REFETCH_INTERVAL,
    placeholderData: keepPreviousData,
  })
}

export function useLoyaltyStats() {
  return useQuery({
    queryKey: queryKeys.loyaltyStats,
    queryFn: api.getLoyaltyStats,
    placeholderData: keepPreviousData,
  })
}

export function useLoyaltyPrograms() {
  return useQuery({
    queryKey: queryKeys.loyaltyPrograms,
    queryFn: api.getLoyaltyPrograms,
    placeholderData: keepPreviousData,
  })
}

export function useLoyaltyClients() {
  return useQuery({
    queryKey: queryKeys.loyaltyClients,
    queryFn: api.getLoyaltyClients,
    placeholderData: keepPreviousData,
  })
}

export function useLoyaltyRewards() {
  return useQuery({
    queryKey: queryKeys.loyaltyRewards,
    queryFn: api.getLoyaltyRewards,
    placeholderData: keepPreviousData,
  })
}

export function useProductAnalytics(id: number | null) {
  return useQuery({
    queryKey: queryKeys.productAnalytics(id ?? 0),
    queryFn: () => api.getProductAnalytics(id!),
    enabled: id != null,
  })
}

export function useInvalidateAdmin() {
  const qc = useQueryClient()
  return {
    orders: () => qc.invalidateQueries({ queryKey: queryKeys.orders }),
    orderChannelStats: () => qc.invalidateQueries({ queryKey: queryKeys.orderChannelStats }),
    products: () => qc.invalidateQueries({ queryKey: queryKeys.products }),
    categories: () => qc.invalidateQueries({ queryKey: queryKeys.categories }),
    bestSellers: () => qc.invalidateQueries({ queryKey: queryKeys.bestSellers }),
    dashboardStats: () => qc.invalidateQueries({ queryKey: queryKeys.dashboardStats }),
    news: () => qc.invalidateQueries({ queryKey: queryKeys.news }),
    reviews: () => qc.invalidateQueries({ queryKey: queryKeys.reviews }),
    comments: () => qc.invalidateQueries({ queryKey: queryKeys.comments }),
    loyaltyStats: () => qc.invalidateQueries({ queryKey: queryKeys.loyaltyStats }),
    loyaltyPrograms: () => qc.invalidateQueries({ queryKey: queryKeys.loyaltyPrograms }),
    loyaltyClients: () => qc.invalidateQueries({ queryKey: queryKeys.loyaltyClients }),
    loyaltyRewards: () => qc.invalidateQueries({ queryKey: queryKeys.loyaltyRewards }),
    productAnalytics: (id: number) =>
      qc.invalidateQueries({ queryKey: queryKeys.productAnalytics(id) }),
    all: () => qc.invalidateQueries(),
  }
}

/** Prefetch au survol du menu — navigation instantanée */
export function prefetchRoute(qc: QueryClient, path: string) {
  const opts = { staleTime: 2 * 60_000 }
  switch (path) {
    case '/dashboard':
      qc.prefetchQuery({ queryKey: queryKeys.orders, queryFn: api.getOrders, ...opts })
      qc.prefetchQuery({ queryKey: queryKeys.products, queryFn: api.getProducts, ...opts })
      break
    case '/orders':
      qc.prefetchQuery({ queryKey: queryKeys.orders, queryFn: api.getOrders, ...opts })
      break
    case '/revenue':
      qc.prefetchQuery({ queryKey: queryKeys.orders, queryFn: api.getOrders, ...opts })
      qc.prefetchQuery({ queryKey: queryKeys.dashboardStats, queryFn: api.getDashboardStats, ...opts })
      break
    case '/products':
      qc.prefetchQuery({ queryKey: queryKeys.products, queryFn: api.getProducts, ...opts })
      qc.prefetchQuery({ queryKey: queryKeys.categories, queryFn: api.getCategories, ...opts })
      qc.prefetchQuery({ queryKey: queryKeys.bestSellers, queryFn: api.getBestSellers, ...opts })
      break
    case '/moderation':
      qc.prefetchQuery({ queryKey: queryKeys.reviews, queryFn: api.getReviews, ...opts })
      qc.prefetchQuery({ queryKey: queryKeys.comments, queryFn: api.getProductComments, ...opts })
      qc.prefetchQuery({ queryKey: queryKeys.products, queryFn: api.getProducts, ...opts })
      break
    case '/news':
      qc.prefetchQuery({ queryKey: queryKeys.news, queryFn: api.getNews, ...opts })
      break
    case '/facebook-orders':
      qc.prefetchQuery({ queryKey: queryKeys.orders, queryFn: api.getOrders, ...opts })
      qc.prefetchQuery({ queryKey: queryKeys.products, queryFn: api.getProducts, ...opts })
      qc.prefetchQuery({ queryKey: queryKeys.orderChannelStats, queryFn: api.getOrderChannelStats, ...opts })
      break
    case '/loyalty':
      qc.prefetchQuery({ queryKey: queryKeys.loyaltyStats, queryFn: api.getLoyaltyStats, ...opts })
      qc.prefetchQuery({ queryKey: queryKeys.loyaltyPrograms, queryFn: api.getLoyaltyPrograms, ...opts })
      qc.prefetchQuery({ queryKey: queryKeys.loyaltyClients, queryFn: api.getLoyaltyClients, ...opts })
      break
  }
}

/** Précharge les données essentielles au démarrage de l'admin */
export function prefetchEssentials(qc: QueryClient) {
  prefetchRoute(qc, '/dashboard')
  prefetchRoute(qc, '/orders')
  prefetchRoute(qc, '/products')
}
