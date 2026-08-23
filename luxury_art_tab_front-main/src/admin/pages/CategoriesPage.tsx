import { useMemo, useState } from 'react'
import { FolderPlus, Pencil, Tags, Trash2, X } from 'lucide-react'
import { useAdminAuth } from '../context/AdminAuthContext'
import { api } from '../lib/api'
import { PageSkeleton, QueryStatusBar } from '../components/QueryStatusBar'
import { ListToolbar } from '../components/ListToolbar'
import { useCategories, useInvalidateAdmin, useProducts } from '../hooks/useAdminQueries'
import { compareStrings, matchesSearch, type SortDir } from '../lib/listUtils'
import type { Category } from '../types'

export default function CategoriesPage() {
  const { user } = useAdminAuth()
  const { data: categories = [], isLoading, isFetching } = useCategories()
  const { data: products = [] } = useProducts()
  const invalidate = useInvalidateAdmin()

  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)
  const [nom, setNom] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<'nom' | 'products'>('nom')
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  const productCountByCategory = useMemo(() => {
    const counts: Record<number, number> = {}
    for (const p of products) {
      counts[p.categoryId] = (counts[p.categoryId] ?? 0) + 1
    }
    return counts
  }, [products])

  const filteredCategories = useMemo(() => {
    let list = categories.filter((c) =>
      matchesSearch(search, [c.nom, c.description ?? '']),
    )
    list = [...list].sort((a, b) => {
      if (sort === 'products') {
        const diff =
          (productCountByCategory[a.id] ?? 0) - (productCountByCategory[b.id] ?? 0)
        return sortDir === 'asc' ? diff : -diff
      }
      return compareStrings(a.nom, b.nom, sortDir)
    })
    return list
  }, [categories, search, sort, sortDir, productCountByCategory])

  const resetForm = () => {
    setEditing(null)
    setNom('')
    setDescription('')
    setError('')
    setShowForm(false)
  }

  const openCreate = () => {
    setEditing(null)
    setNom('')
    setDescription('')
    setError('')
    setShowForm(true)
  }

  const openEdit = (category: Category) => {
    setEditing(category)
    setNom(category.nom)
    setDescription(category.description ?? '')
    setError('')
    setShowForm(true)
  }

  const handleSave = async (e?: React.FormEvent) => {
    e?.preventDefault()
    setError('')
    const trimmedNom = nom.trim()
    if (!trimmedNom) {
      setError('Le nom de la catégorie est obligatoire')
      return
    }
    const duplicate = categories.some(
      (c) =>
        c.nom.toLowerCase() === trimmedNom.toLowerCase() &&
        c.id !== editing?.id,
    )
    if (duplicate) {
      setError('Cette catégorie existe déjà')
      return
    }

    setSaving(true)
    try {
      const payload = {
        nom: trimmedNom,
        description: description.trim() || undefined,
      }
      if (editing) {
        await api.updateCategory(editing.id, payload)
      } else {
        await api.createCategory(payload)
      }
      await invalidate.categories()
      resetForm()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'enregistrement')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = (id: number) => {
    const count = productCountByCategory[id] ?? 0
    if (count > 0) {
      alert(`Impossible de supprimer : ${count} produit(s) utilisent cette catégorie.`)
      return
    }
    const category = categories.find((c) => c.id === id)
    if (!window.confirm(`Supprimer la catégorie « ${category?.nom ?? id} » ?`)) return

    void (async () => {
      try {
        await api.deleteCategory(id)
        await invalidate.categories()
        if (editing?.id === id) resetForm()
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Suppression impossible')
      }
    })()
  }

  if (!user) return null
  if (isLoading) return <PageSkeleton rows={6} />

  return (
    <div>
      <QueryStatusBar isFetching={isFetching} />

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-xl font-semibold text-white">Catégories</h2>
          <p className="text-sm text-zinc-500">
            Créer, modifier et supprimer les catégories produits
          </p>
        </div>
        <button type="button" onClick={openCreate} className="btn-primary">
          <FolderPlus className="h-4 w-4" />
          Nouvelle catégorie
        </button>
      </div>

      {showForm && (
        <div className="card mb-6 p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-white">
              {editing ? `Modifier « ${editing.nom} »` : 'Nouvelle catégorie'}
            </h3>
            <button type="button" onClick={resetForm} className="text-zinc-500 hover:text-white">
              <X className="h-5 w-5" />
            </button>
          </div>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="label">Nom *</label>
              <input
                className="input"
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                placeholder="Ex. Affro, Femmes, Cuisine…"
                required
              />
            </div>
            <div>
              <label className="label">Description</label>
              <textarea
                className="input min-h-[80px]"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optionnel — visible dans le carrousel accueil"
              />
            </div>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <div className="flex gap-2">
              <button type="submit" disabled={saving} className="btn-primary">
                {saving ? 'Enregistrement…' : editing ? 'Enregistrer' : 'Créer la catégorie'}
              </button>
              <button type="button" onClick={resetForm} className="btn-ghost">
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      <ListToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Rechercher une catégorie…"
        sort={sort}
        onSortChange={(v) => setSort(v as 'nom' | 'products')}
        sortOptions={[
          { value: 'nom', label: 'Nom' },
          { value: 'products', label: 'Nb produits' },
        ]}
        sortDir={sortDir}
        onSortDirChange={setSortDir}
        resultCount={filteredCategories.length}
        totalCount={categories.length}
        onReset={() => {
          setSearch('')
          setSort('nom')
          setSortDir('asc')
        }}
      />

      <div className="mt-4 space-y-2">
        {filteredCategories.length === 0 ? (
          <div className="card py-12 text-center text-zinc-500">
            <Tags className="mx-auto mb-3 h-8 w-8 opacity-40" />
            Aucune catégorie trouvée
          </div>
        ) : (
          filteredCategories.map((c) => {
            const count = productCountByCategory[c.id] ?? 0
            const isEditing = editing?.id === c.id
            return (
              <div
                key={c.id}
                className={`card flex items-start justify-between gap-4 p-4 ${
                  isEditing ? 'ring-1 ring-gold-500/40' : ''
                }`}
              >
                <div className="min-w-0">
                  <p className="font-medium text-white">{c.nom}</p>
                  {c.description && (
                    <p className="mt-1 text-sm text-zinc-500">{c.description}</p>
                  )}
                  <p className="mt-2 text-xs text-zinc-600">
                    {count} produit{count !== 1 ? 's' : ''}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <button
                    type="button"
                    title="Modifier"
                    onClick={() => openEdit(c)}
                    className="rounded-lg p-2 text-zinc-500 hover:bg-gold-500/10 hover:text-gold-300"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    title="Supprimer"
                    onClick={() => handleDelete(c.id)}
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
  )
}
