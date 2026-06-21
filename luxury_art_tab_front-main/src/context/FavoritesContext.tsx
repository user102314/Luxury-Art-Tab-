import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import { useVisitor } from '@/context/VisitorContext'
import type { Product } from '@/types/api'
import { getProductImage } from '@/lib/images'

const STORAGE_KEY = 'luxart_favorites'

interface FavoritesContextType {
  favoriteIds: number[]
  toggleFavorite: (productId: number) => Promise<void>
  isFavorite: (productId: number) => boolean
  count: number
  syncing: boolean
}

const FavoritesContext = createContext<FavoritesContextType | null>(null)

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { ensureVisitor, visitor } = useVisitor()
  const [favoriteIds, setFavoriteIds] = useState<number[]>([])
  const [syncing, setSyncing] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        setFavoriteIds(JSON.parse(stored))
      } catch {
        localStorage.removeItem(STORAGE_KEY)
      }
    }
  }, [])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(favoriteIds))
  }, [favoriteIds])

  useEffect(() => {
    if (!visitor?.id || favoriteIds.length === 0) return
    setSyncing(true)
    Promise.all(
      favoriteIds.map(async (productId) => {
        try {
          const summary = await api.getLikeSummary(productId, visitor.id)
          if (!summary.userLiked) {
            await api.likeProduct(productId, visitor.id)
          }
        } catch {
          /* endpoint may be unavailable until backend restart */
        }
      }),
    ).finally(() => setSyncing(false))
  }, [visitor?.id])

  const isFavorite = useCallback(
    (productId: number) => favoriteIds.includes(productId),
    [favoriteIds],
  )

  const toggleFavorite = async (productId: number) => {
    let user
    try {
      user = await ensureVisitor()
    } catch {
      toast.error('Session visiteur indisponible. Rechargez la page.')
      return
    }

    const liked = favoriteIds.includes(productId)
    try {
      if (liked) {
        await api.unlikeProduct(productId, user.id)
        setFavoriteIds((prev) => prev.filter((id) => id !== productId))
      } else {
        await api.likeProduct(productId, user.id)
        setFavoriteIds((prev) => [...prev, productId])
      }
    } catch (err) {
      if (liked) {
        setFavoriteIds((prev) => prev.filter((id) => id !== productId))
      } else {
        setFavoriteIds((prev) => [...prev, productId])
        toast.warning('Favori enregistré localement — redémarrez le backend pour synchroniser.')
      }
      if (err instanceof Error && !err.message.includes('404')) {
        toast.error(err.message)
      }
    }
  }

  return (
    <FavoritesContext.Provider
      value={{
        favoriteIds,
        toggleFavorite,
        isFavorite,
        count: favoriteIds.length,
        syncing,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  )
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext)
  if (!ctx) throw new Error('useFavorites must be used within FavoritesProvider')
  return ctx
}

export { getProductImage }
