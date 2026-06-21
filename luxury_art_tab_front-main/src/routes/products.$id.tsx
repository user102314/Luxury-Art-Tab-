import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { toast } from 'sonner'
import { SiteNav } from '@/components/SiteNav'
import { SiteFooter } from '@/components/SiteFooter'
import { ArViewer } from '@/components/ArViewer'
import { api } from '@/lib/api'
import { queryKeys } from '@/lib/queryKeys'
import { REFETCH_INTERVAL } from '@/lib/queryClient'
import { useProduct } from '@/hooks/useStorefrontQueries'
import { getProductImage } from '@/lib/images'
import {
  dimensionOptions,
  frameOptions,
  formatPrice,
  getPrice,
} from '@/lib/pricing'
import { useCart } from '@/context/CartContext'
import { useFavorites } from '@/context/FavoritesContext'
import { useVisitor } from '@/context/VisitorContext'

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

  const { data: product, isLoading } = useProduct(productId)

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

  if (isLoading && !product) {
    return (
      <main className="min-h-screen bg-background">
        <SiteNav />
        <div className="mx-auto max-w-7xl px-6 py-32">
          <div className="grid gap-8 md:grid-cols-2">
            <div className="aspect-[4/5] animate-pulse rounded-3xl bg-muted" />
            <div className="space-y-4">
              <div className="h-10 w-2/3 animate-pulse rounded bg-muted" />
              <div className="h-6 w-1/3 animate-pulse rounded bg-muted" />
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

  const handleAddToCart = () => {
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
      action: { label: 'Voir panier', onClick: () => {} },
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
      queryClient.invalidateQueries({ queryKey: queryKeys.productLikes(productId, visitor?.id ?? null) })
    } catch {
      toast.error("Impossible de mettre à jour le j'aime")
    }
  }

  return (
    <main className="min-h-screen bg-background font-[Inter,sans-serif]">
      <SiteNav />

      <div className="mx-auto max-w-7xl px-6 py-10 md:px-10">
        <nav className="mb-8 text-sm text-muted-foreground">
          <Link to="/" className="hover:text-brand-red">Accueil</Link>
          <span className="mx-2">/</span>
          <Link to="/products" className="hover:text-brand-red">Produits</Link>
          <span className="mx-2">/</span>
          <span className="text-foreground font-medium">{product.nom}</span>
        </nav>

        <div className="grid gap-12 lg:grid-cols-2">
          <div className="relative overflow-hidden rounded-3xl bg-muted shadow-xl">
            <img src={image} alt={product.nom} className="aspect-[4/5] w-full object-cover" />
            <button
              type="button"
              onClick={() => setArImage(image)}
              className="absolute bottom-4 right-4 flex items-center gap-2 rounded-full bg-accent-green px-4 py-2 text-sm font-semibold text-white shadow-lg hover:opacity-90"
            >
              Voir en AR
            </button>
          </div>

          <div>
            {categoryName && (
              <span className="inline-block rounded-full bg-accent-green/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-accent-green">
                {categoryName}
              </span>
            )}
            <h1 className="mt-4 font-display text-4xl font-bold text-foreground md:text-5xl">
              {product.nom}
            </h1>

            <div className="mt-3 flex flex-wrap items-center gap-4">
              {avgRating && (
                <span className="flex items-center gap-1 text-sm font-semibold text-foreground">
                  <span className="text-brand-red">★</span> {avgRating} ({reviews.length} avis)
                </span>
              )}
              {likeSummary && (
                <span className="text-sm text-muted-foreground">
                  <span className="font-semibold text-brand-red">{likeSummary.count}</span> j&apos;aime
                </span>
              )}
              <span
                className={`text-sm font-semibold ${
                  product.stock > 0 ? 'text-accent-green' : 'text-brand-red'
                }`}
              >
                {product.stock > 0 ? `${product.stock} en stock` : 'Rupture de stock'}
              </span>
            </div>

            <p className="mt-6 font-display text-3xl font-bold text-brand-red">
              {formatPrice(unitPrice)}
            </p>

            {product.description && (
              <p className="mt-6 leading-relaxed text-muted-foreground">{product.description}</p>
            )}

            <div className="mt-8">
              <p className="text-sm font-semibold">Taille du tableau</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {dimensionOptions.map((dim) => (
                  <button
                    key={dim.value}
                    type="button"
                    onClick={() => setSize(dim.value)}
                    className={`rounded-lg border px-4 py-2 text-sm font-semibold transition ${
                      size === dim.value
                        ? 'border-accent-green bg-accent-green text-white'
                        : 'border-border hover:border-brand-red/40'
                    }`}
                  >
                    {dim.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6">
              <p className="text-sm font-semibold">Encadrement</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {frameOptions.map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFrame(f)}
                    className={`rounded-lg border px-3 py-2 text-xs font-semibold uppercase transition ${
                      frame === f
                        ? 'border-brand-red bg-brand-red text-white'
                        : 'border-border hover:border-brand-red/40'
                    }`}
                  >
                    {f.replace('Toile avec cadre exterieur ', '')}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <div className="inline-flex h-11 items-center rounded-xl border border-border">
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
                  onClick={() => setQty(qty + 1)}
                  className="h-11 w-10 text-lg hover:bg-muted"
                >
                  +
                </button>
              </div>

              <button
                type="button"
                onClick={handleAddToCart}
                disabled={product.stock <= 0}
                className="flex-1 rounded-xl bg-brand-red px-8 py-3 text-sm font-bold text-white transition hover:bg-brand-red/90 disabled:opacity-50"
              >
                Ajouter au panier
              </button>

              <button
                type="button"
                onClick={handleLike}
                className={`flex h-11 w-11 items-center justify-center rounded-xl border transition ${
                  liked
                    ? 'border-brand-red bg-brand-red text-white'
                    : 'border-border hover:border-brand-red'
                }`}
                aria-label="J'aime"
              >
                ♥
              </button>
            </div>
          </div>
        </div>

        {/* Comments */}
        <section className="mt-20 rounded-3xl border border-border/60 bg-white/60 p-8">
          <h2 className="font-display text-2xl font-bold">
            Commentaires <span className="text-accent-green">({comments.length})</span>
          </h2>
          <div className="mt-6 flex gap-3">
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

        {/* Reviews */}
        <section className="mt-10 rounded-3xl border border-border/60 bg-white/60 p-8">
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
      </div>

      <SiteFooter />
      <ArViewer isOpen={!!arImage} onClose={() => setArImage(null)} imageSrc={arImage} />
    </main>
  )
}
