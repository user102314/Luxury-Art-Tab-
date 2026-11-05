import { Link } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { Camera, Sparkles } from 'lucide-react'
import type { Product } from '@/types/api'
import { getProductImage, getSimulationImage, IMAGE_WIDTH, fallbackFromBrokenImage } from '@/lib/images'
import { prefetchProductDetail } from '@/hooks/useStorefrontQueries'
import { productVisibleTitle } from '@/lib/seo'
import { formatStartingPrice } from '@/lib/pricing'
import { useFavorites } from '@/context/FavoritesContext'
import { api, getTrackingSessionId } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { toast } from 'sonner'

interface ProductCardProps {
  product: Product
  categoryName?: string
  index?: number
  onAr?: (imageUrl: string) => void
  compact?: boolean
  /** Charge l'image immédiatement (premiers items du catalogue). */
  imagePriority?: boolean
}

export function ProductCard({ product, categoryName, index = 0, onAr, compact = false, imagePriority = false }: ProductCardProps) {
  const queryClient = useQueryClient()
  const { isFavorite, toggleFavorite } = useFavorites()
  const { client } = useAuth()
  const liked = isFavorite(product.id)
  const image = getProductImage(product, compact ? IMAGE_WIDTH.thumb : IMAGE_WIDTH.card)
  const simulationImage = getSimulationImage(product) || image
  const outOfStock = product.statut === 'RUPTURE_STOCK'

  const handleProductClick = () => {
    void api
      .trackProductClick(product.id, getTrackingSessionId(), 'CLICK', client?.id)
      .catch(() => {})
  }

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    try {
      await toggleFavorite(product.id)
      toast.success(liked ? 'Retiré des favoris' : 'Ajouté aux favoris')
    } catch {
      toast.error('Impossible de mettre à jour les favoris')
    }
  }

  return (
    <article
      className="group animate-card-rise"
      style={{ animationDelay: `${index * 70}ms` }}
    >
      <Link
        to="/products/$id"
        params={{ id: String(product.id) }}
        className="block"
        preload="intent"
        onMouseEnter={() => prefetchProductDetail(queryClient, product.id)}
        onFocus={() => prefetchProductDetail(queryClient, product.id)}
        onTouchStart={() => prefetchProductDetail(queryClient, product.id)}
        onClick={handleProductClick}
      >
        <div
          className={`relative overflow-hidden bg-muted shadow-[0_18px_40px_-25px_rgba(80,30,10,0.45)] ${
            compact ? 'rounded-2xl' : 'rounded-3xl'
          }`}
        >
          <div className="aspect-[4/5] w-full">
            <img
              src={image}
              alt={productVisibleTitle(product.ref, categoryName)}
              loading={imagePriority ? 'eager' : 'lazy'}
              fetchPriority={imagePriority ? 'high' : 'auto'}
              decoding="async"
              onError={fallbackFromBrokenImage}
              className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]"
            />
          </div>

          {/* Badge rupture ou badge AR */}
          {outOfStock ? (
            <span
              className={`absolute left-3 top-3 z-10 rounded-full bg-brand-red font-bold uppercase tracking-wider text-sand ${
                compact ? 'px-2 py-0.5 text-[10px]' : 'left-4 top-4 px-3 py-1 text-xs'
              }`}
            >
              Rupture
            </span>
          ) : (
            <span
              className={`absolute left-2.5 top-2.5 z-10 flex items-center gap-1 rounded-full border border-gold/40 bg-foliage/80 font-semibold text-sand shadow-sm backdrop-blur-md sm:left-3 sm:top-3 ${
                compact ? 'px-2 py-0.5 text-[9px]' : 'px-2.5 py-0.5 text-[11px]'
              }`}
            >
              <Sparkles className="h-3 w-3 text-gold" />
              <span>Test mural AR</span>
            </span>
          )}

          {/* Bouton favoris */}
          <button
            type="button"
            onClick={handleLike}
            aria-label={liked ? 'Retirer des favoris' : 'Ajouter aux favoris'}
            className={`absolute z-10 flex items-center justify-center rounded-full backdrop-blur transition-all duration-300 ${
              compact ? 'right-2.5 top-2.5 h-8 w-8' : 'right-4 top-4 h-10 w-10'
            } ${
              liked
                ? 'scale-110 bg-brand-red text-sand'
                : 'bg-background/80 text-foreground hover:bg-background'
            }`}
          >
            <svg
              width={compact ? 15 : 18}
              height={compact ? 15 : 18}
              viewBox="0 0 24 24"
              fill={liked ? 'currentColor' : 'none'}
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </button>

          {/* Bandeau d'action proéminent : Test sur votre mur réel */}
          {onAr && simulationImage && (
            <div className="absolute inset-x-2 bottom-2 z-10 sm:inset-x-3 sm:bottom-3">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  onAr(simulationImage)
                }}
                className={`w-full flex items-center justify-center gap-1.5 rounded-xl border border-gold/50 bg-foliage/95 font-bold text-sand shadow-[0_8px_20px_-4px_rgba(0,0,0,0.5)] backdrop-blur-md transition-all duration-300 hover:scale-[1.02] hover:bg-foliage hover:border-gold active:scale-95 group ${
                  compact ? 'py-1.5 px-2 text-[11px]' : 'py-2 px-3 text-xs'
                }`}
                aria-label="Tester ce tableau sur votre mur réel"
                title="Tester ce tableau en direct sur votre mur avec votre caméra"
              >
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-gold" />
                </span>
                <Camera className="h-3.5 w-3.5 text-gold transition-transform group-hover:rotate-12" />
                <span className="truncate tracking-wide">
                  {compact ? 'Tester sur mon mur' : 'Tester sur votre mur réel (AR)'}
                </span>
              </button>
            </div>
          )}
        </div>

        <div
          className={`flex items-start justify-between gap-2 px-0.5 ${
            compact ? 'mt-2.5' : 'mt-4 gap-3 px-1'
          }`}
        >
          <div className="min-w-0">
            <h3
              className={`font-display font-semibold text-foreground transition-colors group-hover:text-brand-red ${
                compact ? 'truncate text-sm' : 'text-lg'
              }`}
            >
              {product.ref}
            </h3>
            {categoryName && (
              <p
                className={`mt-0.5 uppercase tracking-wider text-muted-foreground ${
                  compact ? 'text-[10px]' : 'text-xs'
                }`}
              >
                {categoryName}
              </p>
            )}
            {!compact && product.description?.trim() && (
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                {product.description.trim()}
              </p>
            )}
          </div>
          <p
            className={`shrink-0 whitespace-nowrap font-display font-semibold text-accent-green ${
              compact ? 'text-sm' : 'text-lg'
            }`}
          >
            {formatStartingPrice(product.prix)}
          </p>
        </div>
      </Link>
    </article>
  )
}
