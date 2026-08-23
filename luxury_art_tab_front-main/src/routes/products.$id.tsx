import { createFileRoute, Link } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'
import { useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import {
  CheckCircle2,
  ChevronDown,
  MessageSquare,
  Send,
  ShieldCheck,
  Star,
  Truck,
} from 'lucide-react'
import { toast } from 'sonner'
import { SiteNav } from '@/components/SiteNav'
import { SiteFooter } from '@/components/SiteFooter'
import { BackButton } from '@/components/BackButton'
import { LazyArViewer } from '@/components/LazyArViewer'
import { ProductImageGallery } from '@/components/ProductImageGallery'
import { api } from '@/lib/api'
import { queryKeys } from '@/lib/queryKeys'
import { REFETCH_INTERVAL } from '@/lib/queryClient'
import { useProduct, useProducts } from '@/hooks/useStorefrontQueries'
import { useProductTracking } from '@/hooks/useProductTracking'
import { getProductImage, getProductImages, getSimulationImage, resolveImageSrc, IMAGE_WIDTH } from '@/lib/images'
import {
  displayDimension,
  formatPrice,
  pricedDimensions,
  availableCadres,
  resolveCatalogPrice,
} from '@/lib/pricing'
import { useCart } from '@/context/CartContext'
import { useFavorites } from '@/context/FavoritesContext'
import { useVisitor } from '@/context/VisitorContext'
import { ProductCard } from '@/components/ProductCard'
import type { Category, Product } from '@/types/api'
import {
  buildSeoHead,
  productSeoDescription,
  productSeoTitle,
  productVisibleTitle,
  productSchema,
  breadcrumbSchema,
  preferredCategorySlug,
} from '@/lib/seo'

export const Route = createFileRoute('/products/$id')({
  loader: async ({ params }) => {
    try {
      const [product, categories] = await Promise.all([
        api.getProduct(Number(params.id)),
        api.getCategories().catch(() => []),
      ])
      return { product, categories }
    } catch {
      return { product: null, categories: [] }
    }
  },
  head: ({ loaderData }) => {
    const product = loaderData?.product
    const categories = loaderData?.categories ?? []
    if (!product) {
      return buildSeoHead({
        title: 'Produit introuvable | Luxury Art_Tab',
        description: 'Ce tableau n’est plus disponible.',
        path: '/products',
        robots: 'noindex, nofollow',
      })
    }

    const category = categories.find((c) => c.id === product.categoryId)
    const description = productSeoDescription({
      ref: product.ref,
      description: product.description,
      categoryName: category?.nom,
    })
    const image = getProductImages(product)[0]
    const crumbs = [
      { name: 'Accueil', path: '/' },
      { name: 'Produits', path: '/products' },
    ]
    if (category) {
      crumbs.push({
        name: category.nom,
        path: `/category/${preferredCategorySlug(category)}`,
      })
    }
    crumbs.push({ name: product.ref, path: `/products/${product.id}` })

    return buildSeoHead({
      title: productSeoTitle(product.ref, category?.nom),
      description,
      path: `/products/${product.id}`,
      image,
      type: 'product',
      jsonLd: [
        productSchema({
          id: product.id,
          ref: product.ref,
          name: productVisibleTitle(product.ref, category?.nom),
          description,
          image,
          prix: Number(product.prix ?? 0),
          available: product.statut === 'DISPONIBLE',
        }),
        breadcrumbSchema(crumbs),
      ],
    })
  },
  component: ProductDetailPage,
})

function ProductDetailPage() {
  const { id } = Route.useParams()
  const { product: seededProduct, categories: seededCategories } = Route.useLoaderData()
  const productId = Number(id)
  const queryClient = useQueryClient()
  const { addItem } = useCart()
  const { isFavorite, toggleFavorite } = useFavorites()
  const { ensureVisitor, loading: visitorLoading, visitor } = useVisitor()

  const [dimensionId, setDimensionId] = useState<number | null>(null)
  const [cadreId, setCadreId] = useState<number | null>(null)
  const [couleurId, setCouleurId] = useState<number | null>(null)
  const [qty, setQty] = useState(1)
  const [arImage, setArImage] = useState<string | null>(null)
  const [commentText, setCommentText] = useState('')
  const [reviewNote, setReviewNote] = useState(5)
  const [reviewText, setReviewText] = useState('')
  const [detailsOpen, setDetailsOpen] = useState(true)
  const [feedbackTab, setFeedbackTab] = useState<'avis' | 'commentaires'>('avis')

  const { data: product, isLoading } = useProduct(productId, {
    initialData: seededProduct,
  })
  const { data: catalog } = useQuery({
    queryKey: queryKeys.catalogPricing,
    queryFn: api.getCatalogPricing,
    staleTime: 60_000,
    placeholderData: keepPreviousData,
  })
  const cachedProducts = queryClient.getQueryData<Product[]>(queryKeys.products)
  const { data: allProducts = cachedProducts ?? [] } = useProducts({
    initialData: cachedProducts,
    enabled: !!product && cachedProducts === undefined,
  })
  const { trackClick } = useProductTracking(
    !Number.isNaN(productId) && productId > 0 ? productId : null,
  )

  const { data: categories = [] } = useQuery({
    queryKey: queryKeys.categories,
    queryFn: api.getCategories,
    staleTime: 5 * 60_000,
    initialData: seededCategories,
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
    queryKey: queryKeys.productLikes(productId, visitor?.id != null ? String(visitor.id) : null),
    queryFn: () => api.getLikeSummary(productId, visitor?.id),
    enabled: !Number.isNaN(productId) && !visitorLoading,
    refetchInterval: REFETCH_INTERVAL,
  })

  const selectedCouleurImage = useMemo(() => {
    if (!catalog || !cadreId || !couleurId) return null
    const cadre = catalog.cadres?.find((c) => c.id === cadreId)
    const color = cadre?.couleurs?.find((c) => c.id === couleurId)
    return color?.imageUrl ? resolveImageSrc(color.imageUrl, IMAGE_WIDTH.color) : null
  }, [catalog, cadreId, couleurId])

  const galleryImages = useMemo(() => {
    const productImgs = product ? getProductImages(product, IMAGE_WIDTH.gallery) : []
    if (!selectedCouleurImage) return productImgs
    return [selectedCouleurImage, ...productImgs.filter((src) => src !== selectedCouleurImage)]
  }, [product, selectedCouleurImage])

  const simulationImage = useMemo(
    () => (product ? getSimulationImage(product) : null),
    [product],
  )

  const reviewStats = useMemo(() => {
    const total = reviews.length
    const average = total ? reviews.reduce((sum, r) => sum + r.note, 0) / total : 0
    const distribution = [5, 4, 3, 2, 1].map((star) => {
      const count = reviews.filter((r) => r.note === star).length
      return { star, count, percent: total ? (count / total) * 100 : 0 }
    })
    return { total, average, distribution }
  }, [reviews])

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

  useEffect(() => {
    if (!product || !catalog) return
    const nextDims = pricedDimensions(product, catalog)
    if (!nextDims.length) return
    const nextDimId = nextDims.some((d) => d.id === dimensionId) ? dimensionId : nextDims[0].id
    if (nextDimId !== dimensionId) setDimensionId(nextDimId)
    const nextCadres = availableCadres(catalog, nextDimId)
    const nextCadreId = nextCadres.some((c) => c.id === cadreId) ? cadreId : nextCadres[0]?.id ?? null
    if (nextCadreId !== cadreId) setCadreId(nextCadreId)
    const nextCouleurs = nextCadres.find((c) => c.id === nextCadreId)?.couleurs ?? []
    const nextCouleurId = nextCouleurs.some((c) => c.id === couleurId)
      ? couleurId
      : nextCouleurs[0]?.id ?? null
    if (nextCouleurId !== couleurId) setCouleurId(nextCouleurId)
  }, [product, catalog, dimensionId, cadreId, couleurId])

  if (isLoading && !product) {
    return (
      <main className="flex min-h-screen flex-col bg-beige/25">
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
      <main className="flex min-h-screen flex-col bg-beige/25">
        <SiteNav />
        <div className="mx-auto max-w-7xl px-6 py-32 text-center">
          <p className="text-muted-foreground">Produit introuvable</p>
          <Link to="/products" search={{ category: undefined }} className="mt-4 inline-block text-brand-red hover:underline">
            Retour à la galerie
          </Link>
        </div>
      </main>
    )
  }

  const categoryMeta = categories.find((c: Category) => c.id === product.categoryId)
  const categoryName = categoryMeta?.nom
  const categoryPath = categoryMeta
    ? `/category/${preferredCategorySlug(categoryMeta)}`
    : null
  const image = getProductImage(product, IMAGE_WIDTH.gallery)
  const dims = pricedDimensions(product, catalog)
  const cadres = catalog && dimensionId ? availableCadres(catalog, dimensionId) : []
  const selectedDim = dims.find((d) => d.id === dimensionId) ?? dims[0]
  const selectedCadre = cadres.find((c) => c.id === cadreId) ?? cadres[0]
  const couleurs = selectedCadre?.couleurs ?? []
  const selectedCouleur = couleurs.find((c) => c.id === couleurId) ?? couleurs[0]
  const unitPrice =
    catalog && selectedDim && selectedCadre
      ? resolveCatalogPrice(catalog, selectedDim.id, selectedCadre.id)
      : null
  const liked = isFavorite(product.id)
  const avgRating =
    reviews.length > 0
      ? (reviews.reduce((s, r) => s + r.note, 0) / reviews.length).toFixed(1)
      : null
  const likeCount = likeSummary?.count ?? 0
  const available = product.statut === 'DISPONIBLE' && unitPrice != null

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
    if (unitPrice == null || !selectedDim || !selectedCadre) {
      toast.error('Choisissez une dimension et un cadre tarifés')
      return
    }
    trackClick('ADD_TO_CART')
    addItem({
      productId: product.id,
      ref: product.ref,
      imageUrl: image,
      prixUnitaire: unitPrice,
      quantite: qty,
      taille: selectedDim.label,
      encadrement: selectedCadre.nom,
      couleur: selectedCouleur?.nom,
    })
    toast.success('Ajouté au panier', {
      description: `${product.ref} · ${displayDimension(selectedDim.label)}`,
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
        queryKey: queryKeys.productLikes(productId, visitor?.id != null ? String(visitor.id) : null),
      })
    } catch {
      toast.error("Impossible de mettre à jour le j'aime")
    }
  }

  return (
    <main className="flex min-h-screen min-w-0 flex-col overflow-x-hidden bg-beige/25 font-[Inter,sans-serif]">
      <SiteNav />

      <div className="mx-auto w-full min-w-0 max-w-7xl px-4 py-6 sm:px-6 sm:py-8 md:px-10 md:py-10">
        <BackButton fallbackTo="/products" fallbackSearch={{ category: undefined }} className="mb-4" />
        <nav className="mb-5 flex min-w-0 flex-wrap items-center gap-y-1 text-sm text-muted-foreground" aria-label="Fil d'Ariane">
          <Link to="/" className="hover:text-brand-red">
            Accueil
          </Link>
          <span className="mx-2">/</span>
          <Link to="/products" search={{ category: undefined }} className="hover:text-brand-red">
            Produits
          </Link>
          {categoryName && categoryPath && (
            <>
              <span className="mx-2">/</span>
              <Link to="/category/$slug" params={{ slug: preferredCategorySlug(categoryMeta!) }} className="hover:text-brand-red">
                {categoryName}
              </Link>
            </>
          )}
          <span className="mx-2">/</span>
          <span className="min-w-0 truncate font-medium text-foreground" aria-current="page">{product.ref}</span>
        </nav>

        <div className="grid min-w-0 items-start gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,420px)] lg:gap-12">
          <ProductImageGallery
            images={galleryImages}
            alt={productVisibleTitle(product.ref, categoryName)}
            liked={liked}
            onLike={handleLike}
            simulationImageUrl={simulationImage}
            onAr={setArImage}
          />

          <aside className="min-w-0 w-full lg:sticky lg:top-24">
            {(likeCount > 0 || comments.length > 0) && (
              <p className="text-sm font-medium text-brand-red">
                {likeCount > 0
                  ? `${likeCount} personne${likeCount > 1 ? 's' : ''} aiment ce tableau`
                  : `${comments.length} commentaire${comments.length > 1 ? 's' : ''} récents`}
              </p>
            )}

            <p className="mt-3 break-words font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-[2.75rem]">
              {unitPrice != null ? formatPrice(unitPrice) : 'Prix selon format'}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Prix selon la dimension et le cadre · la couleur ne change pas le tarif
            </p>

            <h1 className="mt-5 break-words font-display text-xl font-bold leading-snug text-foreground sm:text-2xl md:text-3xl">
              {productVisibleTitle(product.ref, categoryName)}
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {product.description?.trim() ||
                `Tableau décoratif mural${categoryName ? ` ${categoryName.toLowerCase()}` : ''} à commander en ligne. Choisissez la dimension et le cadre ; livraison en Tunisie.`}
            </p>

            <div className="mt-3 flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2 text-sm">
              {categoryName && (
                <span className="max-w-full break-words rounded-full bg-accent-green/15 px-2.5 py-0.5 text-[11px] font-bold uppercase leading-snug tracking-wider text-accent-green sm:text-xs">
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
              <span className={`font-semibold ${available ? 'text-accent-green' : 'text-brand-red'}`}>
                {available ? 'Disponible' : product.statut === 'RUPTURE_STOCK' ? 'Rupture' : 'Format à tarifer'}
              </span>
            </div>

            <div className="mt-5 flex min-w-0 items-start gap-2 rounded-xl border border-accent-blue/20 bg-accent-blue/5 px-3 py-3 text-sm text-foreground">
              <Truck className="mt-0.5 h-4 w-4 shrink-0 text-accent-green" />
              <div className="min-w-0">
                <p className="font-semibold">Livraison estimée</p>
                <p className="break-words text-muted-foreground">
                  Commandez aujourd&apos;hui — réception entre le {deliveryHint}
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold" htmlFor="size-select">
                  Dimension
                </label>
                <select
                  id="size-select"
                  value={selectedDim?.id ?? ''}
                  onChange={(e) => setDimensionId(Number(e.target.value))}
                  className="w-full min-w-0 max-w-full rounded-xl border border-border bg-sand px-3 py-3 text-sm font-medium outline-none transition focus:border-brand-red focus:ring-2 focus:ring-brand-red/20 sm:px-4"
                >
                  {dims.map((dim) => {
                    const minPrice = catalog
                      ? availableCadres(catalog, dim.id)
                          .map((c) => resolveCatalogPrice(catalog, dim.id, c.id))
                          .filter((n): n is number => n != null)
                          .sort((a, b) => a - b)[0]
                      : null
                    return (
                      <option key={dim.id} value={dim.id}>
                        {displayDimension(dim.label)}
                        {minPrice != null ? ` — ${formatPrice(minPrice)}` : ''}
                      </option>
                    )
                  })}
                </select>
                {dims.length === 0 && (
                  <p className="mt-1 text-xs text-brand-red">Aucun format tarifé pour ce tableau.</p>
                )}
              </div>

              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold" htmlFor="frame-select">
                  Encadrement
                </label>
                <select
                  id="frame-select"
                  value={selectedCadre?.id ?? ''}
                  onChange={(e) => setCadreId(Number(e.target.value))}
                  className="w-full min-w-0 max-w-full rounded-xl border border-border bg-sand px-3 py-3 text-sm font-medium outline-none transition focus:border-brand-red focus:ring-2 focus:ring-brand-red/20 sm:px-4"
                >
                  {cadres.map((cadre) => {
                    const price = catalog && selectedDim
                      ? resolveCatalogPrice(catalog, selectedDim.id, cadre.id)
                      : null
                    return (
                      <option key={cadre.id} value={cadre.id}>
                        {cadre.nom}
                        {price != null ? ` — ${formatPrice(price)}` : ''}
                      </option>
                    )
                  })}
                </select>
              </div>

              {couleurs.length > 0 && (
                <div>
                  <p className="mb-2 text-sm font-semibold">Couleurs du cadre</p>
                  <div className="flex gap-3 overflow-x-auto pb-1">
                    {couleurs.map((color) => {
                      const src = color.imageUrl ? resolveImageSrc(color.imageUrl, IMAGE_WIDTH.color) : null
                      const selected = selectedCouleur?.id === color.id
                      return (
                        <button
                          key={color.id}
                          type="button"
                          onClick={() => setCouleurId(color.id)}
                          className={`group w-[72px] shrink-0 text-left ${selected ? '' : 'opacity-80 hover:opacity-100'}`}
                        >
                          <span
                            className={`block overflow-hidden rounded-lg border-2 bg-muted shadow-sm ${
                              selected
                                ? 'border-foliage ring-1 ring-foliage/30'
                                : 'border-transparent'
                            }`}
                          >
                            {src ? (
                              <img
                                src={src}
                                alt={color.nom}
                                className="aspect-[3/4] w-full object-cover"
                              />
                            ) : (
                              <span
                                className="block aspect-[3/4] w-full"
                                style={{ background: color.hex || '#888' }}
                              />
                            )}
                          </span>
                          <span
                            className={`mt-1.5 block text-center text-xs ${
                              selected ? 'font-semibold text-foreground' : 'text-muted-foreground'
                            }`}
                          >
                            {color.nom}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    Cliquez une couleur pour voir l’échantillon du cadre
                  </p>
                </div>
              )}

              <div>
                <label className="mb-1.5 block text-sm font-semibold">Quantité</label>
                <div className="inline-flex h-11 items-center rounded-xl border border-border bg-sand">
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
                    onClick={() => setQty((q) => q + 1)}
                    className="h-11 w-10 text-lg hover:bg-muted"
                    disabled={!available}
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleAddToCart}
              disabled={!available}
              className="mt-6 w-full rounded-full bg-foliage px-8 py-3.5 text-base font-bold text-sand transition hover:bg-foliage disabled:opacity-50"
            >
              {available ? 'Ajouter au panier' : 'Indisponible'}
            </button>

            <div className="mt-3 flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
              <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent-green" />
              <span>Impression soignée · Formats personnalisés · Retours sous conditions</span>
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
                  <ul className="list-inside list-disc space-y-1">
                    {product.ref && <li>Référence : {product.ref}</li>}
                    <li>Catégorie : {categoryName ?? '—'}</li>
                    <li>Dimension : {selectedDim ? displayDimension(selectedDim.label) : '—'}</li>
                    <li>Encadrement : {selectedCadre?.nom ?? '—'}</li>
                    {selectedCouleur && <li>Couleur : {selectedCouleur.nom}</li>}
                  </ul>
                </div>
              )}
            </div>
          </aside>
        </div>

        {/* Bloc unique « satisfaction » : synthèse à gauche, contributions à droite */}
        <section
          id="avis"
          className="mt-12 overflow-hidden rounded-2xl border border-border/60 bg-sand shadow-[0_26px_55px_-42px_rgba(74,93,79,0.9)] sm:mt-16 sm:rounded-3xl"
        >
          <div className="grid min-w-0 lg:grid-cols-[minmax(0,300px)_minmax(0,1fr)]">
            <div className="border-b border-border/60 bg-beige/45 p-6 lg:border-b-0 lg:border-r">
              <p className="font-display text-xs uppercase tracking-[0.22em] text-gold">
                Satisfaction client
              </p>

              <div className="mt-3 flex items-end gap-2">
                <span className="font-display text-5xl font-bold leading-none text-foreground">
                  {reviewStats.total ? reviewStats.average.toFixed(1).replace('.', ',') : '—'}
                </span>
                <span className="pb-1.5 text-sm text-muted-foreground">/ 5</span>
              </div>
              <StarRow value={reviewStats.average} size="md" className="mt-2" />
              <p className="mt-2 text-sm text-muted-foreground">
                {reviewStats.total} avis · {comments.length} commentaire
                {comments.length > 1 ? 's' : ''}
              </p>

              <div className="mt-5 space-y-1.5">
                {reviewStats.distribution.map(({ star, count, percent }) => (
                  <div key={star} className="flex items-center gap-2">
                    <span className="w-8 text-xs font-semibold text-muted-foreground">
                      {star} ★
                    </span>
                    <span className="h-2 flex-1 overflow-hidden rounded-full bg-sand">
                      <span
                        className="block h-full rounded-full bg-gold transition-all duration-700"
                        style={{ width: `${percent}%` }}
                      />
                    </span>
                    <span className="w-5 text-right text-xs text-muted-foreground">{count}</span>
                  </div>
                ))}
              </div>

              <div className="mt-6 rounded-2xl border border-gold/30 bg-sand p-4">
                <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <ShieldCheck className="h-4 w-4 text-sage" />
                  Avis vérifiés
                </p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  Chaque avis est relu par notre équipe avant publication.
                </p>
                <button
                  type="button"
                  onClick={() => setFeedbackTab('avis')}
                  className="mt-3 w-full rounded-full bg-foliage px-4 py-2.5 text-sm font-semibold text-sand transition hover:bg-foliage/90"
                >
                  Donner mon avis
                </button>
              </div>
            </div>

            <div className="min-w-0 p-4 sm:p-6 md:p-8">
              <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                <h2 className="font-display text-xl font-bold text-foreground sm:text-2xl">
                  Ce qu&apos;en disent nos clients
                </h2>
                <div className="inline-flex max-w-full flex-wrap rounded-full border border-border bg-beige/40 p-1">
                  {(
                    [
                      { key: 'avis', label: `Avis (${reviews.length})`, icon: Star },
                      {
                        key: 'commentaires',
                        label: `Commentaires (${comments.length})`,
                        icon: MessageSquare,
                      },
                    ] as const
                  ).map(({ key, label, icon: Icon }) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setFeedbackTab(key)}
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold transition sm:px-4 sm:text-sm ${
                        feedbackTab === key
                          ? 'bg-foliage text-sand shadow-sm'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {feedbackTab === 'avis' ? (
                <>
                  <div className="mt-6 rounded-2xl border border-dashed border-gold/45 bg-beige/30 p-5">
                    <p className="text-sm font-semibold text-foreground">
                      Notez ce tableau
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-4">
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <button
                            key={n}
                            type="button"
                            onClick={() => setReviewNote(n)}
                            aria-label={`Noter ${n} étoile${n > 1 ? 's' : ''}`}
                            className="transition hover:scale-110"
                          >
                            <Star
                              className={`h-6 w-6 ${
                                n <= reviewNote ? 'fill-gold text-gold' : 'text-beige'
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        {reviewNote} étoile{reviewNote > 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                      <input
                        value={reviewText}
                        onChange={(e) => setReviewText(e.target.value)}
                        placeholder="Qualité de l'impression, rendu des couleurs, livraison…"
                        className="flex-1 rounded-xl border border-border bg-sand px-4 py-3 text-sm focus:border-gold focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleReview}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-gold px-6 py-3 text-sm font-semibold text-sand transition hover:brightness-110"
                      >
                        <Send className="h-4 w-4" />
                        Publier mon avis
                      </button>
                    </div>
                  </div>

                  {reviews.length === 0 ? (
                    <EmptyFeedback
                      icon={<Star className="h-5 w-5 text-gold" />}
                      title="Aucun avis pour l'instant"
                      text="Soyez le premier à noter ce tableau, votre retour aide les autres clients."
                    />
                  ) : (
                    <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                      {reviews.map((r) => (
                        <article
                          key={r.id}
                          className="group flex h-full flex-col gap-3 rounded-2xl border border-border/70 bg-beige/25 p-4 transition hover:-translate-y-0.5 hover:border-gold/50 hover:bg-sand hover:shadow-[0_18px_35px_-28px_rgba(74,93,79,0.9)]"
                        >
                          <div className="flex items-center gap-3">
                            <FeedbackAvatar label={`Client ${r.userId}`} />
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-foreground">
                                Client #{r.userId}
                              </p>
                              <p className="text-[11px] text-muted-foreground">
                                {formatFeedbackDate(r.createdAt)}
                              </p>
                            </div>
                          </div>
                          <StarRow value={r.note} />
                          {r.commentaire && (
                            <p className="text-sm leading-relaxed text-foreground/85">
                              {r.commentaire}
                            </p>
                          )}
                          <span className="mt-auto inline-flex w-fit items-center gap-1.5 rounded-full bg-sage/25 px-2.5 py-1 text-[11px] font-semibold text-foreground">
                            <ShieldCheck className="h-3 w-3" />
                            Achat vérifié
                          </span>
                        </article>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="mt-6 flex min-w-0 gap-3 rounded-2xl border border-border bg-beige/30 p-3 sm:p-4">
                    <FeedbackAvatar label={visitor?.nom ?? 'Vous'} />
                    <div className="min-w-0 flex-1">
                      <textarea
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        rows={2}
                        placeholder="Posez une question ou partagez votre expérience…"
                        className="w-full resize-none rounded-xl border border-border bg-sand px-4 py-3 text-sm focus:border-gold focus:outline-none"
                      />
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-[11px] text-muted-foreground">
                          {commentText.length}/500 caractères
                        </span>
                        <button
                          type="button"
                          onClick={handleComment}
                          disabled={!commentText.trim()}
                          className="inline-flex items-center gap-2 rounded-full bg-foliage px-5 py-2 text-sm font-semibold text-sand transition hover:bg-foliage/90 disabled:opacity-45"
                        >
                          <Send className="h-3.5 w-3.5" />
                          Publier
                        </button>
                      </div>
                    </div>
                  </div>

                  {comments.length === 0 ? (
                    <EmptyFeedback
                      icon={<MessageSquare className="h-5 w-5 text-sage" />}
                      title="Aucun commentaire"
                      text="Lancez la discussion, notre équipe répond sous 24 h."
                    />
                  ) : (
                    <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                      {comments.map((c) => (
                        <article
                          key={c.id}
                          className="flex h-full flex-col gap-3 rounded-2xl border border-border/70 bg-beige/25 p-4 transition hover:-translate-y-0.5 hover:border-sage/60 hover:bg-sand hover:shadow-[0_18px_35px_-28px_rgba(74,93,79,0.9)]"
                        >
                          <div className="flex items-center gap-3">
                            <FeedbackAvatar label={c.userNom ?? 'Client'} />
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-foreground">
                                {c.userNom ?? 'Client'}
                              </p>
                              <p className="text-[11px] text-muted-foreground">
                                {formatFeedbackDate(c.createdAt)}
                              </p>
                            </div>
                          </div>
                          <p className="text-sm leading-relaxed text-foreground/85">{c.contenu}</p>
                        </article>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
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
              {categoryMeta ? (
                <Link
                  to="/category/$slug"
                  params={{ slug: preferredCategorySlug(categoryMeta) }}
                  className="text-sm font-semibold text-brand-red hover:underline"
                >
                  Voir toute la catégorie →
                </Link>
              ) : (
                <Link
                  to="/products"
                  search={{ category: String(product.categoryId) }}
                  className="text-sm font-semibold text-brand-red hover:underline"
                >
                  Voir plus →
                </Link>
              )}
            </div>

            <div className="-mx-1 flex max-w-full gap-4 overflow-x-auto px-1 pb-3 snap-x snap-mandatory">
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
      <LazyArViewer isOpen={!!arImage} onClose={() => setArImage(null)} imageSrc={arImage} />
    </main>
  )
}

function formatFeedbackDate(value?: string) {
  if (!value) return 'Récemment'
  return new Date(value).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function StarRow({
  value,
  size = 'sm',
  className = '',
}: {
  value: number
  size?: 'sm' | 'md'
  className?: string
}) {
  const dimension = size === 'md' ? 'h-5 w-5' : 'h-3.5 w-3.5'
  return (
    <div
      className={`flex items-center gap-0.5 ${className}`}
      aria-label={`Note de ${value.toFixed(1)} sur 5`}
    >
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`${dimension} ${i <= Math.round(value) ? 'fill-gold text-gold' : 'text-beige'}`}
        />
      ))}
    </div>
  )
}

function FeedbackAvatar({ label }: { label: string }) {
  const letters = label
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')

  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-foliage text-xs font-bold text-sand">
      {letters || 'LA'}
    </span>
  )
}

function EmptyFeedback({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode
  title: string
  text: string
}) {
  return (
    <div className="mt-6 flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border py-10 text-center">
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-beige/60">
        {icon}
      </span>
      <p className="font-display text-base font-bold text-foreground">{title}</p>
      <p className="max-w-xs text-sm text-muted-foreground">{text}</p>
    </div>
  )
}
