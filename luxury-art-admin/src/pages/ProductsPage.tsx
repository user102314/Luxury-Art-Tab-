import { useEffect, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import {
  Plus,
  Pencil,
  Trash2,
  Eye,
  Heart,
  MessageCircle,
  Star,
  TrendingUp,
  X,
  Package,
  Upload,
  ImageIcon,
} from 'lucide-react'
import { api, formatCurrency, formatDate } from '../lib/api'
import { PageSkeleton, QueryStatusBar } from '../components/QueryStatusBar'
import {
  useBestSellers,
  useCategories,
  useInvalidateAdmin,
  useProducts,
} from '../hooks/useAdminQueries'
import { queryKeys } from '../lib/queryKeys'
import type { Product, ProductAnalytics, ProductImage, ProductStatut } from '../types'

const STATUTS: ProductStatut[] = ['DISPONIBLE', 'RUPTURE_STOCK', 'ARCHIVE']

const emptyForm = {
  nom: '',
  description: '',
  prix: '',
  stock: '',
  categoryId: '',
  statut: 'DISPONIBLE' as ProductStatut,
}

type Tab = 'catalogue' | 'stats' | 'detail'

function resolveImageSrc(url?: string) {
  if (!url) return undefined
  if (url.startsWith('http') || url.startsWith('blob:') || url.startsWith('data:')) return url
  return url.startsWith('/') ? url : `/${url}`
}

export default function ProductsPage() {
  const queryClient = useQueryClient()
  const invalidate = useInvalidateAdmin()
  const { data: products = [], isLoading, isFetching } = useProducts()
  const { data: categories = [] } = useCategories()
  const { data: bestSellers = [] } = useBestSellers()
  const [tab, setTab] = useState<Tab>('catalogue')
  const [selected, setSelected] = useState<ProductAnalytics | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState('')
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const [previewUrls, setPreviewUrls] = useState<string[]>([])
  const [existingImages, setExistingImages] = useState<ProductImage[]>([])
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const urls = pendingFiles.map((file) => URL.createObjectURL(file))
    setPreviewUrls(urls)
    return () => urls.forEach((url) => URL.revokeObjectURL(url))
  }, [pendingFiles])

  const refreshProducts = async () => {
    await invalidate.products()
    await invalidate.bestSellers()
  }

  const openCreate = () => {
    setEditing(null)
    setPendingFiles([])
    setPreviewUrls([])
    setExistingImages([])
    setForm({
      ...emptyForm,
      categoryId: categories[0]?.id?.toString() ?? '',
    })
    setShowForm(true)
    setError('')
  }

  const openEdit = (p: Product) => {
    setEditing(p)
    setPendingFiles([])
    setExistingImages(p.images ?? [])
    setForm({
      nom: p.nom,
      description: p.description ?? '',
      prix: String(p.prix),
      stock: String(p.stock),
      categoryId: String(p.categoryId),
      statut: p.statut as ProductStatut,
    })
    setShowForm(true)
    setError('')
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files ? Array.from(e.target.files) : []
    if (selected.length > 0) {
      setPendingFiles((prev) => [...prev, ...selected])
    }
    e.target.value = ''
  }

  const openFilePicker = () => {
    fileInputRef.current?.click()
  }

  const removePendingFile = (index: number) => {
    setPendingFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const removeExistingImage = async (imageId: number) => {
    if (!confirm('Supprimer cette image ?')) return
    await api.deleteProductImage(imageId)
    setExistingImages((prev) => prev.filter((img) => img.id !== imageId))
    await refreshProducts()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setUploading(true)
    const payload = {
      nom: form.nom,
      description: form.description,
      prix: parseFloat(form.prix),
      stock: parseInt(form.stock, 10),
      categoryId: parseInt(form.categoryId, 10),
      statut: form.statut,
    }
    try {
      let productId: number
      if (editing) {
        const updated = await api.updateProduct(editing.id, payload)
        productId = updated.id
      } else {
        const created = await api.createProduct(payload)
        productId = created.id
      }

      if (pendingFiles.length > 0) {
        try {
          await api.uploadProductImages(productId, pendingFiles)
        } catch (uploadErr) {
          setError(
            `Produit enregistré, mais erreur upload images: ${
              uploadErr instanceof Error ? uploadErr.message : 'Erreur inconnue'
            }`
          )
          await refreshProducts()
          return
        }
      }

      setShowForm(false)
      setPendingFiles([])
      await refreshProducts()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'enregistrement')
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer ce produit ?')) return
    await api.deleteProduct(id)
    if (selected?.productId === id) {
      setSelected(null)
      setTab('catalogue')
    }
    await refreshProducts()
  }

  const openDetail = async (id: number) => {
    const analytics = await queryClient.fetchQuery({
      queryKey: queryKeys.productAnalytics(id),
      queryFn: () => api.getProductAnalytics(id),
    })
    setSelected(analytics)
    setTab('detail')
  }

  const chartData = bestSellers.slice(0, 8).map((b) => ({
    name: b.nom.length > 18 ? b.nom.slice(0, 18) + '…' : b.nom,
    ventes: b.quantiteVendue,
    ca: Number(b.chiffreAffaires),
  }))

  return (
    <div className="space-y-6">
      <QueryStatusBar fetching={isFetching} />

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-white">Gestion des produits</h2>
          <p className="text-sm text-zinc-500">CRUD, j'aimes, commentaires et statistiques</p>
        </div>
        <button onClick={openCreate} className="btn-primary">
          <Plus className="h-4 w-4" />
          Nouveau produit
        </button>
      </div>

      <div className="flex gap-2">
        {(['catalogue', 'stats', 'detail'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            disabled={t === 'detail' && !selected}
            className={`rounded-xl px-4 py-2 text-sm font-medium capitalize transition ${
              tab === t
                ? 'bg-gold-500/20 text-gold-300'
                : 'bg-ink-800 text-zinc-400 hover:text-white disabled:opacity-40'
            }`}
          >
            {t === 'catalogue' ? 'Catalogue' : t === 'stats' ? 'Statistiques' : 'Détail produit'}
          </button>
        ))}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <form onSubmit={handleSubmit} className="card max-h-[90vh] w-full max-w-lg overflow-y-auto p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold text-white">
                {editing ? 'Modifier le produit' : 'Ajouter un produit'}
              </h3>
              <button type="button" onClick={() => setShowForm(false)} className="text-zinc-500 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <Field label="Nom" value={form.nom} onChange={(v) => setForm({ ...form, nom: v })} required />
              <Field label="Description" value={form.description} onChange={(v) => setForm({ ...form, description: v })} textarea />
              <div className="grid grid-cols-2 gap-4">
                <Field label="Prix (€)" value={form.prix} onChange={(v) => setForm({ ...form, prix: v })} type="number" required />
                <Field label="Stock" value={form.stock} onChange={(v) => setForm({ ...form, stock: v })} type="number" required />
              </div>

              <div>
                <label className="label">Images produit</label>
                <p className="mb-2 text-xs text-zinc-500">
                  Sélectionnez une ou plusieurs images — aperçu immédiat avant enregistrement
                </p>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
                  multiple
                  className="sr-only"
                  onChange={handleFileChange}
                />

                <button
                  type="button"
                  onClick={openFilePicker}
                  className="flex w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-white/10 bg-ink-800/50 px-4 py-8 transition hover:border-gold-500/40 hover:bg-ink-800"
                >
                  <Upload className="mb-2 h-8 w-8 text-gold-400" />
                  <span className="text-sm text-zinc-400">Cliquez pour choisir des images</span>
                  <span className="mt-1 text-xs text-zinc-600">PNG, JPG, WEBP — max 10 Mo par fichier</span>
                </button>

                {pendingFiles.length > 0 && (
                  <p className="mt-2 text-xs text-gold-400">
                    {pendingFiles.length} image(s) sélectionnée(s)
                  </p>
                )}

                {(existingImages.length > 0 || pendingFiles.length > 0) && (
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    {existingImages.map((img) => (
                      <div key={img.id} className="group relative aspect-square overflow-hidden rounded-lg bg-ink-800">
                        <img
                          src={resolveImageSrc(img.url)}
                          alt={img.storagePath}
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect fill="%23333" width="100" height="100"/></svg>'
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => removeExistingImage(img.id)}
                          className="absolute right-1 top-1 rounded-full bg-red-500/90 p-1 opacity-0 transition group-hover:opacity-100"
                        >
                          <X className="h-3 w-3 text-white" />
                        </button>
                      </div>
                    ))}
                    {pendingFiles.map((file, i) => (
                      <div
                        key={`${file.name}-${file.size}-${i}`}
                        className="group relative aspect-square overflow-hidden rounded-lg bg-ink-800 ring-2 ring-gold-500/50"
                      >
                        {previewUrls[i] ? (
                          <img
                            src={previewUrls[i]}
                            alt={file.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-xs text-zinc-500">
                            Chargement...
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => removePendingFile(i)}
                          className="absolute right-1 top-1 rounded-full bg-red-500/90 p-1 opacity-0 transition group-hover:opacity-100"
                        >
                          <X className="h-3 w-3 text-white" />
                        </button>
                        <span className="absolute bottom-0 left-0 right-0 truncate bg-black/60 px-1 py-0.5 text-center text-[10px] text-gold-300">
                          {file.name}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="label">Catégorie</label>
                <select
                  className="input"
                  value={form.categoryId}
                  onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                  required
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id} className="bg-ink-800">{c.nom}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Statut</label>
                <select
                  className="input"
                  value={form.statut}
                  onChange={(e) => setForm({ ...form, statut: e.target.value as ProductStatut })}
                >
                  {STATUTS.map((s) => (
                    <option key={s} value={s} className="bg-ink-800">{s}</option>
                  ))}
                </select>
              </div>
              {error && <p className="text-sm text-red-400">{error}</p>}
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={uploading} className="btn-primary flex-1">
                  {uploading ? 'Enregistrement...' : editing ? 'Enregistrer' : 'Créer'}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="btn-ghost">Annuler</button>
              </div>
            </div>
          </form>
        </div>
      )}

      {tab === 'catalogue' && (
        <div className="card overflow-hidden">
          {isLoading && products.length === 0 ? (
            <PageSkeleton rows={5} />
          ) : products.length === 0 ? (
            <div className="p-12 text-center">
              <Package className="mx-auto mb-3 h-10 w-10 text-zinc-600" />
              <p className="text-zinc-500">Aucun produit — créez-en un</p>
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 text-xs uppercase text-zinc-500">
                  <th className="px-6 py-4">Image</th>
                  <th className="px-6 py-4">Produit</th>
                  <th className="px-6 py-4">Prix</th>
                  <th className="px-6 py-4">Stock</th>
                  <th className="px-6 py-4">Statut</th>
                  <th className="px-6 py-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                    <td className="px-6 py-4">
                      {p.imageUrl || p.images?.[0]?.url ? (
                        <img
                          src={resolveImageSrc(p.images?.[0]?.url ?? p.imageUrl)}
                          alt={p.nom}
                          className="h-12 w-12 rounded-lg object-cover ring-1 ring-white/10"
                        />
                      ) : (
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-ink-800">
                          <ImageIcon className="h-5 w-5 text-zinc-600" />
                        </div>
                      )}
                      {(p.images?.length ?? 0) > 1 && (
                        <span className="mt-1 block text-[10px] text-zinc-500">+{p.images!.length - 1} img</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-white">{p.nom}</p>
                      <p className="max-w-xs truncate text-xs text-zinc-500">{p.description}</p>
                    </td>
                    <td className="px-6 py-4 text-gold-400">{formatCurrency(Number(p.prix))}</td>
                    <td className="px-6 py-4">{p.stock}</td>
                    <td className="px-6 py-4">
                      <span className="rounded-lg bg-white/5 px-2 py-1 text-xs">{p.statut}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-1">
                        <ActionBtn icon={Eye} onClick={() => openDetail(p.id)} title="Voir détails" />
                        <ActionBtn icon={Pencil} onClick={() => openEdit(p)} title="Modifier" />
                        <ActionBtn icon={Trash2} onClick={() => handleDelete(p.id)} danger title="Supprimer" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === 'stats' && (
        <div className="space-y-6">
          <div className="card p-6">
            <div className="mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-gold-400" />
              <h3 className="font-semibold text-white">Produits les plus vendus</h3>
            </div>
            {chartData.length === 0 ? (
              <p className="text-zinc-500">Pas encore de ventes enregistrées</p>
            ) : (
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={chartData} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                  <XAxis type="number" stroke="#71717a" fontSize={12} />
                  <YAxis type="category" dataKey="name" stroke="#71717a" fontSize={11} width={120} />
                  <Tooltip
                    contentStyle={{ background: '#1a1a1f', border: '1px solid #ffffff20', borderRadius: 12 }}
                    formatter={(v: number, name: string) =>
                      name === 'ca' ? [formatCurrency(v), 'CA'] : [v, 'Unités vendues']
                    }
                  />
                  <Bar dataKey="ventes" fill="#b8873a" radius={[0, 4, 4, 0]} name="ventes" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="card overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 text-xs uppercase text-zinc-500">
                  <th className="px-6 py-3">Rang</th>
                  <th className="px-6 py-3">Produit</th>
                  <th className="px-6 py-3">Quantité vendue</th>
                  <th className="px-6 py-3">Chiffre d'affaires</th>
                </tr>
              </thead>
              <tbody>
                {bestSellers.map((b, i) => (
                  <tr key={b.productId} className="border-b border-white/5">
                    <td className="px-6 py-3">
                      <span className={`font-bold ${i === 0 ? 'text-gold-400' : 'text-zinc-400'}`}>#{i + 1}</span>
                    </td>
                    <td className="px-6 py-3 font-medium text-white">{b.nom}</td>
                    <td className="px-6 py-3">{b.quantiteVendue}</td>
                    <td className="px-6 py-3 text-gold-400">{formatCurrency(Number(b.chiffreAffaires))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'detail' && selected && (
        <div className="space-y-6">
          <div className="card p-6">
            <h3 className="font-display text-2xl font-semibold text-white">{selected.nom}</h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <MiniStat icon={Heart} label="J'aimes" value={selected.nombreJaimes} color="text-red-400" />
              <MiniStat icon={MessageCircle} label="Commentaires" value={selected.nombreCommentaires} color="text-blue-400" />
              <MiniStat icon={Star} label="Note moyenne" value={`${selected.noteMoyenne}/5`} color="text-amber-400" />
              <MiniStat icon={TrendingUp} label="Vendus" value={selected.quantiteVendue} color="text-emerald-400" />
            </div>
            <p className="mt-4 text-sm text-zinc-500">
              CA produit : <span className="text-gold-400">{formatCurrency(Number(selected.chiffreAffaires))}</span>
              {' · '}{selected.nombreAvis} avis
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="card p-6">
              <h4 className="mb-4 flex items-center gap-2 font-semibold text-white">
                <Heart className="h-4 w-4 text-red-400" /> J'aimes ({selected.jaimes.length})
              </h4>
              {selected.jaimes.length === 0 ? (
                <p className="text-sm text-zinc-500">Aucun j'aime pour ce produit</p>
              ) : (
                <ul className="space-y-2">
                  {selected.jaimes.map((j) => (
                    <li key={j.id} className="flex justify-between rounded-xl bg-ink-800/50 px-4 py-3 text-sm">
                      <span className="text-white">{j.userNom ?? `User #${j.userId}`}</span>
                      <span className="text-zinc-500">{formatDate(j.createdAt)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="card p-6">
              <h4 className="mb-4 flex items-center gap-2 font-semibold text-white">
                <MessageCircle className="h-4 w-4 text-blue-400" /> Commentaires ({selected.commentaires.length})
              </h4>
              {selected.commentaires.length === 0 ? (
                <p className="text-sm text-zinc-500">Aucun commentaire</p>
              ) : (
                <ul className="max-h-80 space-y-3 overflow-y-auto">
                  {selected.commentaires.map((c) => (
                    <li key={c.id} className="rounded-xl bg-ink-800/50 px-4 py-3">
                      <div className="mb-1 flex justify-between text-xs text-zinc-500">
                        <span>{c.userNom ?? `User #${c.userId}`}</span>
                        <span>{formatDate(c.createdAt)}</span>
                      </div>
                      <p className="text-sm text-zinc-300">{c.contenu}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  required,
  textarea,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
  required?: boolean
  textarea?: boolean
}) {
  return (
    <div>
      <label className="label">{label}</label>
      {textarea ? (
        <textarea className="input min-h-[80px] resize-y" value={value} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input className="input" type={type} value={value} onChange={(e) => onChange(e.target.value)} required={required} step={type === 'number' ? '0.01' : undefined} />
      )}
    </div>
  )
}

function ActionBtn({
  icon: Icon,
  onClick,
  danger,
  title,
}: {
  icon: typeof Eye
  onClick: () => void
  danger?: boolean
  title: string
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`rounded-lg p-2 transition ${
        danger ? 'text-zinc-500 hover:bg-red-500/10 hover:text-red-400' : 'text-zinc-500 hover:bg-white/5 hover:text-gold-400'
      }`}
    >
      <Icon className="h-4 w-4" />
    </button>
  )
}

function MiniStat({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: typeof Heart
  label: string
  value: string | number
  color: string
}) {
  return (
    <div className="rounded-xl bg-ink-800/50 p-4">
      <Icon className={`mb-2 h-5 w-5 ${color}`} />
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="text-xl font-bold text-white">{value}</p>
    </div>
  )
}
