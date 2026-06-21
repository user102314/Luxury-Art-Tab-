import { QueryClient } from '@tanstack/react-query'

/** Cache 2 min, données servies instantanément à la navigation */
export const STALE_TIME = 2 * 60_000
export const GC_TIME = 15 * 60_000
/** Rafraîchissement automatique en arrière-plan */
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
