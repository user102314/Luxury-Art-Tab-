import { createFileRoute, Link } from '@tanstack/react-router'
import { useMemo, useState } from 'react'
import { useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { CheckCircle2, ChevronDown, Truck } from 'lucide-react'
import { toast } from 'sonner'
import { SiteNav } from '@/components/SiteNav'
import { SiteFooter } from '@/components/SiteFooter'
import { ArViewer } from '@/components/ArViewer'
import { ProductImageGallery } from '@/components/ProductImageGallery'
import { api } from '@/lib/api'
import { queryKeys } from '@/lib/queryKeys'
import { REFETCH_INTERVAL } from '@/lib/queryClient'
import { useProduct, useProducts } from '@/hooks/useStorefrontQueries'
import { useProductTracking } from '@/hooks/useProductTracking'
import { getProductImage, getProductImages } from '@/lib/images'
import {
  dimensionOptions,
  frameOptions,
  formatPrice,
  getPrice,
} from '@/lib/pricing'
import { useCart } from '@/context/CartContext'
import { useFavorites } from '@/context/FavoritesContext'
import { useVisitor } from '@/context/VisitorContext'
import { ProductCard } from '@/components/ProductCard'

export const Route = createFileRoute('/products/$id')({
  component: ProductDetailPage,
})

function ProductDetailPage() {
  const { id } = Route.useParams()
  const productId = Number(id)
  const queryClient = useQueryClient()
  const { addItem } = useCart()
  const { isFavorite, toggleFavorite } = useFavorites()
  const { ensureVisitor, loading: visitorLoading, visitor } = useVisitor()

  const [size, setSize] = useState(dimensionOptions[2].value)
  const [frame, setFrame] = useState(frameOptions[0])
  const [qty, setQty] = useState(1)
  const [arImage, setArImage] = useState<string | null>(null)
  const [commentText, setCommentText] = useState('')
  const [reviewNote, setReviewNote] = useState(5)
  const [reviewText, setReviewText] = useState('')
  const [detailsOpen, setDetailsOpen] = useState(true)

  const { data: product, isLoading } = useProduct(productId)
  const { data: allProducts = [] } = useProducts()
  const { trackClick } = useProductTracking(
    !Number.isNaN(productId) && productId > 0 ? productId : null,
  )

  const { data: categories = [] } = useQuery({
    queryKey: queryKeys.categories,
    queryFn: api.getCategories,
    staleTime: 5 * 60_000,
    placeholderData: keepPreviousData,
  })

  const { data: comments = [] } = useQuery({
    queryKey: queryKeys.productComments(productId),
    queryFn: () => api.getProductComments(productId),
    enabled: !Number.isNaN(productId),
    refetchInterval: REFETCH_INTERVAL,
    placeholderData: keepPreviousData,
  })

  const { data: reviews = [] } = useQuery({
    queryKey: queryKeys.productReviews(productId),
    queryFn: () => api.getApprovedReviews(productId),
    enabled: !Number.isNaN(productId),
    refetchInterval: REFETCH_INTERVAL,
    placeholderData: keepPreviousData,
  })

  const { data: likeSummary } = useQuery({
    queryKey: queryKeys.productLikes(productId, visitor?.id ?? null),
    queryFn: () => api.getLikeSummary(productId, visitor?.id),
    enabled: !Number.isNaN(productId) && !visitorLoading,
    refetchInterval: REFETCH_INTERVAL,
  })

  const galleryImages = useMemo(
    () => (product ? getProductImages(product) : []),
    [product],
  )

  const similarProducts = useMemo(() => {
    if (!product) return []
    return allProducts
      .filter(
        (p) =>
          p.id !== product.id &&
          p.categoryId === product.categoryId &&
          p.statut !== 'ARCHIVE',
      )
      .slice(0, 8)
  }, [allProducts, product])

  if (isLoading && !product) {
    return (
      <main className="min-h-screen bg-background">
        <SiteNav />
        <div className="mx-auto max-w-7xl px-6 py-16">
          <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="flex gap-4">
              <div className="hidden h-[420px] w-[72px] animate-pulse rounded-lg bg-muted md:block" />
              <div className="aspect-[4/5] flex-1 animate-pulse rounded-2xl bg-muted" />
            </div>
            <div className="space-y-4">
              <div className="h-8 w-1/3 animate-pulse rounded bg-muted" />
              <div className="h-10 w-2/3 animate-pulse rounded bg-muted" />
              <div className="h-12 w-full animate-pulse rounded bg-muted" />
            </div>
          </div>
        </div>
      </main>
    )
  }

  if (!product) {
    return (
      <main className="min-h-screen bg-background">
        <SiteNav />
        <div className="mx-auto max-w-7xl px-6 py-32 text-center">
          <p className="text-muted-foreground">Produit introuvable</p>
          <Link to="/products" className="mt-4 inline-block text-brand-red hover:underline">
            Retour à la galerie
          </Link>
        </div>
      </main>
    )
  }

  const categoryName = categories.find((c) => c.id === product.categoryId)?.nom
  const image = getProductImage(product)
  const unitPrice = getPrice(Number(product.prix), size)
  const liked = isFavorite(product.id)
  const avgRating =
    reviews.length > 0
      ? (reviews.reduce((s, r) => s + r.note, 0) / reviews.length).toFixed(1)
      : null
  const likeCount = likeSummary?.count ?? 0
  const inStock = product.stock > 0

  const deliveryHint = (() => {
    const start = new Date()
    start.setDate(start.getDate() + 3)
    const end = new Date()
    end.setDate(end.getDate() + 7)
    const fmt = (d: Date) =>
      d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
    return `${fmt(start)} – ${fmt(end)}`
  })()

  const handleAddToCart = () => {
    trackClick('ADD_TO_CART')
    addItem({
      productId: product.id,
      nom: product.nom,
      imageUrl: image,
      prixUnitaire: unitPrice,
      quantite: qty,
      taille: size,
      encadrement: frame,
    })
    toast.success('Ajouté au panier', {
      description: `${product.nom} · ${size}`,
    })
  }

  const handleComment = async () => {
    if (!commentText.trim()) {
      toast.error('Écrivez un commentaire')
      return
    }
    try {
      const user = await ensureVisitor()
      await api.createComment({
        userId: user.id,
        productId: product.id,
        contenu: commentText.trim(),
      })
      setCommentText('')
      queryClient.invalidateQueries({ queryKey: queryKeys.productComments(productId) })
      toast.success('Commentaire publié')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur lors de la publication')
    }
  }

  const handleReview = async () => {
    try {
      const user = await ensureVisitor()
      await api.createReview({
        userId: user.id,
        productId: product.id,
        note: reviewNote,
        commentaire: reviewText.trim() || undefined,
      })
      setReviewText('')
      toast.success('Avis envoyé — visible après validation par notre équipe')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur lors de l'envoi de l'avis")
    }
  }

  const handleLike = async () => {
    try {
      await toggleFavorite(product.id)
      queryClient.invalidateQueries({
        queryKey: queryKeys.productLikes(productId, visitor?.id ?? null),
      })
    } catch {
      toast.error("Impossible de mettre à jour le j'aime")
    }
  }

  return (
    <main className="min-h-screen bg-background font-[Inter,sans-serif]">
      <SiteNav />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 md:px-10 md:py-10">
        <nav className="mb-6 text-sm text-muted-foreground">
          <Link to="/" className="hover:text-brand-red">
            Accueil
          </Link>
          <span className="mx-2">/</span>
          <Link to="/products" className="hover:text-brand-red">
            Produits
          </Link>
          <span className="mx-2">/</span>
          <span className="font-medium text-foreground">{product.nom}</span>
        </nav>

        <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(300px,420px)] lg:gap-12">
          <ProductImageGallery
            images={galleryImages}
            alt={product.nom}
            liked={liked}
            onLike={handleLike}
            onAr={setArImage}
          />

          <aside className="lg:sticky lg:top-24">
            {(likeCount > 0 || comments.length > 0) && (
              <p className="text-sm font-medium text-brand-red">
                {likeCount > 0
                  ? `${likeCount} personne${likeCount > 1 ? 's' : ''} aiment ce tableau`
                  : `${comments.length} commentaire${comments.length > 1 ? 's' : ''} récents`}
              </p>
            )}

            <p className="mt-3 font-display text-4xl font-bold tracking-tight text-foreground md:text-[2.75rem]">
              {formatPrice(unitPrice)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Prix selon la taille sélectionnée · TVA incluse si applicable
            </p>

            <h1 className="mt-5 font-display text-2xl font-bold leading-snug text-foreground md:text-3xl">
              {product.nom}
            </h1>

            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
              {categoryName && (
                <span className="rounded-full bg-accent-green/15 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider text-accent-green">
                  {categoryName}
                </span>
              )}
              {avgRating && (
                <span className="inline-flex items-center gap-1 font-semibold">
                  <span className="text-brand-red">{'★'.repeat(Math.round(Number(avgRating)))}</span>
                  <span>{avgRating}</span>
                  <span className="font-normal text-muted-foreground">({reviews.length} avis)</span>
                </span>
              )}
              <span className={`font-semibold ${inStock ? 'text-accent-green' : 'text-brand-red'}`}>
                {inStock ? `${product.stock} en stock` : 'Rupture de stock'}
              </span>
            </div>

            <div className="mt-5 flex items-start gap-2 rounded-xl border border-accent-blue/20 bg-accent-blue/5 px-3 py-3 text-sm text-foreground">
              <Truck className="mt-0.5 h-4 w-4 shrink-0 text-accent-green" />
              <div>
                <p className="font-semibold">Livraison estimée</p>
                <p className="text-muted-foreground">
                  Commandez aujourd&apos;hui — réception entre le {deliveryHint}
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold" htmlFor="size-select">
                  Taille
                </label>
                <select
                  id="size-select"
                  value={size}
                  onChange={(e) => setSize(e.target.value)}
                  className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm font-medium outline-none transition focus:border-brand-red focus:ring-2 focus:ring-brand-red/20"
                >
                  {dimensionOptions.map((dim) => (
                    <option key={dim.value} value={dim.value}>
                      {dim.label} — {formatPrice(getPrice(Number(product.prix), dim.value))}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold" htmlFor="frame-select">
                  Style / encadrement
                </label>
                <select
                  id="frame-select"
                  value={frame}
                  onChange={(e) => setFrame(e.target.value as typeof frame)}
                  className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm font-medium outline-none transition focus:border-brand-red focus:ring-2 focus:ring-brand-red/20"
                >
                  {frameOptions.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold">Quantité</label>
                <div className="inline-flex h-11 items-center rounded-xl border border-border bg-white">
                  <button
                    type="button"
                    onClick={() => setQty(Math.max(1, qty - 1))}
                    className="h-11 w-10 text-lg hover:bg-muted"
                  >
                    −
                  </button>
                  <span className="w-10 text-center font-semibold">{qty}</span>
                  <button
                    type="button"
                    onClick={() => setQty((q) => Math.min(Math.max(product.stock, 1), q + 1))}
                    className="h-11 w-10 text-lg hover:bg-muted"
                    disabled={!inStock}
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleAddToCart}
              disabled={!inStock}
              className="mt-6 w-full rounded-full bg-[#3b2418] px-8 py-3.5 text-base font-bold text-[#f7efe2] transition hover:bg-[#4a2f1f] disabled:opacity-50"
            >
              {inStock ? 'Ajouter au panier' : 'Indisponible'}
            </button>

            <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
              <CheckCircle2 className="h-3.5 w-3.5 text-accent-green" />
              Impression soignée · Formats personnalisés · Retours sous conditions
            </div>

            <div className="mt-8 border-t border-border/70">
              <button
                type="button"
                onClick={() => setDetailsOpen((o) => !o)}
                className="flex w-full items-center justify-between py-4 text-left text-sm font-semibold"
              >
                Détails de l&apos;article
                <ChevronDown
                  className={`h-4 w-4 transition ${detailsOpen ? 'rotate-180' : ''}`}
                />
              </button>
              {detailsOpen && (
                <div className="space-y-3 pb-5 text-sm leading-relaxed text-muted-foreground">
                  {product.description ? (
                    <p className="whitespace-pre-wrap text-foreground/80">{product.description}</p>
                  ) : (
                    <p>
                      Tableau décoratif Luxury Art_Tab — rendu élégant pour salon, cuisine ou
                      chambre. Choisissez la taille et l&apos;encadrement adaptés à votre intérieur.
                    </p>
                  )}
                  <ul className="list-inside list-disc space-y-1">
                    <li>Catégorie : {categoryName ?? '—'}</li>
                    <li>Taille sélectionnée : {size}</li>
                    <li>Encadrement : {frame}</li>
                    <li>Stock disponible : {product.stock}</li>
                  </ul>
                </div>
              )}
            </div>
          </aside>
        </div>

        <section className="mt-16 rounded-3xl border border-border/60 bg-white/60 p-6 md:p-8">
          <h2 className="font-display text-2xl font-bold">
            Commentaires <span className="text-accent-green">({comments.length})</span>
          </h2>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <input
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Partagez votre avis..."
              className="flex-1 rounded-xl border border-border px-4 py-3 text-sm focus:border-accent-green focus:outline-none"
            />
            <button
              type="button"
              onClick={handleComment}
              disabled={!commentText.trim()}
              className="rounded-xl bg-accent-green px-6 py-3 text-sm font-semibold text-white disabled:opacity-50"
            >
              Publier
            </button>
          </div>
          <div className="mt-8 space-y-4">
            {comments.map((c) => (
              <div key={c.id} className="rounded-2xl border border-border/40 bg-background/50 p-4">
                <p className="text-sm font-semibold text-brand-red">{c.userNom ?? 'Client'}</p>
                <p className="mt-2 text-sm text-foreground">{c.contenu}</p>
              </div>
            ))}
            {comments.length === 0 && (
              <p className="text-sm text-muted-foreground">Soyez le premier à commenter.</p>
            )}
          </div>
        </section>

        <section className="mt-10 rounded-3xl border border-border/60 bg-white/60 p-6 md:p-8">
          <h2 className="font-display text-2xl font-bold">
            Avis clients <span className="text-brand-red">({reviews.length})</span>
          </h2>

          <div className="mt-6 grid gap-4 rounded-2xl border border-dashed border-brand-red/30 bg-brand-red/5 p-6 md:grid-cols-[auto_1fr_auto] md:items-end">
            <div>
              <label className="text-xs font-semibold uppercase text-muted-foreground">Note</label>
              <select
                value={reviewNote}
                onChange={(e) => setReviewNote(Number(e.target.value))}
                className="mt-1 block rounded-lg border border-border px-3 py-2 text-sm"
              >
                {[5, 4, 3, 2, 1].map((n) => (
                  <option key={n} value={n}>
                    {n} étoile{n > 1 ? 's' : ''}
                  </option>
                ))}
              </select>
            </div>
            <input
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="Votre avis détaillé..."
              className="rounded-xl border border-border px-4 py-3 text-sm focus:border-brand-red focus:outline-none"
            />
            <button
              type="button"
              onClick={handleReview}
              className="rounded-xl bg-brand-red px-6 py-3 text-sm font-semibold text-white"
            >
              Envoyer un avis
            </button>
          </div>

          <div className="mt-8 space-y-4">
            {reviews.map((r) => (
              <div key={r.id} className="rounded-2xl border border-border/40 p-4">
                <div className="flex items-center gap-2">
                  <span className="text-brand-red">{'★'.repeat(r.note)}</span>
                  <span className="text-xs text-muted-foreground">
                    {r.createdAt ? new Date(r.createdAt).toLocaleDateString('fr-FR') : ''}
                  </span>
                </div>
                {r.commentaire && <p className="mt-2 text-sm">{r.commentaire}</p>}
              </div>
            ))}
          </div>
        </section>

        {similarProducts.length > 0 && (
          <section className="mt-16 border-t border-border/50 pt-12">
            <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="font-display text-2xl font-bold text-foreground md:text-3xl">
                  Articles similaires
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {categoryName
                    ? `Autres tableaux de la catégorie « ${categoryName} »`
                    : 'Dans la même catégorie'}
                </p>
              </div>
              <Link
                to="/products"
                search={{ category: String(product.categoryId) }}
                className="text-sm font-semibold text-brand-red hover:underline"
              >
                Voir plus →
              </Link>
            </div>

            <div className="-mx-1 flex gap-4 overflow-x-auto px-1 pb-3 snap-x snap-mandatory">
              {similarProducts.map((p, i) => (
                <div
                  key={p.id}
                  className="w-[200px] shrink-0 snap-start sm:w-[220px]"
                >
                  <ProductCard
                    product={p}
                    categoryName={categoryName}
                    index={i}
                    compact
                  />
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      <SiteFooter />
      <ArViewer isOpen={!!arImage} onClose={() => setArImage(null)} imageSrc={arImage} />
    </main>
  )
}
