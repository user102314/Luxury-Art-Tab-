import { Link } from '@tanstack/react-router'
import type { Product } from '@/types/api'
import { getProductImage } from '@/lib/images'
import { formatPrice } from '@/lib/pricing'
import { useFavorites } from '@/context/FavoritesContext'
import { toast } from 'sonner'

interface ProductCardProps {
  product: Product
  categoryName?: string
  index?: number
  onAr?: (imageUrl: string) => void
}

export function ProductCard({ product, categoryName, index = 0, onAr }: ProductCardProps) {
  const { isFavorite, toggleFavorite } = useFavorites()
  const liked = isFavorite(product.id)
  const image = getProductImage(product)
  const outOfStock = product.statut === 'RUPTURE_STOCK' || product.stock <= 0

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
      style={{ animationDelay: `${index * 90}ms` }}
    >
      <Link to="/products/$id" params={{ id: String(product.id) }} className="block">
        <div className="relative overflow-hidden rounded-3xl bg-muted shadow-[0_18px_40px_-25px_rgba(80,30,10,0.45)]">
          <div className="aspect-[4/5] w-full">
            <img
              src={image}
              alt={product.nom}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]"
            />
          </div>

          {outOfStock && (
            <span className="absolute left-4 top-4 rounded-full bg-brand-red px-3 py-1 text-xs font-bold uppercase tracking-wider text-white">
              Rupture
            </span>
          )}
          {!outOfStock && product.stock <= 5 && (
            <span className="absolute left-4 top-4 rounded-full bg-accent-green px-3 py-1 text-xs font-bold uppercase tracking-wider text-white">
              Plus que {product.stock}
            </span>
          )}

          <button
            type="button"
            onClick={handleLike}
            aria-label={liked ? 'Retirer des favoris' : 'Ajouter aux favoris'}
            className={`absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full backdrop-blur transition-all duration-300 ${
              liked
                ? 'scale-110 bg-brand-red text-white'
                : 'bg-background/80 text-foreground hover:bg-background'
            }`}
          >
            <svg
              width="18"
              height="18"
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
              className="absolute bottom-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-accent-green text-white transition hover:opacity-90"
              aria-label="Tester en AR"
              title="Voir en réalité augmentée"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </button>
          )}
        </div>

        <div className="mt-4 flex items-start justify-between gap-3 px-1">
          <div>
            <h3 className="font-display text-lg font-semibold text-foreground group-hover:text-brand-red transition-colors">
              {product.nom}
            </h3>
            {categoryName && (
              <p className="mt-0.5 text-xs uppercase tracking-wider text-muted-foreground">
                {categoryName}
              </p>
            )}
          </div>
          <p className="font-display text-lg font-semibold text-accent-green whitespace-nowrap">
            {formatPrice(Number(product.prix))}
          </p>
        </div>
      </Link>
    </article>
  )
}
