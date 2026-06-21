import { QueryClient } from '@tanstack/react-query'

export const STALE_TIME = 2 * 60_000
export const GC_TIME = 15 * 60_000
export const REFETCH_INTERVAL = 45_000

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: STALE_TIME,
      gcTime: GC_TIME,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      refetchOnMount: false,
      retry: 1,
    },
  },
})
