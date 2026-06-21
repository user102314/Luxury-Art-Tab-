import { Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useCart } from '@/context/CartContext'
import { useFavorites } from '@/context/FavoritesContext'
import { prefetchStorefrontRoute, useProducts } from '@/hooks/useStorefrontQueries'
import { useAuth } from '@/context/AuthContext'
import { getProductImage } from '@/lib/images'
import { formatPrice } from '@/lib/pricing'

export function SiteNav() {
  const { client } = useAuth()
  const [openPanel, setOpenPanel] = useState<'panier' | 'favoris' | null>(null)
  const { items, count, total, removeItem, updateQuantity } = useCart()
  const { favoriteIds } = useFavorites()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const prefetch = (path: string) => prefetchStorefrontRoute(queryClient, path)

  const { data: allProducts = [] } = useProducts(
    openPanel === 'favoris' && favoriteIds.length > 0,
  )

  const favoriteProducts = allProducts.filter((p) => favoriteIds.includes(p.id))

  return (
    <>
      <header className="relative z-30 flex items-center justify-between border-b border-white/10 bg-[#3b2418] px-6 py-5 text-[#f7efe2] md:px-10">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2 text-[#f4a15d]">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M3 9h18" />
              <path d="M9 21V9" />
            </svg>
            <span className="text-xl font-bold tracking-tight font-display">Luxury Art Tab</span>
          </Link>
          <nav className="hidden md:flex gap-6">
            <Link
              to="/products"
              onMouseEnter={() => prefetch('/products')}
              onFocus={() => prefetch('/products')}
              className="text-sm font-semibold text-[#f7efe2] transition-colors hover:text-[#f4a15d]"
            >
              Galerie
            </Link>
            <a href="/#nouveautes" className="text-sm font-semibold text-[#f7efe2] transition-colors hover:text-[#f4a15d]">
              About Me
            </a>
            <Link
              to="/actualites"
              onMouseEnter={() => prefetch('/actualites')}
              onFocus={() => prefetch('/actualites')}
              className="text-sm font-semibold text-[#f7efe2] transition-colors hover:text-accent-green"
            >
              Actualités
            </Link>
          </nav>
        </div>

        <nav className="flex items-center gap-2 md:gap-4">
          <Link to="/products" className="hidden text-sm font-semibold text-accent-green md:inline hover:underline">
            Tous les produits
          </Link>
          <Link to="/contact" className="hidden text-sm font-semibold text-[#f7efe2] transition-colors hover:text-[#f4a15d] md:inline">
            Contact
          </Link>
          {client ? (
            <Link to="/compte" className="hidden text-sm font-semibold text-[#f4a15d] md:inline hover:underline">
              {client.nom.split(' ')[0]}
            </Link>
          ) : (
            <Link to="/signup" className="hidden rounded-full border border-[#f4a15d]/50 px-3 py-1.5 text-xs font-bold text-[#f4a15d] md:inline hover:bg-[#f4a15d]/10">
              Fidélité
            </Link>
          )}

          <button
            type="button"
            onClick={() => setOpenPanel('favoris')}
            className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/25 bg-white/10 text-[#f7efe2] transition hover:border-accent-green/80 hover:bg-white/20"
            aria-label="Favoris"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
            {favoriteIds.length > 0 && (
              <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-red px-1 text-[10px] font-bold text-white">
                {favoriteIds.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setOpenPanel('panier')}
            className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/25 bg-white/10 text-[#f7efe2] transition hover:border-[#f4a15d]/80 hover:bg-white/20"
            aria-label="Panier"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="8" cy="21" r="1" />
              <circle cx="19" cy="21" r="1" />
              <path d="M2.05 2h2l2.6 12.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L22 6H6" />
            </svg>
            {count > 0 && (
              <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-accent-green px-1 text-[10px] font-bold text-white">
                {count}
              </span>
            )}
          </button>
        </nav>
      </header>

      {openPanel && (
        <div
          className="fixed inset-0 z-[90] bg-black/40 p-4 backdrop-blur-sm"
          onClick={() => setOpenPanel(null)}
        >
          <div
            className="mx-auto mt-16 max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-2xl font-bold text-foreground">
                {openPanel === 'panier' ? 'Votre panier' : 'Vos favoris'}
              </h3>
              <button
                type="button"
                onClick={() => setOpenPanel(null)}
                className="rounded-full p-2 text-foreground/70 hover:bg-black/5"
                aria-label="Fermer"
              >
                ✕
              </button>
            </div>

            {openPanel === 'panier' ? (
              items.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border bg-secondary/30 p-8 text-center">
                  <p className="text-sm font-semibold">Votre panier est vide.</p>
                  <Link to="/products" className="mt-4 inline-block text-brand-red font-semibold hover:underline">
                    Parcourir la galerie
                  </Link>
                </div>
              ) : (
                <>
                  <ul className="space-y-4">
                    {items.map((item) => (
                      <li
                        key={`${item.productId}-${item.taille}`}
                        className="flex gap-3 border-b border-border/40 pb-4"
                      >
                        <img src={item.imageUrl} alt="" className="h-14 w-14 rounded-lg object-cover" />
                        <div className="flex-1">
                          <p className="text-sm font-semibold">{item.nom}</p>
                          <p className="text-xs text-muted-foreground">{item.taille}</p>
                          <div className="mt-1 flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                updateQuantity(item.productId, item.taille, item.quantite - 1)
                              }
                              className="h-6 w-6 rounded border text-xs"
                            >
                              −
                            </button>
                            <span className="text-sm">{item.quantite}</span>
                            <button
                              type="button"
                              onClick={() =>
                                updateQuantity(item.productId, item.taille, item.quantite + 1)
                              }
                              className="h-6 w-6 rounded border text-xs"
                            >
                              +
                            </button>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-brand-red">
                            {formatPrice(item.prixUnitaire * item.quantite)}
                          </p>
                          <button
                            type="button"
                            onClick={() => removeItem(item.productId, item.taille)}
                            className="mt-1 text-xs text-muted-foreground hover:text-brand-red"
                          >
                            Retirer
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-4 flex items-center justify-between border-t pt-4">
                    <span className="font-semibold">Total</span>
                    <span className="font-display text-xl font-bold text-accent-green">
                      {formatPrice(total)}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setOpenPanel(null)
                      navigate({ to: '/checkout' })
                    }}
                    className="mt-4 w-full rounded-full bg-brand-red py-3 text-sm font-bold text-white hover:opacity-90"
                  >
                    Commander
                  </button>
                </>
              )
            ) : favoriteProducts.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-secondary/30 p-8 text-center">
                <p className="text-sm font-semibold">Aucun favori pour le moment.</p>
              </div>
            ) : (
              <ul className="space-y-3">
                {favoriteProducts.map((p) => (
                  <li key={p.id}>
                    <Link
                      to="/products/$id"
                      params={{ id: String(p.id) }}
                      onClick={() => setOpenPanel(null)}
                      className="flex gap-3 rounded-xl p-2 hover:bg-secondary/50"
                    >
                      <img
                        src={getProductImage(p)}
                        alt={p.nom}
                        className="h-14 w-14 rounded-lg object-cover"
                      />
                      <div>
                        <p className="text-sm font-semibold">{p.nom}</p>
                        <p className="text-sm text-accent-green">{formatPrice(Number(p.prix))}</p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </>
  )
}
