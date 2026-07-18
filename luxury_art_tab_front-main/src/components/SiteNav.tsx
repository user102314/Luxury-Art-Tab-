import { Link, useNavigate, useRouterState } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Menu, X } from 'lucide-react'
import { useCart } from '@/context/CartContext'
import { useFavorites } from '@/context/FavoritesContext'
import { prefetchStorefrontRoute, useProducts } from '@/hooks/useStorefrontQueries'
import { useAuth } from '@/context/AuthContext'
import { getProductImage } from '@/lib/images'
import { formatPrice } from '@/lib/pricing'

const navLinkClass =
  'text-sm font-semibold text-[#f7efe2] transition-colors hover:text-[#f4a15d]'

export function SiteNav() {
  const { client } = useAuth()
  const [openPanel, setOpenPanel] = useState<'panier' | 'favoris' | null>(null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const { items, count, total, removeItem, updateQuantity } = useCart()
  const { favoriteIds } = useFavorites()
  const navigate = useNavigate()
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const queryClient = useQueryClient()

  const prefetch = (path: string) => prefetchStorefrontRoute(queryClient, path)

  const { data: allProducts = [] } = useProducts(
    openPanel === 'favoris' && favoriteIds.length > 0,
  )

  const favoriteProducts = allProducts.filter((p) => favoriteIds.includes(p.id))

  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!mobileOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileOpen(false)
    }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [mobileOpen])

  const goAboutMe = () => {
    setMobileOpen(false)
    if (pathname === '/') {
      document.getElementById('nouveautes')?.scrollIntoView({ behavior: 'smooth' })
      return
    }
    void navigate({ to: '/' }).then(() => {
      window.setTimeout(() => {
        document.getElementById('nouveautes')?.scrollIntoView({ behavior: 'smooth' })
      }, 80)
    })
  }

  const closeMobile = () => setMobileOpen(false)

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#3b2418] text-[#f7efe2]">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-3 px-4 py-3.5 sm:px-6 md:px-10 md:py-4">
          <div className="flex min-w-0 items-center gap-4 md:gap-8">
            <Link
              to="/"
              className="flex min-w-0 shrink-0 items-center gap-2 text-[#f4a15d]"
              onClick={closeMobile}
            >
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M3 9h18" />
                <path d="M9 21V9" />
              </svg>
              <span className="truncate font-display text-lg font-bold tracking-tight sm:text-xl">
                Luxury Art Tab
              </span>
            </Link>

            <nav className="hidden items-center gap-6 md:flex" aria-label="Navigation principale">
              <Link
                to="/products"
                onMouseEnter={() => prefetch('/products')}
                onFocus={() => prefetch('/products')}
                className={navLinkClass}
              >
                Galerie
              </Link>
              <button type="button" onClick={goAboutMe} className={navLinkClass}>
                About Me
              </button>
              <Link
                to="/actualites"
                onMouseEnter={() => prefetch('/actualites')}
                onFocus={() => prefetch('/actualites')}
                className={navLinkClass}
              >
                Actualités
              </Link>
              <Link
                to="/contact"
                onMouseEnter={() => prefetch('/contact')}
                onFocus={() => prefetch('/contact')}
                className={navLinkClass}
              >
                Contact
              </Link>
            </nav>
          </div>

          <nav className="flex items-center gap-1.5 sm:gap-2 md:gap-3" aria-label="Actions">
            {client && (
              <Link to="/compte" className="hidden text-sm font-semibold text-[#f4a15d] hover:underline md:inline">
                {client.nom.split(' ')[0]}
              </Link>
            )}

            <button
              type="button"
              onClick={() => setOpenPanel('favoris')}
              className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/25 bg-white/10 text-[#f7efe2] transition hover:border-accent-green/80 hover:bg-white/20"
              aria-label="Favoris"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
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
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
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

            {client ? (
              <Link
                to="/compte"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#f4a15d]/50 bg-[#f4a15d]/15 text-[#f4a15d] transition hover:bg-[#f4a15d]/25"
                aria-label="Mon compte"
                title="Mon compte"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </Link>
            ) : (
              <Link
                to="/signin"
                className="inline-flex h-10 items-center justify-center gap-1.5 rounded-full border border-[#f4a15d]/50 bg-[#f4a15d]/15 px-3 text-[#f4a15d] transition hover:bg-[#f4a15d]/25"
                aria-label="Se connecter"
                title="Se connecter"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                <span className="hidden text-xs font-bold sm:inline">Connexion</span>
              </Link>
            )}

            <button
              type="button"
              onClick={() => setMobileOpen((o) => !o)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/25 bg-white/10 text-[#f7efe2] transition hover:bg-white/20 md:hidden"
              aria-label={mobileOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </nav>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="border-t border-white/10 bg-[#3b2418] px-4 pb-5 pt-3 md:hidden">
            <nav className="flex flex-col gap-1" aria-label="Menu mobile">
              <Link
                to="/products"
                onClick={closeMobile}
                className="rounded-lg px-3 py-2.5 text-sm font-semibold text-[#f7efe2] hover:bg-white/10 hover:text-[#f4a15d]"
              >
                Galerie
              </Link>
              <button
                type="button"
                onClick={goAboutMe}
                className="rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-[#f7efe2] hover:bg-white/10 hover:text-[#f4a15d]"
              >
                About Me
              </button>
              <Link
                to="/actualites"
                onClick={closeMobile}
                className="rounded-lg px-3 py-2.5 text-sm font-semibold text-[#f7efe2] hover:bg-white/10 hover:text-[#f4a15d]"
              >
                Actualités
              </Link>
              <Link
                to="/contact"
                onClick={closeMobile}
                className="rounded-lg px-3 py-2.5 text-sm font-semibold text-[#f7efe2] hover:bg-white/10 hover:text-[#f4a15d]"
              >
                Contact
              </Link>
              {client ? (
                <Link
                  to="/compte"
                  onClick={closeMobile}
                  className="rounded-lg px-3 py-2.5 text-sm font-semibold text-[#f4a15d] hover:bg-white/10"
                >
                  Mon compte
                </Link>
              ) : (
                <Link
                  to="/signin"
                  onClick={closeMobile}
                  className="rounded-lg px-3 py-2.5 text-sm font-semibold text-[#f4a15d] hover:bg-white/10"
                >
                  Se connecter
                </Link>
              )}
            </nav>
          </div>
        )}
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
                  <Link to="/products" className="mt-4 inline-block font-semibold text-brand-red hover:underline">
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
