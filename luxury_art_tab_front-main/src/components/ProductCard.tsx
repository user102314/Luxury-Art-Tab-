import { Link } from '@tanstack/react-router'
import type { Product } from '@/types/api'
import { getProductImage } from '@/lib/images'
import { formatPrice } from '@/lib/pricing'
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
}

export function ProductCard({ product, categoryName, index = 0, onAr, compact = false }: ProductCardProps) {
  const { isFavorite, toggleFavorite } = useFavorites()
  const { client } = useAuth()
  const liked = isFavorite(product.id)
  const image = getProductImage(product)
  const outOfStock = product.statut === 'RUPTURE_STOCK' || product.stock <= 0

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
              alt={product.nom}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]"
            />
          </div>

          {outOfStock && (
            <span
              className={`absolute left-3 top-3 rounded-full bg-brand-red font-bold uppercase tracking-wider text-white ${
                compact ? 'px-2 py-0.5 text-[10px]' : 'left-4 top-4 px-3 py-1 text-xs'
              }`}
            >
              Rupture
            </span>
          )}
          {!outOfStock && product.stock <= 5 && (
            <span
              className={`absolute rounded-full bg-accent-green font-bold uppercase tracking-wider text-white ${
                compact ? 'left-3 top-3 px-2 py-0.5 text-[10px]' : 'left-4 top-4 px-3 py-1 text-xs'
              }`}
            >
              Plus que {product.stock}
            </span>
          )}

          <button
            type="button"
            onClick={handleLike}
            aria-label={liked ? 'Retirer des favoris' : 'Ajouter aux favoris'}
            className={`absolute flex items-center justify-center rounded-full backdrop-blur transition-all duration-300 ${
              compact ? 'right-2.5 top-2.5 h-8 w-8' : 'right-4 top-4 h-10 w-10'
            } ${
              liked
                ? 'scale-110 bg-brand-red text-white'
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

          {onAr && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                onAr(image)
              }}
              className={`absolute flex items-center justify-center rounded-full bg-accent-green text-white transition hover:opacity-90 ${
                compact ? 'bottom-2.5 right-2.5 h-8 w-8' : 'bottom-4 right-4 h-10 w-10'
              }`}
              aria-label="Tester en AR"
              title="Voir en réalité augmentée"
            >
              <svg
                width={compact ? 15 : 18}
                height={compact ? 15 : 18}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </button>
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
              {product.nom}
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
          </div>
          <p
            className={`shrink-0 whitespace-nowrap font-display font-semibold text-accent-green ${
              compact ? 'text-sm' : 'text-lg'
            }`}
          >
            {formatPrice(Number(product.prix))}
          </p>
        </div>
      </Link>
    </article>
  )
}
