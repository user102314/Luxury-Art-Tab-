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
  Tags,
  FolderPlus,
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
import type { Category, Product, ProductAnalytics, ProductImage, ProductStatut } from '../types'

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
  const path = url.startsWith('/') ? url : `/${url}`
  const apiBase = import.meta.env.VITE_API_URL as string | undefined
  if (apiBase && /^https?:\/\//i.test(apiBase)) {
    try {
      return `${new URL(apiBase).origin}${path}`
    } catch {
      /* fallthrough */
    }
  }
  return path
}

function parseStock(raw: string): number | null {
  const cleaned = String(raw ?? '').trim().replace(/\s/g, '').replace(',', '.')
  if (!cleaned) return null
  const n = Number.parseInt(cleaned, 10)
  if (!Number.isFinite(n) || n < 0) return null
  return n
}

function emptyAnalytics(productId: number, nom = ''): ProductAnalytics {
  return {
    productId,
    nom,
    nombreJaimes: 0,
    nombreCommentaires: 0,
    nombreAvis: 0,
    noteMoyenne: 0,
    quantiteVendue: 0,
    chiffreAffaires: 0,
    jaimes: [],
    commentaires: [],
  }
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

  const [showCategoryForm, setShowCategoryForm] = useState(false)
  const [showCategoryManager, setShowCategoryManager] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [categoryNom, setCategoryNom] = useState('')
  const [categoryDesc, setCategoryDesc] = useState('')
  const [categoryError, setCategoryError] = useState('')
  const [savingCategory, setSavingCategory] = useState(false)

  const categoryMap = Object.fromEntries(categories.map((c) => [c.id, c.nom]))

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
    setShowCategoryForm(false)
    setCategoryNom('')
    setCategoryDesc('')
    setCategoryError('')
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
    setShowCategoryForm(false)
    setCategoryNom('')
    setCategoryDesc('')
    setCategoryError('')
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

  const resetCategoryFields = () => {
    setCategoryNom('')
    setCategoryDesc('')
    setCategoryError('')
    setEditingCategory(null)
    setShowCategoryForm(false)
  }

  const startEditCategory = (category: Category) => {
    setEditingCategory(category)
    setCategoryNom(category.nom)
    setCategoryDesc(category.description ?? '')
    setCategoryError('')
    setShowCategoryForm(true)
  }

  const handleSaveCategory = async (e?: React.FormEvent) => {
    e?.preventDefault()
    setCategoryError('')
    const nom = categoryNom.trim()
    if (!nom) {
      setCategoryError('Le nom de la catégorie est obligatoire')
      return
    }
    const duplicate = categories.some(
      (c) =>
        c.nom.toLowerCase() === nom.toLowerCase() &&
        c.id !== editingCategory?.id,
    )
    if (duplicate) {
      setCategoryError('Cette catégorie existe déjà')
      return
    }

    setSavingCategory(true)
    try {
      const payload = {
        nom,
        description: categoryDesc.trim() || undefined,
      }
      if (editingCategory) {
        await api.updateCategory(editingCategory.id, payload)
        await invalidate.categories()
        resetCategoryFields()
      } else {
        const created = await api.createCategory(payload)
        await invalidate.categories()
        setForm((prev) => ({ ...prev, categoryId: String(created.id) }))
        resetCategoryFields()
      }
    } catch (err) {
      setCategoryError(
        err instanceof Error
          ? err.message
          : editingCategory
            ? 'Erreur lors de la modification'
            : 'Erreur lors de la création',
      )
    } finally {
      setSavingCategory(false)
    }
  }

  const handleDeleteCategory = async (id: number) => {
    const used = products.some((p) => p.categoryId === id)
    if (used) {
      alert('Impossible de supprimer : des produits utilisent cette catégorie.')
      return
    }
    if (!confirm('Supprimer cette catégorie ?')) return
    try {
      await api.deleteCategory(id)
      await invalidate.categories()
      if (form.categoryId === String(id)) {
        setForm((prev) => ({
          ...prev,
          categoryId: categories.find((c) => c.id !== id)?.id?.toString() ?? '',
        }))
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Suppression impossible')
    }
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
    const stock = parseStock(form.stock)
    if (stock == null) {
      setError('Stock invalide — saisissez un entier ≥ 0')
      setUploading(false)
      return
    }
    const categoryId = parseInt(form.categoryId, 10)
    if (!Number.isFinite(categoryId) || categoryId <= 0) {
      setError('Choisissez ou créez une catégorie')
      setUploading(false)
      return
    }
    const payload = {
      nom: form.nom.trim(),
      description: form.description,
      prix: Number(form.prix),
      stock,
      categoryId,
      statut: form.statut,
    }
    if (!Number.isFinite(payload.prix) || payload.prix <= 0) {
      setError('Prix invalide')
      setUploading(false)
      return
    }
    try {
      let productId: number
      let saved: Product
      if (editing) {
        saved = await api.updateProduct(editing.id, payload)
        productId = saved.id
      } else {
        saved = await api.createProduct(payload)
        productId = saved.id
      }

      // Vérifie que le stock renvoyé par l'API correspond à la saisie
      if (Number(saved.stock) !== stock) {
        setError(
          `Attention: stock enregistré = ${saved.stock} (saisi = ${stock}). Une commande a peut‑être décrémenté le stock.`,
        )
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

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)

  const openDetail = async (id: number) => {
    const fromList = products.find((p) => p.id === id) ?? null
    setSelectedProduct(fromList)
    setSelected(emptyAnalytics(id, fromList?.nom ?? ''))
    setTab('detail')
    setError('')

    try {
      const product = await api.getProduct(id)
      setSelectedProduct(product)
      setSelected((prev) =>
        prev ? { ...prev, nom: product.nom || prev.nom, productId: product.id } : emptyAnalytics(product.id, product.nom),
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Impossible de charger le produit')
    }

    try {
      const analytics = await queryClient.fetchQuery({
        queryKey: queryKeys.productAnalytics(id),
        queryFn: () => api.getProductAnalytics(id),
      })
      setSelected(analytics)
    } catch {
      // Détails produit restent visibles même si analytics échoue
    }
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
          <p className="text-sm text-zinc-500">CRUD, catégories, j'aimes, commentaires et statistiques</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              setShowCategoryManager(true)
              setShowCategoryForm(true)
              setCategoryNom('')
              setCategoryDesc('')
              setCategoryError('')
            }}
            className="btn-ghost"
          >
            <Tags className="h-4 w-4" />
            Catégories
          </button>
          <button type="button" onClick={openCreate} className="btn-primary">
            <Plus className="h-4 w-4" />
            Nouveau produit
          </button>
        </div>
      </div>

      <div className="flex gap-2">
        {(['catalogue', 'stats', 'detail'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            disabled={t === 'detail' && !selectedProduct && !selected}
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
                <Field label="Prix (DH)" value={form.prix} onChange={(v) => setForm({ ...form, prix: v })} type="number" step="0.01" required />
                <Field
                  label="Stock"
                  value={form.stock}
                  onChange={(v) => setForm({ ...form, stock: v.replace(/[^\d]/g, '') })}
                  type="text"
                  inputMode="numeric"
                  required
                />
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
                <div className="mb-1 flex items-center justify-between gap-2">
                  <label className="label mb-0">Catégorie</label>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCategoryForm((v) => !v)
                      setCategoryError('')
                    }}
                    className="inline-flex items-center gap-1 text-xs font-medium text-gold-400 hover:text-gold-300"
                  >
                    <FolderPlus className="h-3.5 w-3.5" />
                    {showCategoryForm ? 'Masquer' : 'Nouvelle catégorie'}
                  </button>
                </div>
                <select
                  className="input"
                  value={form.categoryId}
                  onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                  required
                >
                  <option value="" className="bg-ink-800">
                    {categories.length === 0 ? 'Aucune catégorie — créez-en une' : 'Choisir une catégorie…'}
                  </option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id} className="bg-ink-800">
                      {c.nom}
                    </option>
                  ))}
                </select>

                {showCategoryForm && (
                  <div className="mt-3 space-y-3 rounded-xl border border-gold-500/20 bg-gold-500/5 p-4">
                    <p className="text-xs text-zinc-400">
                      La nouvelle catégorie sera sélectionnée automatiquement pour ce produit.
                    </p>
                    <div>
                      <label className="label">Nom *</label>
                      <input
                        className="input"
                        value={categoryNom}
                        onChange={(e) => setCategoryNom(e.target.value)}
                        placeholder="Ex. Décoration murale"
                      />
                    </div>
                    <div>
                      <label className="label">Description</label>
                      <textarea
                        className="input min-h-[60px]"
                        value={categoryDesc}
                        onChange={(e) => setCategoryDesc(e.target.value)}
                        placeholder="Optionnel"
                      />
                    </div>
                    {categoryError && <p className="text-sm text-red-400">{categoryError}</p>}
                    <button
                      type="button"
                      disabled={savingCategory}
                      onClick={() => handleSaveCategory()}
                      className="btn-primary w-full text-sm"
                    >
                      {savingCategory ? 'Enregistrement…' : 'Créer la catégorie'}
                    </button>
                  </div>
                )}
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

      {showCategoryManager && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="card max-h-[90vh] w-full max-w-lg overflow-y-auto p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-white">Catégories</h3>
                <p className="text-sm text-zinc-500">Créer et gérer les catégories produits</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowCategoryManager(false)
                  resetCategoryFields()
                }}
                className="text-zinc-500 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="mb-6 space-y-3 rounded-xl border border-white/10 bg-ink-800/40 p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium text-white">
                  {editingCategory ? `Modifier « ${editingCategory.nom} »` : 'Nouvelle catégorie'}
                </p>
                {editingCategory && (
                  <button
                    type="button"
                    onClick={resetCategoryFields}
                    className="text-xs text-zinc-500 hover:text-white"
                  >
                    Annuler
                  </button>
                )}
              </div>
              <div>
                <label className="label">Nom *</label>
                <input
                  className="input"
                  value={categoryNom}
                  onChange={(e) => setCategoryNom(e.target.value)}
                  placeholder="Ex. Cuisine, Enfant…"
                  required
                />
              </div>
              <div>
                <label className="label">Description</label>
                <textarea
                  className="input min-h-[60px]"
                  value={categoryDesc}
                  onChange={(e) => setCategoryDesc(e.target.value)}
                  placeholder="Optionnel"
                />
              </div>
              {categoryError && <p className="text-sm text-red-400">{categoryError}</p>}
              <button type="submit" disabled={savingCategory} className="btn-primary w-full">
                {editingCategory ? <Pencil className="h-4 w-4" /> : <FolderPlus className="h-4 w-4" />}
                {savingCategory
                  ? 'Enregistrement…'
                  : editingCategory
                    ? 'Enregistrer les modifications'
                    : 'Ajouter la catégorie'}
              </button>
            </form>

            <div className="space-y-2">
              <p className="text-xs uppercase tracking-wider text-zinc-500">
                Liste ({categories.length})
              </p>
              {categories.length === 0 ? (
                <p className="py-6 text-center text-sm text-zinc-500">Aucune catégorie pour le moment</p>
              ) : (
                categories.map((c) => {
                  const count = products.filter((p) => p.categoryId === c.id).length
                  const isEditing = editingCategory?.id === c.id
                  return (
                    <div
                      key={c.id}
                      className={`flex items-start justify-between gap-3 rounded-xl px-4 py-3 ${
                        isEditing ? 'bg-gold-500/10 ring-1 ring-gold-500/30' : 'bg-ink-800/50'
                      }`}
                    >
                      <div>
                        <p className="font-medium text-white">{c.nom}</p>
                        {c.description && (
                          <p className="mt-0.5 text-xs text-zinc-500">{c.description}</p>
                        )}
                        <p className="mt-1 text-xs text-zinc-600">
                          {count} produit{count !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <button
                          type="button"
                          title="Modifier"
                          onClick={() => startEditCategory(c)}
                          className="rounded-lg p-2 text-zinc-500 hover:bg-gold-500/10 hover:text-gold-300"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          title="Supprimer"
                          onClick={() => handleDeleteCategory(c.id)}
                          className="rounded-lg p-2 text-zinc-500 hover:bg-red-500/10 hover:text-red-400"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
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
                  <th className="px-6 py-4">Catégorie</th>
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
                    <td className="px-6 py-4 text-zinc-300">
                      {categoryMap[p.categoryId] ?? `#${p.categoryId}`}
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

      {tab === 'detail' && (selectedProduct || selected) && (
        <div className="space-y-6">
          {error && <p className="text-sm text-red-400">{error}</p>}
          <div className="card overflow-hidden">
            <div className="grid gap-6 p-6 lg:grid-cols-[240px_1fr]">
              <div className="space-y-3">
                {(() => {
                  const imgs =
                    selectedProduct?.images && selectedProduct.images.length > 0
                      ? selectedProduct.images
                      : selectedProduct?.imageUrl
                        ? [
                            {
                              id: 0,
                              productId: selectedProduct.id,
                              url: selectedProduct.imageUrl,
                              storagePath: '',
                              ordre: 0,
                            },
                          ]
                        : []
                  if (imgs.length === 0) {
                    return (
                      <div className="flex aspect-square items-center justify-center rounded-xl bg-ink-800">
                        <ImageIcon className="h-12 w-12 text-zinc-600" />
                      </div>
                    )
                  }
                  return (
                    <div className="grid grid-cols-2 gap-2 lg:grid-cols-1">
                      {imgs.map((img) => (
                        <img
                          key={img.id || img.url}
                          src={resolveImageSrc(img.url)}
                          alt={selectedProduct?.nom ?? selected?.nom ?? 'Produit'}
                          className="aspect-square w-full rounded-xl object-cover ring-1 ring-white/10"
                          onError={(e) => {
                            e.currentTarget.src =
                              'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect fill="%23222" width="200" height="200"/></svg>'
                          }}
                        />
                      ))}
                    </div>
                  )
                })()}
              </div>
              <div>
                <h3 className="font-display text-2xl font-semibold text-white">
                  {selectedProduct?.nom ?? selected?.nom ?? 'Produit'}
                </h3>
                <p className="mt-2 text-sm text-zinc-400 whitespace-pre-wrap">
                  {selectedProduct?.description || 'Aucune description'}
                </p>
                <div className="mt-4 flex flex-wrap gap-4 text-sm">
                  <span className="text-gold-400 font-semibold">
                    {formatCurrency(Number(selectedProduct?.prix ?? 0))}
                  </span>
                  <span className="text-zinc-300">Stock : {selectedProduct?.stock ?? '—'}</span>
                  <span className="rounded-lg bg-white/5 px-2 py-0.5 text-xs">
                    {selectedProduct?.statut ?? '—'}
                  </span>
                  <span className="text-zinc-400">
                    {selectedProduct?.categoryId
                      ? categoryMap[selectedProduct.categoryId] ?? `Catégorie #${selectedProduct.categoryId}`
                      : '—'}
                  </span>
                </div>
                {selected && (
                  <>
                    <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                      <MiniStat icon={Heart} label="J'aimes" value={selected.nombreJaimes} color="text-red-400" />
                      <MiniStat icon={MessageCircle} label="Commentaires" value={selected.nombreCommentaires} color="text-blue-400" />
                      <MiniStat icon={Star} label="Note moyenne" value={`${selected.noteMoyenne}/5`} color="text-amber-400" />
                      <MiniStat icon={TrendingUp} label="Vendus" value={selected.quantiteVendue} color="text-emerald-400" />
                    </div>
                    <p className="mt-4 text-sm text-zinc-500">
                      CA produit :{' '}
                      <span className="text-gold-400">{formatCurrency(Number(selected.chiffreAffaires))}</span>
                      {' · '}
                      {selected.nombreAvis} avis
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>

          {selected && (
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
          )}
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
  step,
  inputMode,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
  required?: boolean
  textarea?: boolean
  step?: string
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode']
}) {
  return (
    <div>
      <label className="label">{label}</label>
      {textarea ? (
        <textarea className="input min-h-[80px] resize-y" value={value} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input
          className="input"
          type={type}
          inputMode={inputMode}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          step={step ?? (type === 'number' ? '0.01' : undefined)}
          min={type === 'number' ? '0' : undefined}
          onWheel={type === 'number' ? (e) => e.currentTarget.blur() : undefined}
        />
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
