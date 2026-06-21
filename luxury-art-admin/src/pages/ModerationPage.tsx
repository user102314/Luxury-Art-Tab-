import { useMemo, useState } from 'react'
import { Check, MessageCircle, Star, Trash2, X } from 'lucide-react'
import { api, COMMENT_STATUS_LABELS, formatDate, REVIEW_STATUS_LABELS } from '../lib/api'
import { PageSkeleton, QueryStatusBar } from '../components/QueryStatusBar'
import {
  useInvalidateAdmin,
  useProductComments,
  useProducts,
  useReviews,
} from '../hooks/useAdminQueries'
import type { ProductComment, Review } from '../types'

type Tab = 'reviews' | 'comments'

export default function ModerationPage() {
  const [tab, setTab] = useState<Tab>('reviews')
  const { data: reviews = [], isLoading: loadingReviews, isFetching: fetchingReviews } = useReviews()
  const { data: comments = [], isLoading: loadingComments, isFetching: fetchingComments } = useProductComments()
  const { data: products = [] } = useProducts()
  const invalidate = useInvalidateAdmin()
  const [filter, setFilter] = useState<'all' | 'EN_ATTENTE' | 'APPROUVE' | 'REJETE'>('all')

  const productMap = useMemo(
    () => Object.fromEntries(products.map((p) => [p.id, p.nom])),
    [products],
  )

  const filteredReviews = reviews.filter((r) => filter === 'all' || r.statut === filter)
  const filteredComments = comments.filter((c) => filter === 'all' || c.statut === filter)

  const pendingReviews = reviews.filter((r) => r.statut === 'EN_ATTENTE').length
  const pendingComments = comments.filter((c) => c.statut === 'EN_ATTENTE').length

  const isLoading = (loadingReviews || loadingComments) && reviews.length === 0 && comments.length === 0
  const isFetching = fetchingReviews || fetchingComments

  const handleApproveReview = async (review: Review) => {
    await api.approveReview(review.id)
    await invalidate.reviews()
  }

  const handleRejectReview = async (review: Review) => {
    await api.rejectReview(review)
    await invalidate.reviews()
  }

  const handleDeleteReview = async (id: number) => {
    if (!confirm('Supprimer cet avis ?')) return
    await api.deleteReview(id)
    await invalidate.reviews()
  }

  const handleApproveComment = async (comment: ProductComment) => {
    await api.updateProductComment(comment.id, {
      userId: comment.userId,
      productId: comment.productId,
      contenu: comment.contenu,
      statut: 'APPROUVE',
    })
    await invalidate.comments()
  }

  const handleRejectComment = async (comment: ProductComment) => {
    await api.updateProductComment(comment.id, {
      userId: comment.userId,
      productId: comment.productId,
      contenu: comment.contenu,
      statut: 'REJETE',
    })
    await invalidate.comments()
  }

  const handleDeleteComment = async (id: number) => {
    if (!confirm('Supprimer ce commentaire ?')) return
    await api.deleteProductComment(id)
    await invalidate.comments()
  }

  if (isLoading) {
    return <PageSkeleton rows={6} />
  }

  return (
    <div className="space-y-6">
      <QueryStatusBar fetching={isFetching} />
      <div>
        <h2 className="text-xl font-semibold text-white">Modération</h2>
        <p className="text-sm text-zinc-500">Gérez les avis clients et commentaires produits</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="card flex items-center gap-4 p-4">
          <Star className="h-8 w-8 text-amber-400" />
          <div>
            <p className="text-2xl font-bold text-white">{reviews.length}</p>
            <p className="text-sm text-zinc-500">
              Avis · <span className="text-amber-400">{pendingReviews} en attente</span>
            </p>
          </div>
        </div>
        <div className="card flex items-center gap-4 p-4">
          <MessageCircle className="h-8 w-8 text-blue-400" />
          <div>
            <p className="text-2xl font-bold text-white">{comments.length}</p>
            <p className="text-sm text-zinc-500">
              Commentaires · <span className="text-blue-400">{pendingComments} en attente</span>
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex rounded-xl bg-ink-800 p-1">
          <button
            type="button"
            onClick={() => setTab('reviews')}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              tab === 'reviews' ? 'bg-gold-500/20 text-gold-300' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Avis ({reviews.length})
          </button>
          <button
            type="button"
            onClick={() => setTab('comments')}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              tab === 'comments' ? 'bg-gold-500/20 text-gold-300' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Commentaires ({comments.length})
          </button>
        </div>

        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as typeof filter)}
          className="input w-auto py-2 text-sm"
        >
          <option value="all">Tous les statuts</option>
          <option value="EN_ATTENTE">En attente</option>
          <option value="APPROUVE">Approuvés</option>
          <option value="REJETE">Rejetés</option>
        </select>

        <button
          type="button"
          onClick={() => {
            invalidate.reviews()
            invalidate.comments()
          }}
          className="btn-ghost text-sm"
        >
          Actualiser
        </button>
      </div>

      {tab === 'reviews' ? (
        <div className="card overflow-hidden">
          {filteredReviews.length === 0 ? (
            <p className="p-8 text-center text-zinc-500">Aucun avis</p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 text-xs uppercase text-zinc-500">
                  <th className="px-6 py-3">Produit</th>
                  <th className="px-6 py-3">Note</th>
                  <th className="px-6 py-3">Commentaire</th>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3">Statut</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredReviews.map((r) => (
                  <tr key={r.id} className="border-b border-white/5">
                    <td className="px-6 py-4 font-medium text-white">
                      {productMap[r.productId] ?? `Produit #${r.productId}`}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-amber-400">{'★'.repeat(r.note)}</span>
                      <span className="text-zinc-600">{'★'.repeat(5 - r.note)}</span>
                    </td>
                    <td className="max-w-xs px-6 py-4 text-zinc-300">
                      {r.commentaire || '—'}
                    </td>
                    <td className="px-6 py-4 text-zinc-500">
                      {r.createdAt ? formatDate(r.createdAt) : '—'}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge statut={r.statut} labels={REVIEW_STATUS_LABELS} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        {r.statut === 'EN_ATTENTE' && (
                          <>
                            <ActionIcon
                              title="Approuver"
                              onClick={() => handleApproveReview(r)}
                              className="text-emerald-400 hover:bg-emerald-500/20"
                            >
                              <Check className="h-4 w-4" />
                            </ActionIcon>
                            <ActionIcon
                              title="Rejeter"
                              onClick={() => handleRejectReview(r)}
                              className="text-amber-400 hover:bg-amber-500/20"
                            >
                              <X className="h-4 w-4" />
                            </ActionIcon>
                          </>
                        )}
                        <ActionIcon
                          title="Supprimer"
                          onClick={() => handleDeleteReview(r.id)}
                          className="text-red-400 hover:bg-red-500/20"
                        >
                          <Trash2 className="h-4 w-4" />
                        </ActionIcon>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ) : (
        <div className="card overflow-hidden">
          {filteredComments.length === 0 ? (
            <p className="p-8 text-center text-zinc-500">Aucun commentaire</p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 text-xs uppercase text-zinc-500">
                  <th className="px-6 py-3">Produit</th>
                  <th className="px-6 py-3">Auteur</th>
                  <th className="px-6 py-3">Contenu</th>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3">Statut</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredComments.map((c) => (
                  <tr key={c.id} className="border-b border-white/5">
                    <td className="px-6 py-4 font-medium text-white">
                      {productMap[c.productId] ?? `Produit #${c.productId}`}
                    </td>
                    <td className="px-6 py-4 text-zinc-400">
                      {c.userNom ?? `User #${c.userId}`}
                    </td>
                    <td className="max-w-md px-6 py-4 text-zinc-300">{c.contenu}</td>
                    <td className="px-6 py-4 text-zinc-500">
                      {c.createdAt ? formatDate(c.createdAt) : '—'}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge statut={c.statut} labels={COMMENT_STATUS_LABELS} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        {c.statut !== 'APPROUVE' && (
                          <ActionIcon
                            title="Approuver"
                            onClick={() => handleApproveComment(c)}
                            className="text-emerald-400 hover:bg-emerald-500/20"
                          >
                            <Check className="h-4 w-4" />
                          </ActionIcon>
                        )}
                        {c.statut !== 'REJETE' && (
                          <ActionIcon
                            title="Rejeter"
                            onClick={() => handleRejectComment(c)}
                            className="text-amber-400 hover:bg-amber-500/20"
                          >
                            <X className="h-4 w-4" />
                          </ActionIcon>
                        )}
                        <ActionIcon
                          title="Supprimer"
                          onClick={() => handleDeleteComment(c.id)}
                          className="text-red-400 hover:bg-red-500/20"
                        >
                          <Trash2 className="h-4 w-4" />
                        </ActionIcon>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}

function StatusBadge({ statut, labels }: { statut: string; labels: Record<string, string> }) {
  const colors: Record<string, string> = {
    EN_ATTENTE: 'bg-amber-500/20 text-amber-300',
    APPROUVE: 'bg-emerald-500/20 text-emerald-300',
    REJETE: 'bg-red-500/20 text-red-300',
  }
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs ${colors[statut] ?? 'bg-zinc-500/20 text-zinc-400'}`}>
      {labels[statut] ?? statut}
    </span>
  )
}

function ActionIcon({
  children,
  onClick,
  title,
  className,
}: {
  children: React.ReactNode
  onClick: () => void
  title: string
  className?: string
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`rounded-lg p-2 transition ${className}`}
    >
      {children}
    </button>
  )
}
