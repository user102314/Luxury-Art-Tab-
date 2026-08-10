import { Link, useNavigate, useRouterState } from '@tanstack/react-router'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { ChevronDown, Menu, X } from 'lucide-react'
import { useCart } from '@/context/CartContext'
import { useFavorites } from '@/context/FavoritesContext'
import {
  prefetchStorefrontRoute,
  useCategories,
  useProducts,
} from '@/hooks/useStorefrontQueries'
import { useAuth } from '@/context/AuthContext'
import { getProductImage } from '@/lib/images'
import { formatPrice } from '@/lib/pricing'
import { BrandLogo } from '@/components/BrandLogo'

const navLinkClass =
  'text-sm font-semibold text-sand transition-colors hover:text-gold'

const mobileLinkClass =
  'rounded-xl px-3 py-3 text-sm font-semibold text-sand transition hover:bg-sand/10 hover:text-gold'

export function SiteNav() {
  const { client } = useAuth()
  const [openPanel, setOpenPanel] = useState<'panier' | 'favoris' | null>(null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [galleryOpen, setGalleryOpen] = useState(false)
  const [mobileGalleryOpen, setMobileGalleryOpen] = useState(false)
  const galleryRef = useRef<HTMLDivElement>(null)
  const { items, count, total, removeItem, updateQuantity } = useCart()
  const { favoriteIds } = useFavorites()
  const navigate = useNavigate()
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const queryClient = useQueryClient()
  const { data: categories = [] } = useCategories()

  const prefetch = (path: string) => prefetchStorefrontRoute(queryClient, path)

  const { data: allProducts = [] } = useProducts({
    enabled: openPanel === 'favoris' && favoriteIds.length > 0,
  })

  const favoriteProducts = allProducts.filter((p) => favoriteIds.includes(p.id))

  /** 10 catégories + « Voir tout » = 11 choix dans le sous-menu Galerie */
  const galleryCategories = useMemo(() => categories.slice(0, 10), [categories])

  useEffect(() => {
    setMobileOpen(false)
    setGalleryOpen(false)
    setMobileGalleryOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!mobileOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileOpen(false)
    }
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [mobileOpen])

  useEffect(() => {
    if (!galleryOpen) return
    const onPointer = (e: MouseEvent) => {
      if (galleryRef.current && !galleryRef.current.contains(e.target as Node)) {
        setGalleryOpen(false)
      }
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setGalleryOpen(false)
    }
    window.addEventListener('mousedown', onPointer)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('mousedown', onPointer)
      window.removeEventListener('keydown', onKey)
    }
  }, [galleryOpen])

  const scrollToId = (id: string) => {
    setMobileOpen(false)
    setGalleryOpen(false)
    if (pathname === '/') {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
      return
    }
    void navigate({ to: '/' }).then(() => {
      window.setTimeout(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
      }, 100)
    })
  }

  const closeMobile = () => setMobileOpen(false)

  return (
    <>
      {/* z-50 + isolation : le menu mobile n’est plus bloqué derrière hero / overlays */}
      <header className="sticky top-0 z-50 isolate border-b border-sand/10 bg-foliage text-sand">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-3 px-4 py-2.5 sm:px-6 md:px-10 md:py-3">
          <div className="flex min-w-0 items-center gap-4 md:gap-8">
            <Link
              to="/"
              className="flex min-w-0 shrink-0 items-center"
              onClick={closeMobile}
              aria-label="Luxury Art_Tab — Accueil"
            >
              <BrandLogo size="sm" onDark showByline={false} />
            </Link>

            <nav className="hidden items-center gap-1 lg:flex" aria-label="Navigation principale">
              <div ref={galleryRef} className="relative">
                <button
                  type="button"
                  onClick={() => setGalleryOpen((o) => !o)}
                  onMouseEnter={() => {
                    prefetch('/products')
                    setGalleryOpen(true)
                  }}
                  className={`${navLinkClass} inline-flex items-center gap-1 rounded-full px-3 py-2 ${
                    galleryOpen ? 'bg-sand/10 text-gold' : ''
                  }`}
                  aria-expanded={galleryOpen}
                  aria-haspopup="true"
                >
                  Galerie
                  <ChevronDown
                    className={`h-3.5 w-3.5 transition ${galleryOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                {galleryOpen && (
                  <div
                    className="absolute left-0 top-full z-50 mt-2 w-[min(520px,calc(100vw-2rem))] rounded-2xl border border-gold/25 bg-sand p-4 text-foreground shadow-[0_28px_60px_-30px_rgba(74,93,79,0.85)]"
                    onMouseLeave={() => setGalleryOpen(false)}
                  >
                    <p className="mb-3 px-1 font-display text-[11px] font-semibold uppercase tracking-[0.2em] text-gold">
                      Nos univers · {galleryCategories.length + 1} choix
                    </p>
                    <div className="grid grid-cols-2 gap-1">
                      {galleryCategories.map((cat) => (
                        <Link
                          key={cat.id}
                          to="/products"
                          search={{ category: String(cat.id) }}
                          onClick={() => setGalleryOpen(false)}
                          className="rounded-xl px-3 py-2.5 text-sm font-semibold text-foreground transition hover:bg-beige/60 hover:text-gold"
                        >
                          {cat.nom}
                        </Link>
                      ))}
                      <Link
                        to="/products"
                        search={{ category: undefined }}
                        onClick={() => setGalleryOpen(false)}
                        className="col-span-2 mt-1 flex items-center justify-between rounded-xl border border-gold/30 bg-foliage px-3 py-2.5 text-sm font-semibold text-sand transition hover:bg-foliage/90"
                      >
                        Voir tout
                        <span className="rounded-full bg-gold/20 px-2 py-0.5 text-[11px] font-bold text-gold">
                          {galleryCategories.length + 1}
                        </span>
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => scrollToId('nouveautes')}
                className={`${navLinkClass} rounded-full px-3 py-2`}
              >
                About Me
              </button>
              <Link
                to="/actualites"
                onMouseEnter={() => prefetch('/actualites')}
                onFocus={() => prefetch('/actualites')}
                className={`${navLinkClass} rounded-full px-3 py-2`}
              >
                Actualités
              </Link>
              <Link
                to="/contact"
                onMouseEnter={() => prefetch('/contact')}
                onFocus={() => prefetch('/contact')}
                className={`${navLinkClass} rounded-full px-3 py-2`}
              >
                Contact
              </Link>
              <button
                type="button"
                onClick={() => scrollToId('avis-clients')}
                className={`${navLinkClass} rounded-full px-3 py-2`}
              >
                Avis des clients
              </button>
            </nav>
          </div>

          <nav className="flex items-center gap-1.5 sm:gap-2 md:gap-3" aria-label="Actions">
            {client && (
              <Link
                to="/compte"
                className="hidden text-sm font-semibold text-gold hover:underline md:inline"
              >
                {client.nom.split(' ')[0]}
              </Link>
            )}

            <button
              type="button"
              onClick={() => setOpenPanel('favoris')}
              className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-sand/25 bg-sand/10 text-sand transition hover:border-sage/80 hover:bg-sand/20"
              aria-label="Favoris"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
              {favoriteIds.length > 0 && (
                <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-gold px-1 text-[10px] font-bold text-sand">
                  {favoriteIds.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setOpenPanel('panier')}
              className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-sand/25 bg-sand/10 text-sand transition hover:border-gold/80 hover:bg-sand/20"
              aria-label="Panier"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <circle cx="8" cy="21" r="1" />
                <circle cx="19" cy="21" r="1" />
                <path d="M2.05 2h2l2.6 12.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L22 6H6" />
              </svg>
              {count > 0 && (
                <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-sage px-1 text-[10px] font-bold text-sand">
                  {count}
                </span>
              )}
            </button>

            {client ? (
              <Link
                to="/compte"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-gold/50 bg-gold/15 text-gold transition hover:bg-gold/25"
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
                className="inline-flex h-10 items-center justify-center gap-1.5 rounded-full border border-gold/50 bg-gold/15 px-3 text-gold transition hover:bg-gold/25"
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
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-sand/25 bg-sand/10 text-sand transition hover:bg-sand/20 lg:hidden"
              aria-label={mobileOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </nav>
        </div>
      </header>

      {/* Menu téléphone : panneau fixe plein écran (plus de menu coincé dans le sticky) */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[80] lg:hidden" role="dialog" aria-modal="true">
          <button
            type="button"
            className="absolute inset-0 bg-foliage/55 backdrop-blur-sm"
            aria-label="Fermer le menu"
            onClick={closeMobile}
          />
          <div className="absolute inset-x-0 top-0 max-h-[min(100dvh,100%)] overflow-y-auto border-b border-sand/15 bg-foliage px-4 pb-8 pt-[max(1rem,env(safe-area-inset-top))] shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <BrandLogo size="sm" onDark showByline={false} />
              <button
                type="button"
                onClick={closeMobile}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-sand/25 text-sand"
                aria-label="Fermer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="flex flex-col gap-1" aria-label="Menu mobile">
              <button
                type="button"
                onClick={() => setMobileGalleryOpen((o) => !o)}
                className={`${mobileLinkClass} flex w-full items-center justify-between`}
                aria-expanded={mobileGalleryOpen}
              >
                Galerie
                <ChevronDown
                  className={`h-4 w-4 transition ${mobileGalleryOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {mobileGalleryOpen && (
                <div className="mb-2 ml-2 grid gap-0.5 rounded-2xl border border-sand/15 bg-sand/5 p-2">
                  {galleryCategories.map((cat) => (
                    <Link
                      key={cat.id}
                      to="/products"
                      search={{ category: String(cat.id) }}
                      onClick={closeMobile}
                      className="rounded-lg px-3 py-2.5 text-sm font-medium text-beige hover:bg-sand/10 hover:text-gold"
                    >
                      {cat.nom}
                    </Link>
                  ))}
                  <Link
                    to="/products"
                    search={{ category: undefined }}
                    onClick={closeMobile}
                    className="mt-1 rounded-lg bg-gold/20 px-3 py-2.5 text-sm font-bold text-gold"
                  >
                    Voir tout ({galleryCategories.length + 1})
                  </Link>
                </div>
              )}

              <button
                type="button"
                onClick={() => scrollToId('nouveautes')}
                className={`${mobileLinkClass} w-full text-left`}
              >
                About Me
              </button>
              <Link to="/actualites" onClick={closeMobile} className={mobileLinkClass}>
                Actualités
              </Link>
              <Link to="/contact" onClick={closeMobile} className={mobileLinkClass}>
                Contact
              </Link>
              <button
                type="button"
                onClick={() => scrollToId('avis-clients')}
                className={`${mobileLinkClass} w-full text-left`}
              >
                Avis des clients
              </button>

              {client ? (
                <Link to="/compte" onClick={closeMobile} className={`${mobileLinkClass} text-gold`}>
                  Mon compte
                </Link>
              ) : (
                <Link to="/signin" onClick={closeMobile} className={`${mobileLinkClass} text-gold`}>
                  Se connecter
                </Link>
              )}
            </nav>
          </div>
        </div>
      )}

      {openPanel && (
        <div
          className="fixed inset-0 z-[90] bg-foliage/40 p-4 backdrop-blur-sm"
          onClick={() => setOpenPanel(null)}
        >
          <div
            className="mx-auto mt-16 max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-sand p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-2xl font-bold text-foreground">
                {openPanel === 'panier' ? 'Votre panier' : 'Vos favoris'}
              </h3>
              <button
                type="button"
                onClick={() => setOpenPanel(null)}
                className="rounded-full p-2 text-foreground/70 hover:bg-foliage/5"
                aria-label="Fermer"
              >
                ✕
              </button>
            </div>

            {openPanel === 'panier' ? (
              items.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border bg-secondary/30 p-8 text-center">
                  <p className="text-sm font-semibold">Votre panier est vide.</p>
                  <Link
                    to="/products"
                    search={{ category: undefined }}
                    className="mt-4 inline-block font-semibold text-brand-red hover:underline"
                  >
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
                        <img src={getProductImage({ imageUrl: item.imageUrl })} alt="" className="h-14 w-14 rounded-lg object-cover" loading="lazy" decoding="async" />
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
                    className="mt-4 w-full rounded-full bg-brand-red py-3 text-sm font-bold text-sand hover:opacity-90"
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
