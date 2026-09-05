import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from '@tanstack/react-router'
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
  ArrowUp,
  LayoutGrid,
  List,
} from 'lucide-react'
import { toast } from 'sonner'
import { api, formatCurrency, formatDate } from '../lib/api'
import { PageSkeleton, QueryStatusBar } from '../components/QueryStatusBar'
import { ListToolbar } from '../components/ListToolbar'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../components/ui/alert-dialog'
import {
  useBestSellers,
  useCatalogPricing,
  useCategories,
  useInvalidateAdmin,
  useProducts,
} from '../hooks/useAdminQueries'
import { queryKeys } from '../lib/queryKeys'
import type { Category, Product, ProductAnalytics, ProductImage, ProductStatut } from '../types'
import { compareNumbers, compareStrings, matchesSearch, type SortDir } from '../lib/listUtils'
import { compareDisplayOrder, compareProductRefs, refMatchesSearch } from '@/lib/productSort'
import { availableCadres, formatDimensionLabel } from '@/lib/pricing'

const STATUTS: ProductStatut[] = ['DISPONIBLE', 'RUPTURE_STOCK', 'ARCHIVE']

const emptyForm = {
  ref: 'B',
  description: '',
  categoryId: '',
  statut: 'DISPONIBLE' as ProductStatut,
  dimensionIds: [] as number[],
}

function defaultTraditionCategoryId(categories: Category[]): string {
  const match = categories.find((c) =>
    c.nom.toLowerCase().includes('traditionnel'),
  )
  return String(match?.id ?? categories[0]?.id ?? '')
}

type Tab = 'catalogue' | 'stats' | 'detail'
type ProductSortKey = 'ref' | 'prix' | 'category' | 'priorite'
type CatalogView = 'list' | 'grid'

import { resolveImageSrc as resolveMediaUrl } from '@/lib/images'

function resolveImageSrc(url?: string) {
  if (!url) return undefined
  if (url.startsWith('blob:') || url.startsWith('data:')) return url
  const resolved = resolveMediaUrl(url)
  return resolved === '/placeholder-art.svg' && !url ? undefined : resolved
}

function emptyAnalytics(productId: number, ref = ''): ProductAnalytics {
  return {
    productId,
    ref,
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
  const { data: products = [], isLoading, isFetching, error: productsError } = useProducts()
  const { data: categories = [] } = useCategories()
  const { data: catalog } = useCatalogPricing()
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

  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean
    title: string
    description: string
    onConfirm: () => void
  }>({
    isOpen: false,
    title: '',
    description: '',
    onConfirm: () => {},
  })

  const [showCategoryForm, setShowCategoryForm] = useState(false)
  const [categoryNom, setCategoryNom] = useState('')
  const [categoryDesc, setCategoryDesc] = useState('')
  const [categoryError, setCategoryError] = useState('')
  const [savingCategory, setSavingCategory] = useState(false)

  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('ALL')
  const [statutFilter, setStatutFilter] = useState('ALL')
  const [sort, setSort] = useState<ProductSortKey>('ref')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [viewMode, setViewMode] = useState<CatalogView>('grid')
  const [promotingId, setPromotingId] = useState<number | null>(null)

  const categoryMap = Object.fromEntries(categories.map((c) => [c.id, c.nom]))
  const heroProductByCategory = Object.fromEntries(
    categories
      .filter((c) => c.heroProductId != null)
      .map((c) => [c.id, c.heroProductId as number]),
  )

  const filteredProducts = useMemo(() => {
    let list = products.filter((p) => {
      if (categoryFilter !== 'ALL' && String(p.categoryId) !== categoryFilter) return false
      if (statutFilter !== 'ALL' && p.statut !== statutFilter) return false
      if (search) {
        const term = search.trim()
        const refHit = refMatchesSearch(p.ref, term)
        const metaHit = matchesSearch(term, [p.description, categoryMap[p.categoryId]])
        if (!refHit && !metaHit) return false
      }
      return true
    })
    list = [...list].sort((a, b) => {
      switch (sort) {
        case 'prix':
          return compareNumbers(Number(a.prix) || 0, Number(b.prix) || 0, sortDir)
        case 'category':
          return compareStrings(
            categoryMap[a.categoryId] ?? '',
            categoryMap[b.categoryId] ?? '',
            sortDir,
          )
        case 'priorite':
          return sortDir === 'asc'
            ? compareDisplayOrder(a, b)
            : compareDisplayOrder(b, a)
        case 'ref':
        default:
          return sortDir === 'asc'
            ? compareProductRefs(a.ref, b.ref)
            : compareProductRefs(b.ref, a.ref)
      }
    })
    return list
  }, [products, search, categoryFilter, statutFilter, sort, sortDir, categoryMap])

  useEffect(() => {
    const urls = pendingFiles.map((file) => URL.createObjectURL(file))
    setPreviewUrls(urls)
    return () => urls.forEach((url) => URL.revokeObjectURL(url))
  }, [pendingFiles])

  /** Rafraîchit la liste sans bloquer l'UI (best-sellers en arrière-plan). */
  const refreshProducts = () => {
    void invalidate.products()
    void invalidate.bestSellers()
  }

  const promoteProduct = async (id: number) => {
    setPromotingId(id)
    try {
      const updated = await api.promoteProduct(id, true)
      toast.success(`${updated.ref} est maintenant en 1ʳᵉ position de sa catégorie`)
      refreshProducts()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Impossible de changer la priorité')
    } finally {
      setPromotingId(null)
    }
  }

  const setAsCategoryHero = async (id: number) => {
    setPromotingId(id)
    try {
      const updated = await api.setProductAsCategoryHero(id)
      toast.success(`${updated.ref} représente maintenant sa catégorie dans le hero`)
      refreshProducts()
      void invalidate.categories()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Impossible de définir le hero')
    } finally {
      setPromotingId(null)
    }
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
    const defaultDims =
      catalog?.dimensions
        ?.filter((d) => catalog.tarifs.some((t) => t.dimensionId === d.id && t.prix != null))
        .map((d) => d.id) ?? []
    setForm({
      ...emptyForm,
      categoryId: defaultTraditionCategoryId(categories),
      dimensionIds: defaultDims.length ? defaultDims : catalog?.dimensions.map((d) => d.id) ?? [],
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
      ref: p.ref ?? '',
      description: p.description ?? '',
      categoryId: String(p.categoryId),
      statut: p.statut as ProductStatut,
      dimensionIds: p.dimensionIds ?? p.dimensions?.map((d) => d.id) ?? [],
    })
    setShowForm(true)
    setError('')
  }

  const resetCategoryFields = () => {
    setCategoryNom('')
    setCategoryDesc('')
    setCategoryError('')
    setShowCategoryForm(false)
  }

  const handleSaveCategory = async (e?: React.FormEvent) => {
    e?.preventDefault()
    setCategoryError('')
    const nom = categoryNom.trim()
    if (!nom) {
      setCategoryError('Le nom de la catégorie est obligatoire')
      return
    }
    const duplicate = categories.some((c) => c.nom.toLowerCase() === nom.toLowerCase())
    if (duplicate) {
      setCategoryError('Cette catégorie existe déjà')
      return
    }

    setSavingCategory(true)
    try {
      const created = await api.createCategory({
        nom,
        description: categoryDesc.trim() || undefined,
      })
      await invalidate.categories()
      setForm((prev) => ({ ...prev, categoryId: String(created.id) }))
      resetCategoryFields()
    } catch (err) {
      setCategoryError(err instanceof Error ? err.message : 'Erreur lors de la création')
    } finally {
      setSavingCategory(false)
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

  const removeExistingImage = (imageId: number) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Supprimer cette image ?',
      description: 'Cette action est irréversible et supprimera définitivement l\'image.',
      onConfirm: async () => {
        await api.deleteProductImage(imageId)
        setExistingImages((prev) => prev.filter((img) => img.id !== imageId))
        await refreshProducts()
      }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setUploading(true)
    const categoryId = parseInt(form.categoryId, 10)
    if (!Number.isFinite(categoryId) || categoryId <= 0) {
      setError('Choisissez ou créez une catégorie')
      setUploading(false)
      return
    }
    if (form.dimensionIds.length === 0) {
      setError('Sélectionnez au moins une dimension pour ce tableau')
      setUploading(false)
      return
    }
    const payload = {
      ref: form.ref.trim(),
      description: form.description.trim() || undefined,
      categoryId,
      statut: form.statut,
      dimensionIds: form.dimensionIds,
    }
    if (!payload.ref) {
      setError('La référence produit est obligatoire')
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

      // Fermer le formulaire dès que le produit est sauvé — l'upload peut continuer
      // sans bloquer le bouton « Enregistrer » plus longtemps que nécessaire.
      const filesToUpload = [...pendingFiles]
      setShowForm(false)
      setPendingFiles([])
      refreshProducts()

      if (filesToUpload.length > 0) {
        try {
          await api.uploadProductImages(productId, filesToUpload)
          refreshProducts()
        } catch (uploadErr) {
          setError(
            `Produit enregistré, mais erreur upload images: ${
              uploadErr instanceof Error ? uploadErr.message : 'Erreur inconnue'
            }`,
          )
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'enregistrement')
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = (id: number) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Supprimer ce produit ?',
      description: 'Êtes-vous sûr de vouloir supprimer définitivement ce produit ?',
      onConfirm: async () => {
        await api.deleteProduct(id)
        if (selected?.productId === id) {
          setSelected(null)
          setTab('catalogue')
        }
        await refreshProducts()
      }
    })
  }

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)

  const openDetail = async (id: number) => {
    const fromList = products.find((p) => p.id === id) ?? null
    setSelectedProduct(fromList)
    setSelected(emptyAnalytics(id, fromList?.ref ?? ''))
    setTab('detail')
    setError('')

    try {
      const product = await api.getProduct(id)
      setSelectedProduct(product)
      setSelected((prev) =>
        prev ? { ...prev, ref: product.ref || prev.ref, productId: product.id } : emptyAnalytics(product.id, product.ref),
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
    name: b.ref.length > 18 ? b.ref.slice(0, 18) + '…' : b.ref,
    ventes: b.quantiteVendue,
    ca: Number(b.chiffreAffaires),
  }))

  return (
    <div className="space-y-6">
      <QueryStatusBar fetching={isFetching} />
      {productsError && (
        <p className="text-sm text-red-400">
          {productsError instanceof Error ? productsError.message : 'Impossible de charger les produits'}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-white">Gestion des produits</h2>
          <p className="text-sm text-zinc-500">CRUD, catégories, j'aimes, commentaires et statistiques</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/admin/categories" className="btn-ghost">
            <Tags className="h-4 w-4" />
            Catégories
          </Link>
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
              <Field label="Réf. produit" value={form.ref} onChange={(v) => setForm({ ...form, ref: v })} required placeholder="Ex. TAB-001" />
              <Field label="Description (optionnel)" value={form.description} onChange={(v) => setForm({ ...form, description: v })} textarea />
              <div>
                <label className="label">Dimensions de ce tableau</label>
                <p className="mb-2 text-xs text-zinc-500">
                  Le prix vient de la grille globale (page Tarifs). Cochez les formats disponibles pour cette œuvre.
                  Les formats sans tarif apparaissent en boutique mais ne sont pas commandables.
                </p>
                <div className="grid max-h-48 grid-cols-2 gap-2 overflow-y-auto rounded-xl bg-ink-800/50 p-3">
                  {(catalog?.dimensions ?? []).map((dim) => {
                    const checked = form.dimensionIds.includes(dim.id)
                    const priced = catalog ? availableCadres(catalog, dim.id).length > 0 : true
                    return (
                      <label key={dim.id} className="flex cursor-pointer items-center gap-2 text-sm text-zinc-300">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() =>
                            setForm((prev) => ({
                              ...prev,
                              dimensionIds: checked
                                ? prev.dimensionIds.filter((id) => id !== dim.id)
                                : [...prev.dimensionIds, dim.id],
                            }))
                          }
                        />
                        <span>
                          {formatDimensionLabel(dim)}
                          {checked && !priced && (
                            <span className="ml-1 text-amber-400">(tarif manquant)</span>
                          )}
                        </span>
                      </label>
                    )
                  })}
                  {(catalog?.dimensions ?? []).length === 0 && (
                    <p className="col-span-2 text-xs text-zinc-500">
                      Aucune dimension — créez-les dans Tarifs &amp; cadres.
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="label">Images produit</label>
                <p className="mb-2 text-xs text-zinc-500">
                  Image 1 = catalogue · Image 2 = simulation AR (sans fond, obligatoire pour la caméra)
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
                    {existingImages
                      .slice()
                      .sort((a, b) => a.ordre - b.ordre)
                      .map((img) => (
                      <div key={img.id} className="group relative aspect-square overflow-hidden rounded-lg bg-ink-800">
                        <img
                          src={resolveImageSrc(img.url)}
                          alt={img.storagePath}
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect fill="%23333" width="100" height="100"/></svg>'
                          }}
                        />
                        <span className="absolute bottom-1 left-1 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                          {img.ordre === 1 ? 'Img 2 · AR' : img.ordre === 0 ? 'Img 1' : `Img ${img.ordre + 1}`}
                        </span>
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

      {tab === 'catalogue' && (
        <>
          <ListToolbar
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Rechercher produit, description, catégorie…"
            sort={sort}
            onSortChange={(v) => setSort(v as ProductSortKey)}
            sortOptions={[
              { value: 'priorite', label: 'Priorité affichage' },
              { value: 'ref', label: 'Réf.' },
              { value: 'prix', label: 'Prix de départ' },
              { value: 'category', label: 'Catégorie' },
            ]}
            sortDir={sortDir}
            onSortDirChange={setSortDir}
            resultCount={filteredProducts.length}
            totalCount={products.length}
            onReset={() => {
              setSearch('')
              setCategoryFilter('ALL')
              setStatutFilter('ALL')
              setSort('priorite')
              setSortDir('asc')
            }}
            filters={[
              {
                id: 'category',
                label: 'Catégorie',
                value: categoryFilter,
                onChange: setCategoryFilter,
                options: [
                  { value: 'ALL', label: 'Toutes catégories' },
                  ...categories.map((c) => ({ value: String(c.id), label: c.nom })),
                ],
              },
              {
                id: 'statut',
                label: 'Statut',
                value: statutFilter,
                onChange: setStatutFilter,
                options: [
                  { value: 'ALL', label: 'Tous statuts' },
                  ...STATUTS.map((s) => ({ value: s, label: s.replace('_', ' ') })),
                ],
              },
            ]}
          />
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-zinc-500">
              Flèche : avance d’une place dans sa catégorie. Double-clic (flèche ou produit) : affiché en premier.
            </p>
            <div className="flex rounded-xl border border-white/10 p-1">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                  viewMode === 'grid' ? 'bg-gold-500/20 text-gold-300' : 'text-zinc-500 hover:text-white'
                }`}
              >
                <LayoutGrid className="mr-1 inline h-3.5 w-3.5" />
                Grille
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                  viewMode === 'list' ? 'bg-gold-500/20 text-gold-300' : 'text-zinc-500 hover:text-white'
                }`}
              >
                <List className="mr-1 inline h-3.5 w-3.5" />
                Colonnes
              </button>
            </div>
          </div>
        <div className={viewMode === 'grid' ? '' : 'card overflow-hidden'}>
          {isLoading && products.length === 0 ? (
            <PageSkeleton rows={5} />
          ) : products.length === 0 ? (
            <div className="card p-12 text-center">
              <Package className="mx-auto mb-3 h-10 w-10 text-zinc-600" />
              <p className="text-zinc-500">Aucun produit — créez-en un</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="card p-12 text-center">
              <Package className="mx-auto mb-3 h-10 w-10 text-zinc-600" />
              <p className="text-zinc-500">Aucun produit ne correspond aux filtres</p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
              {filteredProducts.map((p) => {
                const isHero = heroProductByCategory[p.categoryId] === p.id
                return (
                <article
                  key={p.id}
                  className="card overflow-hidden transition hover:ring-1 hover:ring-gold-500/40"
                >
                  <div className="relative aspect-[4/5] bg-ink-800">
                    {p.imageUrl || p.images?.[0]?.url ? (
                      <img
                        src={resolveImageSrc(p.images?.[0]?.url ?? p.imageUrl)}
                        alt={p.ref}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <ImageIcon className="h-8 w-8 text-zinc-600" />
                      </div>
                    )}
                    <div className="absolute left-2 top-2 flex flex-col gap-1">
                      {(p.displayOrder ?? 0) > 0 && (
                        <span className="rounded-full bg-gold-500 px-2 py-0.5 text-[11px] font-bold text-ink-950">
                          #{p.displayOrder}
                        </span>
                      )}
                      {isHero && (
                        <span className="rounded-full bg-brand-red px-2 py-0.5 text-[11px] font-bold text-white">
                          Hero
                        </span>
                      )}
                    </div>
                    <PriorityArrow
                      overlay
                      disabled={promotingId === p.id}
                      onFirst={() => promoteProduct(p.id)}
                      onHero={() => setAsCategoryHero(p.id)}
                    />
                  </div>
                  <div className="space-y-1 p-3">
                    <p className="font-mono text-xs text-gold-400">{p.ref}</p>
                    <p className="truncate text-sm text-zinc-300">
                      {categoryMap[p.categoryId] ?? `#${p.categoryId}`}
                    </p>
                    <div className="flex gap-1 pt-1">
                      <ActionBtn icon={Eye} onClick={() => openDetail(p.id)} title="Voir détails" />
                      <ActionBtn icon={Pencil} onClick={() => openEdit(p)} title="Modifier" />
                      <ActionBtn icon={Trash2} onClick={() => handleDelete(p.id)} danger title="Supprimer" />
                    </div>
                  </div>
                </article>
                )
              })}
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 text-xs uppercase text-zinc-500">
                  <th className="px-6 py-4">Priorité</th>
                  <th className="px-6 py-4">Image</th>
                  <th className="px-6 py-4">Réf.</th>
                  <th className="px-6 py-4">Produit</th>
                  <th className="px-6 py-4">Catégorie</th>
                  <th className="px-6 py-4">Prix de départ</th>
                  <th className="px-6 py-4">Dimensions</th>
                  <th className="px-6 py-4">Statut</th>
                  <th className="px-6 py-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((p) => {
                  const isHero = heroProductByCategory[p.categoryId] === p.id
                  return (
                  <tr
                    key={p.id}
                    className="border-b border-white/5 hover:bg-white/[0.02]"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="w-8 font-mono text-xs text-gold-400">
                          {(p.displayOrder ?? 0) > 0 ? `#${p.displayOrder}` : '—'}
                        </span>
                        <PriorityArrow
                          disabled={promotingId === p.id}
                          onFirst={() => promoteProduct(p.id)}
                          onHero={() => setAsCategoryHero(p.id)}
                        />
                        {isHero && (
                          <span className="rounded-full bg-brand-red px-2 py-0.5 text-[10px] font-bold text-white">
                            Hero
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {p.imageUrl || p.images?.[0]?.url ? (
                        <img
                          src={resolveImageSrc(p.images?.[0]?.url ?? p.imageUrl)}
                          alt={p.ref}
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
                    <td className="px-6 py-4 font-mono text-xs text-gold-400">{p.ref ?? '—'}</td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-white">{p.ref}</p>
                      <p className="max-w-xs truncate text-xs text-zinc-500">{p.description}</p>
                    </td>
                    <td className="px-6 py-4 text-zinc-300">
                      {categoryMap[p.categoryId] ?? `#${p.categoryId}`}
                    </td>
                    <td className="px-6 py-4 text-gold-400">
                      {p.prix != null ? `À partir de ${formatCurrency(Number(p.prix))}` : '—'}
                    </td>
                    <td className="px-6 py-4 text-xs text-zinc-400">
                      {(p.dimensions ?? []).map((d) => formatDimensionLabel(d)).join(', ') || '—'}
                    </td>
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
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
        </>
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
                    <td className="px-6 py-3 font-medium text-white">{b.ref}</td>
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
                          alt={selectedProduct?.ref ?? selected?.ref ?? 'Produit'}
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
                  {selectedProduct?.ref ?? selected?.ref ?? 'Produit'}
                </h3>
                <p className="mt-2 text-sm text-zinc-400 whitespace-pre-wrap">
                  {selectedProduct?.description || 'Aucune description'}
                </p>
                <div className="mt-4 flex flex-wrap gap-4 text-sm">
                  <span className="text-gold-400 font-semibold">
                    {selectedProduct?.prix != null
                      ? `À partir de ${formatCurrency(Number(selectedProduct.prix))}`
                      : 'Prix selon format'}
                  </span>
                  <span className="text-zinc-300">
                    {(selectedProduct?.dimensions ?? []).map((d) => formatDimensionLabel(d)).join(' · ') || 'Aucune dimension'}
                  </span>
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

      <AlertDialog
        open={confirmDialog.isOpen}
        onOpenChange={(open) => !open && setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
      >
        <AlertDialogContent className="border-white/10 bg-ink-900 text-white sm:rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmDialog.title}</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              {confirmDialog.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-white/10 bg-ink-800 text-white hover:bg-ink-700 hover:text-white">
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500/90 text-white hover:bg-red-500"
              onClick={() => {
                confirmDialog.onConfirm()
                setConfirmDialog((prev) => ({ ...prev, isOpen: false }))
              }}
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
  placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
  required?: boolean
  textarea?: boolean
  step?: string
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode']
  placeholder?: string
}) {
  return (
    <div>
      <label className="label">{label}</label>
      {textarea ? (
        <textarea
          className="input min-h-[80px] resize-y"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
      ) : (
        <input
          className="input"
          type={type}
          inputMode={inputMode}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          placeholder={placeholder}
          step={step ?? (type === 'number' ? '0.01' : undefined)}
          min={type === 'number' ? '0' : undefined}
          onWheel={type === 'number' ? (e) => e.currentTarget.blur() : undefined}
        />
      )}
    </div>
  )
}

function PriorityArrow({
  onFirst,
  onHero,
  disabled,
  overlay,
}: {
  onFirst: () => void
  onHero: () => void
  disabled?: boolean
  overlay?: boolean
}) {
  const timer = useRef<number | null>(null)

  return (
    <button
      type="button"
      disabled={disabled}
      title="Clic : 1ʳᵉ position de la catégorie · Double-clic : hero de la catégorie"
      onClick={(e) => {
        e.stopPropagation()
        if (timer.current) window.clearTimeout(timer.current)
        timer.current = window.setTimeout(() => {
          timer.current = null
          onFirst()
        }, 280)
      }}
      onDoubleClick={(e) => {
        e.stopPropagation()
        e.preventDefault()
        if (timer.current) {
          window.clearTimeout(timer.current)
          timer.current = null
        }
        onHero()
      }}
      className={
        overlay
          ? 'absolute right-2 top-2 rounded-full bg-black/70 p-2 text-gold-300 shadow-lg transition hover:bg-gold-500 hover:text-ink-950 disabled:opacity-40'
          : 'rounded-full bg-white/10 p-2 text-gold-300 transition hover:bg-gold-500 hover:text-ink-950 disabled:opacity-40'
      }
    >
      <ArrowUp className="h-4 w-4" />
    </button>
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
